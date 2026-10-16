// Verificación con un DOM REAL (jsdom) del cambio de innerHTML:
// - que Range.createContextualFragment funcione con un div desligado
// - que pintarHTML/escribirResultado/textContent se comporten como antes
// - que los datos del usuario NO se interpreten como HTML (XSS)
// Uso: node test_dom_real.js <ruta-del-repo>
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const repo = process.argv[2] || path.join(__dirname, "..");
const leer = (rel) => fs.readFileSync(path.join(repo, rel), "utf8");

(async () => {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><body>
     <main id="cuerpo"></main>
     <p id="result"></p>
     <div id="direcciones"></div>
     <input type="checkbox" id="modoTutor">
     <div id="lista-notas"></div>
     <button id="btn-cargar"></button>
     <ul id="taskList"></ul>
     <button id="addTaskButton"></button>
     <input id="taskInput" type="text">
     <table id="savedTable"><tbody></tbody></table>
   </body></html>`,
    { runScripts: "outside-only", url: "http://localhost/" },
  );
  const { window } = dom;
  const doc = window.document;

  // fetch simulado: sirve los fragmentos locales del repo
  window.fetch = (url) => Promise.resolve({ ok: true, text: () => Promise.resolve(leer(url)) });

  for (const f of [
    "scripts/redes.js",
    "scripts/scriptpass.js",
    "scripts/scriptTareas.js",
    "scripts/notas.js",
  ]) {
    window.eval(leer(f));
  }

  let fallos = 0;
  function comprobar(nombre, cond, detalle) {
    if (cond) console.log("OK   " + nombre);
    else {
      fallos++;
      console.log("FALLA " + nombre + (detalle !== undefined ? " -> " + detalle : ""));
    }
  }

  // 1. El helper con un div DESLIGADO (el punto dudoso)
  const frag = window.nodosDesdeHTML("<p>hola</p><b>1</b>");
  comprobar(
    "nodosDesdeHTML devuelve un DocumentFragment",
    frag && frag.nodeType === 11,
    frag && frag.nodeType,
  );
  comprobar(
    "nodosDesdeHTML parsea el HTML de verdad",
    frag.querySelector("b") && frag.querySelector("b").textContent === "1",
  );

  // 2. pintarHTML reemplaza el contenido (y lo interpreta como HTML)
  window.pintarHTML(doc.getElementById("direcciones"), "<b>uno</b><br>dos");
  const dirs = doc.getElementById("direcciones");
  comprobar(
    "pintarHTML reemplaza",
    dirs.children.length === 2 && dirs.querySelector("b").textContent === "uno",
  );
  window.pintarHTML(dirs, "<i>tres</i>");
  comprobar(
    "pintarHTML no acumula (reemplaza de verdad)",
    dirs.children.length === 1 && dirs.textContent === "tres",
  );

  // 3. escribirResultado AÑADE (semántica del antiguo innerHTML +=)
  window.escribirResultado("<b>primero</b>");
  window.escribirResultado("<span>segundo</span>");
  comprobar(
    "escribirResultado acumula",
    doc.getElementById("result").textContent === "primerosegundo",
  );

  // 4. Un dato del usuario NO se interpreta como HTML
  const elResult = doc.getElementById("result");
  const r = window.verClase("<img src=x onerror=alert(1)>");
  comprobar("verClase con HTML devuelve null", r === null);
  comprobar(
    "el mensaje de error es texto, no HTML",
    elResult.querySelector("img") === null && elResult.textContent.length > 0,
    elResult.innerHTML.slice(0, 60),
  );

  // 5. Los cálculos sí usan marcado real (<b>) y no acumulan basura
  window.calculaConMascara("192.168.5.130", "255.255.255.192");
  const elDir = doc.getElementById("direcciones");
  comprobar("calculaConMascara pinta <b> reales", elDir.querySelectorAll("b").length > 0);
  comprobar(
    "calculaConMascara pinta las 4 subredes",
    (elDir.textContent.match(/Direcciones de subred/g) || []).length === 4,
  );
  comprobar(
    "calculaConMascara: la última subred sale",
    elDir.textContent.includes("192.168.5.192"),
  );

  // 6. Modo tutor: escribirResultado añade tras las direcciones
  doc.getElementById("modoTutor").checked = true;
  window.calculaConMascara("192.168.5.130", "255.255.255.192");
  comprobar(
    "modo tutor añade su desglose al resultado",
    elResult.textContent.includes("Desglose paso a paso"),
  );
  comprobar("modo tutor trae su tabla real", elResult.querySelector("table") !== null);
  doc.getElementById("modoTutor").checked = false;

  // 7. Notas: los datos guardados salen como TEXTO (XSS) y el botón lleva icono
  window.localStorage.setItem(
    "notas",
    JSON.stringify([
      {
        id: 1,
        titulo: "<img src=x onerror=alert(1)>",
        contenido: "<script>alert(2)</script>",
        fecha: "2026-10-09",
        fechaR: "",
      },
    ]),
  );
  window.cargarNotas();
  const lista = doc.getElementById("lista-notas");
  comprobar("notas: el título malicioso NO crea un <img>", lista.querySelector("img") === null);
  comprobar(
    "notas: el contenido malicioso NO crea un <script>",
    lista.querySelector("script") === null,
  );
  comprobar(
    "notas: el título se ve como texto",
    lista.textContent.includes("<img src=x onerror=alert(1)>"),
  );
  const btn = doc.getElementById("btn-cargar");
  comprobar(
    "notas: el botón tiene el icono <i> real",
    btn.querySelector("i") && btn.querySelector("i").className.includes("bi bi-eye"),
  );
  comprobar(
    "notas: el botón dice Ver notas",
    btn.textContent.trim() === "Ver notas",
    JSON.stringify(btn.textContent),
  );
  comprobar(
    "notas: el botón no acumula iconos al repintar",
    (window.alternarNotas(), btn.querySelectorAll("i").length === 1),
  );

  // Los controles que el JS crea en runtime también llevan etiqueta asociada:
  // html-validate no puede inspeccionarlos, así que se comprueba aquí.
  window.editarNota(1);
  for (const [id, texto] of [
    ["edit-titulo", "Título"],
    ["edit-contenido", "Contenido"],
    ["edit-fecha", "A realizar el día"],
  ]) {
    const campo = doc.getElementById(id);
    const etiquetas =
      campo && campo.labels
        ? [...campo.labels]
        : [...doc.querySelectorAll('label[for="' + id + '"]')];
    comprobar(
      "notas: " + id + " tiene una etiqueta con for",
      etiquetas.length === 1,
      etiquetas.length,
    );
    comprobar(
      "notas: la etiqueta de " + id + " dice " + JSON.stringify(texto),
      etiquetas.length === 1 && etiquetas[0].textContent === texto,
      etiquetas.map((e) => e.textContent).join("|"),
    );
    comprobar(
      "notas: la etiqueta de " + id + " está oculta a la vista",
      etiquetas.length === 1 && etiquetas[0].className.includes("visually-hidden"),
      etiquetas.length === 1 ? etiquetas[0].className : "",
    );
  }
  window.cancelarEdicion();

  // 8. Contraseñas: la contraseña guardada sale como texto
  window.localStorage.setItem(
    "contrasenas",
    JSON.stringify([{ login: "a<b>c", password: "<script>alert(3)</script>" }]),
  );
  window.updateTable();
  const tbody = doc.querySelector("#savedTable tbody");
  comprobar("pass: pinta 1 fila", tbody.rows.length === 1);
  comprobar(
    "pass: login y contraseña como texto",
    tbody.rows[0].cells[0].textContent === "a<b>c" &&
      tbody.rows[0].cells[1].textContent === "<script>alert(3)</script>",
  );
  comprobar("pass: no se cuela ningún <script>", tbody.querySelector("script") === null);
  const botonesFila = [...tbody.querySelectorAll("button")];
  comprobar(
    "pass: hay botón Copiar (icono + texto) y Eliminar",
    botonesFila.length === 2 &&
      botonesFila[0].textContent === " Copiar" &&
      botonesFila[0].querySelector("i") !== null &&
      botonesFila[1].textContent === "Eliminar",
  );
  window.feedbackCopiado(botonesFila[0]);
  comprobar(
    "pass: feedbackCopiado cambia solo el texto, no borra el icono",
    botonesFila[0].textContent === " Copiado" && botonesFila[0].querySelector("i") !== null,
  );

  // 9. Tareas: repintado limpio
  window.localStorage.setItem(
    "tareas",
    JSON.stringify([{ id: 1, texto: "<b>comprar</b>", completada: false }]),
  );
  window.iniciarTareas();
  window.pintarTareas();
  const tl = doc.getElementById("taskList");
  comprobar("tareas: pinta 1 tarea", tl.children.length === 1);
  comprobar(
    "tareas: el texto va como texto (no <b>)",
    tl.querySelector("b") === null && tl.textContent.includes("<b>comprar</b>"),
  );

  // 10. Carga real de un fragmento completo por cargarFragmento()
  // (cargarFragmento no devuelve la promesa: hay que ceder el turno)
  const esperar = () => new Promise((r) => setTimeout(r, 20));
  window.cargarFragmento("inicio.html");
  await esperar();
  const cuerpo = doc.getElementById("cuerpo");
  comprobar("cargarFragmento: el fragmento entra en #cuerpo", cuerpo.children.length > 0);
  comprobar(
    "cargarFragmento: el marcado real se parsea (.hero-redes)",
    cuerpo.querySelector(".hero-redes") !== null,
  );
  window.cargarFragmento("teoria.html");
  await esperar();
  comprobar(
    "cargarFragmento: reemplaza, no acumula",
    cuerpo.querySelector(".hero-redes") === null && cuerpo.textContent.length > 0,
  );

  // 11. Navegación delegada: un clic en [data-vista] carga el fragmento correcto
  const pedidos = [];
  window.fetch = (url) => {
    pedidos.push(url);
    return Promise.resolve({ ok: true, text: () => Promise.resolve(leer(url)) });
  };

  const enlace = doc.createElement("a");
  enlace.setAttribute("href", "#");
  enlace.setAttribute("data-vista", "clases");
  enlace.textContent = "Clases";
  doc.body.appendChild(enlace);

  let eventoNav = null;
  doc.addEventListener("click", (e) => {
    eventoNav = e;
  });
  enlace.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  await esperar();
  comprobar(
    "navegación: el clic en data-vista pide el fragmento",
    pedidos.includes("clases.html"),
    pedidos.join(","),
  );
  comprobar(
    "navegación: el enlace se intercepta (preventDefault)",
    eventoNav !== null && eventoNav.defaultPrevented,
  );
  comprobar(
    "navegación: el fragmento de clases entra en #cuerpo",
    cuerpo.querySelector("#ip") !== null,
  );

  const antes = pedidos.length;
  const otro = doc.createElement("span");
  otro.textContent = "no navega";
  doc.body.appendChild(otro);
  otro.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  await esperar();
  comprobar("navegación: un clic normal no carga nada", pedidos.length === antes);

  // El enlace "saltar al contenido" NO es navegación de vista: la escucha delegada debe
  // ignorarlo (sin preventDefault) para que el navegador haga su salto a #cuerpo.
  const enlaceSaltar = doc.createElement("a");
  enlaceSaltar.className = "skip-link";
  enlaceSaltar.setAttribute("href", "#cuerpo");
  enlaceSaltar.textContent = "Saltar al contenido principal";
  doc.body.appendChild(enlaceSaltar);
  cuerpo.setAttribute("tabindex", "-1");
  let eventoSaltar = null;
  doc.addEventListener("click", (e) => {
    eventoSaltar = e;
  });
  enlaceSaltar.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  await esperar();
  comprobar(
    "skip-link: no lo intercepta la navegación delegada",
    eventoSaltar !== null && !eventoSaltar.defaultPrevented,
  );
  comprobar("skip-link: no carga ningún fragmento", pedidos.length === antes);
  comprobar(
    "skip-link: el destino #cuerpo puede recibir el foco",
    cuerpo.getAttribute("tabindex") === "-1",
  );

  // 12. marcarVistaActiva: solo marca el menú, y mantiene aria-current
  const nav = doc.createElement("nav");
  nav.className = "navbar";
  const listaNav = doc.createElement("ul");
  listaNav.className = "navbar-nav";
  for (const [vista, texto] of [
    ["inicio", "Inicio"],
    ["teoria", "Teoría"],
  ]) {
    const li = doc.createElement("li");
    const a = doc.createElement("a");
    a.className = "nav-link";
    a.setAttribute("href", "#");
    a.setAttribute("data-vista", vista);
    a.textContent = texto;
    li.appendChild(a);
    listaNav.appendChild(li);
  }
  nav.appendChild(listaNav);
  const enlacePortada = doc.createElement("a");
  enlacePortada.setAttribute("href", "#");
  enlacePortada.setAttribute("data-vista", "teoria");
  enlacePortada.textContent = "enlace de portada";
  nav.appendChild(enlacePortada);
  doc.body.appendChild(nav);

  window.marcarVistaActiva("teoria.html");
  const enlacesMenu = [...listaNav.querySelectorAll("[data-vista]")];
  comprobar(
    "marcarVistaActiva: marca solo el enlace del menú",
    enlacesMenu[1].classList.contains("active") && !enlacesMenu[0].classList.contains("active"),
  );
  comprobar(
    "marcarVistaActiva: aria-current solo en el activo",
    enlacesMenu[1].getAttribute("aria-current") === "page" &&
      enlacesMenu[0].getAttribute("aria-current") === null,
  );
  comprobar(
    "marcarVistaActiva: el enlace de la portada no se marca",
    !enlacePortada.classList.contains("active"),
  );
  window.marcarVistaActiva("inicio.html");
  comprobar(
    "marcarVistaActiva: al cambiar de vista se limpia el aria-current anterior",
    enlacesMenu[0].getAttribute("aria-current") === "page" &&
      enlacesMenu[1].getAttribute("aria-current") === null,
  );

  // 13. iniciarClases: el botón "Ver clase" queda enganchado tras cargar el fragmento
  cuerpo.querySelector("#ip").value = "192.168.1.1";
  cuerpo
    .querySelector("#btn-ver-clase")
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  comprobar(
    "iniciarClases: el botón Ver clase pinta el resultado",
    cuerpo.querySelector("#result").textContent.includes("pertenece a la clase C"),
    cuerpo.querySelector("#result").textContent,
  );

  // 14. iniciarSubneting: selector de máscara y botones de cálculo
  window.cargarFragmento("subneting.html");
  await esperar();
  const selectorMask = cuerpo.querySelector("#maskSelect");
  selectorMask.value = "26";
  selectorMask.dispatchEvent(new window.Event("change", { bubbles: true }));
  comprobar(
    "iniciarSubneting: el selector rellena la máscara",
    cuerpo.querySelector("#mascara").value === "255.255.255.192",
    cuerpo.querySelector("#mascara").value,
  );
  cuerpo.querySelector("#ip").value = "192.168.5.130";
  cuerpo
    .querySelector("#btn-mascara")
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  comprobar(
    "iniciarSubneting: el botón Máscara calcula",
    cuerpo.querySelector("#direcciones").textContent.includes("192.168.5.192"),
  );
  cuerpo
    .querySelector("#btn-clase")
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  comprobar(
    "iniciarSubneting: el botón Clase calcula",
    cuerpo.querySelector("#result").textContent.includes("clase C"),
    cuerpo.querySelector("#result").textContent,
  );

  // 15. La navegación delegada también funciona en los enlaces de un fragmento inyectado
  window.cargarFragmento("inicio.html");
  await esperar();
  const enlaceEnFragmento = cuerpo.querySelector('[data-vista="subneting"]');
  comprobar("el fragmento de inicio trae enlaces con data-vista", enlaceEnFragmento !== null);
  const antes2 = pedidos.length;
  enlaceEnFragmento.dispatchEvent(
    new window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
  await esperar();
  comprobar(
    "la navegación delegada funciona tras inyectar un fragmento",
    pedidos[pedidos.length - 1] === "subneting.html" && pedidos.length === antes2 + 1,
    pedidos.join(","),
  );

  console.log(fallos === 0 ? "\nTODO OK (DOM real)" : "\n" + fallos + " FALLOS (DOM real)");
  process.exit(fallos ? 1 : 0);
})();

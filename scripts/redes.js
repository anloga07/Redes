// ===== UTILIDADES DE CÁLCULO =====

// Convierte 4 octetos (array de números) a su valor de 32 bits
function ipAInt(octetos) {
  return octetos[0] * 16777216 + octetos[1] * 65536 + octetos[2] * 256 + octetos[3];
}

// Convierte un valor de 32 bits a su notación IP (xxx.xxx.xxx.xxx)
function intAIP(valor) {
  return [
    Math.floor(valor / 16777216) % 256,
    Math.floor(valor / 65536) % 256,
    Math.floor(valor / 256) % 256,
    valor % 256,
  ].join(".");
}

// Devuelve clase, rango y octeto donde empieza la red (i) según el primer octeto
function claseDelPrimerOcteto(primerOcteto) {
  if (primerOcteto >= 1 && primerOcteto <= 126) return { clase: "A", rango: "1-126", i: 1 };
  if (primerOcteto >= 128 && primerOcteto <= 191) return { clase: "B", rango: "128-191", i: 2 };
  if (primerOcteto >= 192 && primerOcteto <= 223) return { clase: "C", rango: "192-223", i: 3 };
  if (primerOcteto >= 224 && primerOcteto <= 239) return { clase: "D", rango: "224-239", i: null };
  if (primerOcteto >= 240 && primerOcteto <= 255) return { clase: "E", rango: "240-255", i: null };
  return null;
}

// Convierte un prefijo /n en la máscara decimal correspondiente
function prefijoAMascara(prefijo) {
  const mascara = [];
  for (let k = 0; k < 4; k++) {
    if (prefijo >= 8) {
      mascara[k] = 255;
      prefijo -= 8;
    } else if (prefijo === 0) {
      mascara[k] = 0;
    } else {
      mascara[k] = 256 - Math.pow(2, 8 - prefijo);
      prefijo = 0;
    }
  }
  return mascara;
}

// Convierte una cadena de HTML generado por la propia aplicación en nodos DOM.
// Es el único punto del sitio que interpreta HTML como tal (eslint JS-02) y no
// sanea nada, así que se usa solo con contenido calculado: números y direcciones
// ya validadas (máscara, subredes y tabla del Modo Tutor) y los fragmentos
// locales que carga cargarFragmento. Nunca con datos del usuario: esos van con
// textContent o createElement (ver notas.js).
// Ojo: selectNodeContents (y no selectNode) hace que el propio div desligado sea
// el nodo de contexto del análisis; con selectNode el contexto sería su padre,
// que es null al no estar en el documento, y fallaría.
function nodosDesdeHTML(html) {
  const rango = document.createRange();
  rango.selectNodeContents(document.createElement("div"));
  return rango.createContextualFragment(html);
}

// Reemplaza el contenido de un elemento por HTML generado
function pintarHTML(elemento, html) {
  if (elemento) elemento.replaceChildren(nodosDesdeHTML(html));
}

// Añade contenido al párrafo de resultados (si existe en la página)
function escribirResultado(html) {
  const el = document.getElementById("result");
  if (el) el.append(nodosDesdeHTML(html));
}

// ===== DETECCIÓN DE CLASE =====

//CALCULAR EL TIPO DE CLASE QUE ES LA RED
// Devuelve { octetos, clase, i } o null si la IP no es válida (el error ya se muestra en pantalla)
function verClase(ip) {
  const elResult = document.getElementById("result");
  const elDirecciones = document.getElementById("direcciones");
  if (elResult) elResult.replaceChildren();
  if (elDirecciones) elDirecciones.replaceChildren();

  function error(mensaje) {
    if (elResult) elResult.textContent = mensaje;
    return null;
  }

  if (!ip || !ip.trim()) {
    return error("Por favor, ingrese una dirección IP");
  }
  ip = ip.trim();

  const octetos = ip.split(".");
  if (octetos.length !== 4) {
    return error("Por favor, ingrese una dirección IP válida (formato: xxx.xxx.xxx.xxx)");
  }

  // Validar que cada octeto sea un número válido entre 0 y 255
  for (let i = 0; i < octetos.length; i++) {
    if (!/^\d{1,3}$/.test(octetos[i]) || parseInt(octetos[i], 10) > 255) {
      return error(
        "Por favor, ingrese una dirección IP válida (cada octeto debe ser un número entre 0 y 255)",
      );
    }
  }

  const info = claseDelPrimerOcteto(parseInt(octetos[0], 10));
  if (!info) {
    return error("IP no válida");
  }

  if (elResult) {
    pintarHTML(
      elResult,
      `La dirección IP: <b>${octetos.join(".")}</b> pertenece a la clase <b>${info.clase}</b> (Rango: <b>${info.rango}</b>)`,
    );
  }
  return { octetos: octetos.map(Number), clase: info.clase, i: info.i };
}

// ===== CÁLCULOS DE SUBNETING =====

const TEXTO_AYUDA_CAPACIDAD =
  "Se usan la IP y la máscara indicadas. Sin máscara se toma la de la clase.";
const TEXTO_AYUDA_OBJETIVO =
  "Indica cuántas redes o hosts necesitas y se calculará la máscara adecuada.";

// Valida una máscara decimal y devuelve sus octetos, su binario y su prefijo.
// Si no es válida devuelve { error } con el mensaje listo para mostrar.
function analizarMascara(mask) {
  const octetos = (mask || "").trim().split(".");
  if (octetos.length !== 4 || octetos.some((o) => !/^\d{1,3}$/.test(o) || parseInt(o, 10) > 255)) {
    return { error: "La máscara no es válida (formato: 255.255.255.0)" };
  }

  const numeros = octetos.map(Number);
  const binario = numeros.map((o) => o.toString(2).padStart(8, "0"));
  const cadenaBinaria = binario.join("");
  if (!/^1*0*$/.test(cadenaBinaria)) {
    return { error: "La máscara no es válida: los bits a 1 deben ser consecutivos" };
  }

  // Prefijo = nº de bits a 1 de la máscara
  const posicionCero = cadenaBinaria.indexOf("0");
  return { octetos: numeros, binario, prefijo: posicionCero === -1 ? 32 : posicionCero };
}

// Nº de subredes, direcciones de host y hosts útiles que caben con un prefijo.
// Es classful: los bits de red se cuentan desde la máscara por defecto de la clase.
function datosDeSubredes(miIp, prefijo) {
  const bitsRed = prefijo - miIp.i * 8;
  const direcciones = Math.pow(2, 32 - prefijo);
  return {
    prefijo,
    bitsRed,
    bitsHost: 32 - prefijo,
    subredes: Math.pow(2, bitsRed),
    direcciones,
    hostsUtiles: Math.max(direcciones - 2, 0),
  };
}

// Máscara del modo capacidad: la indicada o, si no hay, la de la clase de la IP
function mascaraDeCapacidad(miIp, mascara) {
  const texto = (mascara || "").trim();
  if (texto) return { mascara: texto, porDefecto: false };
  return { mascara: prefijoAMascara(miIp.i * 8).join("."), porDefecto: true };
}

// Frase del modo capacidad: cuántas redes y hosts caben y el camino alternativo
function resumenCapacidad({ miIp, mascara, datos, porDefecto }) {
  const cifras = (n) => n.toLocaleString("es-ES");
  const aviso = porDefecto
    ? `<br>No has indicado máscara: se usa la de la clase ${miIp.clase} (/${datos.prefijo}).`
    : "";
  const hosts =
    datos.hostsUtiles > 0
      ? `<b>${cifras(datos.hostsUtiles)}</b> hosts útiles`
      : "sin hosts útiles (enlace punto a punto o dirección única)";
  const redes =
    datos.subredes === 1
      ? `1 red de ${hosts}`
      : `<b>${cifras(datos.subredes)}</b> subredes de ${hosts} cada una`;
  return (
    aviso +
    `<br>Con la IP <b>${miIp.octetos.join(".")}</b> y la máscara <b>${mascara}</b> (/${datos.prefijo}) puedes tener ${redes}.` +
    `<br>Si prefieres partir de un objetivo, elige «La máscara para un nº de redes o hosts».`
  );
}

// Devuelve { miIp, datos } o null si algo no es válido (el error ya se muestra)
function calculaConMascara(ip, mask) {
  const miIp = verClase(ip);
  if (!miIp) return null; // la IP ya está validada y el error mostrado
  if (miIp.i === null) {
    alert("Solo calculo redes de clase A, B y C");
    return null;
  }

  const analisis = analizarMascara(mask);
  if (analisis.error) {
    escribirResultado("<br>" + analisis.error);
    return null;
  }
  if (analisis.prefijo < miIp.i * 8) {
    escribirResultado(
      `<br>La máscara debe ser igual o mayor que la máscara de la clase ${miIp.clase} (/${miIp.i * 8})`,
    );
    return null;
  }

  const datos = datosDeSubredes(miIp, analisis.prefijo);

  escribirResultado(
    `<br>Máscara en decimal: <b>${analisis.octetos.join(".")}</b><br>Máscara adaptada en binario: <b>${analisis.binario.join(".")}</b>`,
  );
  escribirResultado(
    `<br>Direcciones de subred <b>${datos.subredes}</b>, <br>Direcciones de host <b>${datos.direcciones}</b>, útiles <b>${datos.hostsUtiles}</b>`,
  );

  // Red principal: se copian los octetos de la IP según la clase y el resto a 0
  const base = ipAInt(miIp.octetos.map((o, k) => (k < miIp.i ? o : 0)));
  const blockSize = datos.direcciones;

  let mostrar = datos.subredes;
  if (mostrar > 512) {
    alert(
      "El número de subredes es muy grande por lo que solo se mostrarán 512 direcciones de subredes",
    );
    mostrar = 512;
  }

  // MOSTRAR TODAS LAS DIRECCIONES DE SUBREDES
  let html = "";
  for (let redNum = 0; redNum < mostrar; redNum++) {
    const red = base + redNum * blockSize;
    const broadcast = red + blockSize - 1;
    html += `<br>Direcciones de subred <b>${intAIP(red)}</b>`;
    if (blockSize > 2) {
      html += ` Host <b>[${intAIP(red + 1)} - ${intAIP(broadcast - 1)}]</b>`;
    } else {
      html += " Host <b>[ninguno]</b>";
    }
    html += ` Broadcast <b>[${intAIP(broadcast)}]</b>`;
  }
  html += `<br>Número de subredes <b>${datos.subredes}</b>`;

  const elDirecciones = document.getElementById("direcciones");
  pintarHTML(elDirecciones, html);

  if (document.getElementById("modoTutor") && document.getElementById("modoTutor").checked) {
    escribirResultado(generarDesgloseTutor(ip, analisis.octetos.join(".")));
  }

  return { miIp, datos };
}

function calculaConRedes(ip, numRedes) {
  const miIp = verClase(ip);
  if (!miIp) return;
  if (miIp.i === null) {
    alert("Solo calculo redes de clase A, B y C");
    return;
  }

  const textoRedes = (numRedes || "").trim();
  if (!textoRedes) {
    escribirResultado(
      "<br>Indica un número de redes (1 o más) o cambia a «Cuántas redes y hosts caben» para ver las posibilidades con esta máscara",
    );
    return;
  }

  const totalRedes = parseInt(textoRedes, 10);
  if (!Number.isInteger(totalRedes) || totalRedes < 1) {
    escribirResultado("<br>Indique un número de redes válido (mayor o igual que 1)");
    return;
  }

  // Nº de bits necesarios en la submáscara para obtener esa cantidad de redes
  let j = 0;
  while (totalRedes > Math.pow(2, j)) {
    j++;
  }

  const prefijo = miIp.i * 8 + j;
  const bitsHost = 32 - prefijo;
  if (bitsHost < 2) {
    alert(`No es posible: serían ${j} bits de subred y quedarían menos de 2 bits para hosts`);
    return;
  }

  const mascara = prefijoAMascara(prefijo);
  calculaConMascara(ip, mascara.join("."));
  escribirResultado(
    `<br>La dirección IP: <b>${miIp.octetos.join(".")}</b> debe tener la máscara <b>${mascara.join(".")}</b> (/${prefijo})` +
      `<br>Se usan <b>${j}</b> bits de subred y <b>${bitsHost}</b> de hosts: ` +
      `<b>${Math.pow(2, j)}</b> subredes de <b>${Math.pow(2, bitsHost) - 2}</b> hosts útiles`,
  );
}

function calculaConHosts(ip, numHosts) {
  const miIp = verClase(ip);
  if (!miIp) return;
  if (miIp.i === null) {
    alert("Solo calculo redes de clase A, B y C");
    return;
  }

  const textoHosts = (numHosts || "").trim();
  if (!textoHosts) {
    escribirResultado(
      "<br>Indica un número de hosts (1 o más) o cambia a «Cuántas redes y hosts caben» para ver las posibilidades con esta máscara",
    );
    return;
  }

  const totalHosts = parseInt(textoHosts, 10);
  if (!Number.isInteger(totalHosts) || totalHosts < 1) {
    escribirResultado("<br>Indique un número de hosts válido (mayor o igual que 1)");
    return;
  }

  // Nº de bits necesarios para alojar esa cantidad de hosts (sin contar red ni broadcast)
  let j = 0;
  while (Math.pow(2, j) - 2 < totalHosts) {
    j++;
  }

  const prefijo = 32 - j;
  if (prefijo < miIp.i * 8) {
    alert(`No es posible: para la clase ${miIp.clase} la máscara mínima es /${miIp.i * 8}`);
    return;
  }

  const mascara = prefijoAMascara(prefijo);
  calculaConMascara(ip, mascara.join("."));
  escribirResultado(
    `<br>La dirección IP: <b>${miIp.octetos.join(".")}</b> debe tener la máscara <b>${mascara.join(".")}</b> (/${prefijo})` +
      `<br>Se usan <b>${32 - prefijo}</b> bits de hosts y <b>${prefijo}</b> de red: ` +
      `<b>${Math.pow(2, prefijo - miIp.i * 8)}</b> subredes de <b>${Math.pow(2, j) - 2}</b> hosts útiles`,
  );
}

// Modo capacidad: no se pide objetivo, se muestran las redes y hosts posibles
// con la IP y la máscara indicadas (o con la máscara por defecto de su clase).
function calculaCapacidad(ip, mascara) {
  const miIp = verClase(ip);
  if (!miIp) return;
  if (miIp.i === null) {
    alert("Solo calculo redes de clase A, B y C");
    return;
  }

  const elegida = mascaraDeCapacidad(miIp, mascara);
  const resultado = calculaConMascara(ip, elegida.mascara);
  if (!resultado) return; // calculaConMascara ya ha mostrado el error

  escribirResultado(
    resumenCapacidad({
      miIp,
      mascara: elegida.mascara,
      datos: resultado.datos,
      porDefecto: elegida.porDefecto,
    }),
  );
}

// ===== MODO TUTOR =====

function generarDesgloseTutor(ip, mascara) {
  const octetosIP = ip.trim().split(".").map(Number);
  const octetosMask = mascara.split(".").map(Number);

  const binarioIP = octetosIP.map((o) => o.toString(2).padStart(8, "0"));
  const binarioMask = octetosMask.map((o) => o.toString(2).padStart(8, "0"));

  const binarioAND = [];
  for (let i = 0; i < 4; i++) {
    let bits = "";
    for (let j = 0; j < 8; j++) {
      bits += binarioIP[i][j] === "1" && binarioMask[i][j] === "1" ? "1" : "0";
    }
    binarioAND.push(bits);
  }
  const octetosRed = binarioAND.map((b) => parseInt(b, 2));

  const cadenaMask = binarioMask.join("");
  const posicionCero = cadenaMask.indexOf("0");
  const prefijo = posicionCero === -1 ? 32 : posicionCero;
  const octetoInteres = Math.min(Math.floor(prefijo / 8), 3);
  const numeroMagico = 256 - octetosMask[octetoInteres];

  let html = '<div class="panel-tutor mt-4 p-3">';
  html += "<h5>Desglose paso a paso (Modo Tutor)</h5>";

  html += '<h6 class="mt-3">1. Conversión a binario</h6>';
  html += '<table class="table table-sm table-bordered">';
  html +=
    "<thead><tr><th></th><th>Octeto 1</th><th>Octeto 2</th><th>Octeto 3</th><th>Octeto 4</th></tr></thead>";
  html += "<tbody>";
  html += "<tr><td><b>IP</b></td>";
  for (let i = 0; i < 4; i++) html += `<td>${octetosIP[i]} = ${binarioIP[i]}</td>`;
  html += "</tr>";
  html += "<tr><td><b>Máscara</b></td>";
  for (let i = 0; i < 4; i++) html += `<td>${octetosMask[i]} = ${binarioMask[i]}</td>`;
  html += "</tr>";
  html += "</tbody></table>";

  html += '<h6 class="mt-3">2. Operación AND lógica</h6>';
  html += "<p>La dirección de red se obtiene aplicando AND bit a bit entre la IP y la máscara:</p>";
  html += '<table class="table table-sm table-bordered">';
  html += "<tbody>";
  html += "<tr><td><b>IP binario</b></td>";
  for (let i = 0; i < 4; i++) html += `<td>${binarioIP[i]}</td>`;
  html += "</tr>";
  html += "<tr><td><b>Máscara binario</b></td>";
  for (let i = 0; i < 4; i++) html += `<td>${binarioMask[i]}</td>`;
  html += "</tr>";
  html += '<tr class="table-success"><td><b>AND (Red)</b></td>';
  for (let i = 0; i < 4; i++) html += `<td>${binarioAND[i]}</td>`;
  html += "</tr>";
  html += "<tr><td><b>Red decimal</b></td>";
  for (let i = 0; i < 4; i++) html += `<td>${octetosRed[i]}</td>`;
  html += "</tr>";
  html += "</tbody></table>";
  html += `<p><b>Dirección de red:</b> ${octetosRed.join(".")}</p>`;

  if (prefijo >= 32) {
    html += "<p><b>Máscara /32:</b> no hay subredes ni hosts: la red es una única dirección.</p>";
    html += "</div>";
    return html;
  }

  html += '<h6 class="mt-3">3. Número mágico (salto entre subredes)</h6>';
  html +=
    "<p>El número mágico se calcula restando a 256 el primer octeto de la máscara que no es 255:</p>";
  html += `<p><b>256 - ${octetosMask[octetoInteres]} = ${numeroMagico}</b></p>`;
  html += `<p>El octeto de interés es el octeto ${octetoInteres + 1}.</p>`;
  if (octetosMask[octetoInteres] === 0) {
    html += `<p>Como ese octeto vale 0, el salto de ${numeroMagico} equivale a 1 unidad en el octeto siguiente.</p>`;
  }

  // Rango de subredes calculado con aritmética de 32 bits (sin acarreos manuales)
  const info = claseDelPrimerOcteto(octetosIP[0]);
  const i = info && info.i ? info.i : 1;
  const base = ipAInt(octetosIP.map((o, k) => (k < i ? o : 0)));
  const blockSize = Math.pow(2, 32 - prefijo);
  const numSubredes = Math.pow(2, Math.max(prefijo - i * 8, 0));
  const mostrar = Math.min(numSubredes, 8);

  html += '<h6 class="mt-3">4. Rango de subredes</h6>';
  html += `<p>Con máscara /${prefijo} hay <b>${numSubredes}</b> subredes de <b>${blockSize}</b> direcciones cada una:</p>`;
  html += "<ul>";
  for (let n = 0; n < mostrar; n++) {
    const red = base + n * blockSize;
    const broadcast = red + blockSize - 1;
    const hosts = blockSize > 2 ? `${intAIP(red + 1)} - ${intAIP(broadcast - 1)}` : "ninguno";
    html += `<li>Subred ${n}: <b>${intAIP(red)}</b> — Hosts: ${hosts} — Broadcast: ${intAIP(broadcast)}</li>`;
  }
  if (mostrar < numSubredes) {
    html += `<li>... y ${numSubredes - mostrar} subredes más</li>`;
  }
  html += "</ul>";

  html += "</div>";
  return html;
}

// ===== FUNCIONALIDAD PARA CARGAR PÁGINAS A PARTIR DE LOS ENLACES DEL MENÚ =====

// Vistas del sitio: identificador usado en data-vista -> archivo del fragmento
const VISTAS = {
  inicio: "inicio.html",
  teoria: "teoria.html",
  clases: "clases.html",
  subneting: "subneting.html",
  conversor: "conversor.html",
  pass: "pass.html",
  tareas: "tareas.html",
  notas: "notas.html",
  agenda: "agenda.html",
};

function cargarFragmento(archivo) {
  fetch(archivo)
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    })
    .then((data) => {
      pintarHTML(document.getElementById("cuerpo"), data);
      inicializarFragmento(archivo);
      marcarVistaActiva(archivo);
    })
    .catch((error) => console.error("Error:", error));
}

// Un único listener delegado en document atiende toda la navegación: cualquier
// elemento con data-vista (menú, portada o enlaces dentro de un fragmento) carga
// su página. Al vivir en document sobrevive a cada inyección de fragmento, así
// que no hay que volver a engancharlo.
function prepararNavegacion() {
  document.addEventListener("click", (evento) => {
    const enlace = evento.target.closest("[data-vista]");
    if (!enlace) return;
    const archivo = VISTAS[enlace.dataset.vista];
    if (!archivo) return;
    evento.preventDefault();
    cargarFragmento(archivo);
  });
}

// Marca el enlace del menú correspondiente al fragmento cargado. Solo se
// actualiza la barra de navegación: los enlaces de la portada comparten
// data-vista, pero no deben recibir la clase "active".
function marcarVistaActiva(archivo) {
  const vista = Object.keys(VISTAS).find((clave) => VISTAS[clave] === archivo);
  document.querySelectorAll(".navbar-nav [data-vista]").forEach((enlace) => {
    const activa = enlace.dataset.vista === vista;
    enlace.classList.toggle("active", activa);
    if (activa) {
      enlace.setAttribute("aria-current", "page");
    } else {
      enlace.removeAttribute("aria-current");
    }
  });
}

// Los <script> incluidos en un fragmento inyectado NO se
// ejecutan, así que cada herramienta se inicializa aquí, después de cargarla.
function inicializarFragmento(archivo) {
  prepararValidacionIP();

  const inicializadores = {
    "clases.html": "iniciarClases",
    "subneting.html": "iniciarSubneting",
    "conversor.html": "iniciarConversor",
    "pass.html": "iniciarPass",
    "tareas.html": "iniciarTareas",
    "notas.html": "cargarNotas",
  };
  const nombre = inicializadores[archivo];
  if (nombre && typeof window[nombre] === "function") {
    window[nombre]();
  }
}

// ===== FORMULARIOS =====

// Función para actualizar la máscara según el valor seleccionado
function actualizarMascara(valor) {
  const campoMascara = document.getElementById("mascara");
  if (!campoMascara) return;
  if (valor === "Máscaras") {
    campoMascara.value = "";
    return;
  }
  const bits = parseInt(valor, 10);
  if (!Number.isInteger(bits)) return;
  campoMascara.value = prefijoAMascara(bits).join(".");
}

// clases.html: el botón "Ver clase" detecta la clase de la IP escrita
function iniciarClases() {
  const boton = document.getElementById("btn-ver-clase");
  const inputIP = document.getElementById("ip");
  if (!boton || !inputIP) return;
  boton.addEventListener("click", () => verClase(inputIP.value));
}

// Valor actual de un campo de la vista (cadena vacía si no existe)
function valorDe(id) {
  const campo = document.getElementById(id);
  return campo ? campo.value : "";
}

// Enlaza el clic de un botón, si ese botón existe en la vista
function enlazarBoton(id, accion) {
  const boton = document.getElementById(id);
  if (boton) boton.addEventListener("click", accion);
}

// Muestra u oculta un grupo de nodos por id
function alternarVisibles(ids, visibles) {
  for (const id of ids) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.hidden = !visibles;
  }
}

// Los campos de objetivo solo se pueden rellenar en su modo
function alternarCamposObjetivo(habilitados) {
  for (const id of ["redes", "hosts"]) {
    const campo = document.getElementById(id);
    if (campo) campo.disabled = !habilitados;
  }
}

// Ajusta campos, botones y ayuda al modo de cálculo elegido
function aplicarModoSubneting(modo) {
  const capacidad = modo !== "objetivo";
  alternarCamposObjetivo(!capacidad);
  alternarVisibles(["campos-objetivo"], !capacidad);
  alternarVisibles(["btn-capacidad"], capacidad);
  alternarVisibles(["btn-redes", "btn-hosts"], !capacidad);
  const ayuda = document.getElementById("ayuda-subneting");
  if (ayuda) ayuda.textContent = capacidad ? TEXTO_AYUDA_CAPACIDAD : TEXTO_AYUDA_OBJETIVO;
}

// Los dos radios del modo comparten comportamiento; al cargar se aplica el marcado
function prepararModosSubneting() {
  for (const id of ["modo-capacidad", "modo-objetivo"]) {
    const radio = document.getElementById(id);
    if (radio) radio.addEventListener("change", () => aplicarModoSubneting(radio.value));
  }
  const objetivo = document.getElementById("modo-objetivo");
  aplicarModoSubneting(objetivo && objetivo.checked ? "objetivo" : "capacidad");
}

// subneting.html: selector de máscara, modos de cálculo y botones de la calculadora
function iniciarSubneting() {
  const inputIP = document.getElementById("ip");
  if (!inputIP) return;

  const selector = document.getElementById("maskSelect");
  if (selector) {
    selector.addEventListener("change", () => actualizarMascara(selector.value));
  }

  prepararModosSubneting();
  enlazarBoton("btn-clase", () => verClase(inputIP.value));
  enlazarBoton("btn-capacidad", () => calculaCapacidad(inputIP.value, valorDe("mascara")));
  enlazarBoton("btn-redes", () => calculaConRedes(inputIP.value, valorDe("redes")));
  enlazarBoton("btn-hosts", () => calculaConHosts(inputIP.value, valorDe("hosts")));
}

// Validación en vivo del campo de IP tras cargar cada fragmento
function prepararValidacionIP() {
  const inputIP = document.getElementById("ip");
  if (!inputIP) return;

  const ipPattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  inputIP.addEventListener("input", function () {
    const valor = this.value.trim();
    if (!valor) {
      this.classList.remove("is-valid");
      this.classList.remove("is-invalid");
      return;
    }
    if (ipPattern.test(valor)) {
      this.classList.remove("is-invalid");
      this.classList.add("is-valid");
    } else {
      this.classList.remove("is-valid");
      this.classList.add("is-invalid");
    }
  });
}

// ===== TEMA CLARO/OSCURO =====

function actualizarBotonTema() {
  const tema = document.documentElement.getAttribute("data-bs-theme");
  const btn = document.getElementById("themeToggle");
  const icono = btn?.querySelector("i");
  if (!btn || !icono) return;
  if (tema === "light") {
    btn.setAttribute("aria-label", "Cambiar a modo oscuro");
    icono.classList.remove("bi-sun-fill");
    icono.classList.add("bi-moon-fill");
  } else {
    btn.setAttribute("aria-label", "Cambiar a modo claro");
    icono.classList.remove("bi-moon-fill");
    icono.classList.add("bi-sun-fill");
  }
}

function alternarTema() {
  const temaActual = document.documentElement.getAttribute("data-bs-theme");
  const nuevoTema = temaActual === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-bs-theme", nuevoTema);
  localStorage.setItem("tema", nuevoTema);
  actualizarBotonTema();
}

function prepararBotonTema() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  btn.addEventListener("click", alternarTema);
}

function inicializarTema() {
  const temaGuardado = localStorage.getItem("tema");
  if (temaGuardado === "light" || temaGuardado === "dark") {
    document.documentElement.setAttribute("data-bs-theme", temaGuardado);
  } else {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  prepararBotonTema();
  actualizarBotonTema();
}

// Registro del listener delegado de navegación. Se hace una sola vez, al cargar
// la página (redes.js se declara al final del body), y sigue valiendo para todos
// los fragmentos que se inyecten después.
prepararNavegacion();
inicializarTema();

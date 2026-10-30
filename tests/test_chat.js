// Verifica el asistente de chat (index.html + scripts/chat.js + chatDatos.js):
// el motor de reglas, la normalización, la navegación con data-vista de las
// respuestas, la persistencia y que los mensajes se pinten como texto.
// Uso: node tests/test_chat.js
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const raiz = path.join(__dirname, "..");
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), "utf8");

const dom = new JSDOM(leer("index.html"), {
  runScripts: "outside-only",
  url: "http://localhost/",
});
const win = dom.window;
const doc = win.document;

const pedidos = [];
win.fetch = (url) => {
  pedidos.push(url);
  return Promise.resolve({ ok: true, text: () => Promise.resolve(leer(url)) });
};

// Los tres archivos van en el mismo eval para que chat.js vea VISTAS (es un
// const de script, no una propiedad de window). El último valor devuelve la
// base de conocimiento al test.
const contexto = win.eval(
  [
    leer("scripts/redes.js"),
    leer("scripts/chatDatos.js"),
    leer("scripts/chat.js"),
    "\n;({ base: BASE_CONOCIMIENTO, umbral: UMBRAL_RESPUESTA, vistas: Object.keys(VISTAS) })",
  ].join("\n"),
);

let fallos = 0;
function comprobar(nombre, condicion, detalle) {
  if (condicion) {
    console.log("OK   " + nombre);
    return;
  }
  fallos++;
  console.log("FALLA " + nombre + (detalle === undefined ? "" : " -> " + JSON.stringify(detalle)));
}

const esperar = () => new Promise((resolver) => setTimeout(resolver, 20));

const lanzador = doc.getElementById("chatLanzador");
const panel = doc.getElementById("chatPanel");
const registro = doc.getElementById("chatRegistro");
const entrada = doc.getElementById("chatEntrada");
const formulario = doc.getElementById("chatFormulario");

const burbujas = () => [...registro.querySelectorAll(".chat-mensaje")];
const ultima = () => burbujas()[burbujas().length - 1];

async function preguntar(texto) {
  entrada.value = texto;
  formulario.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  await esperar();
}

(async () => {
  // --- Marcado del widget ---
  comprobar("el panel arranca cerrado", panel.hasAttribute("hidden"));
  comprobar(
    "el lanzador anuncia su estado y su destino",
    lanzador.getAttribute("aria-expanded") === "false" &&
      lanzador.getAttribute("aria-controls") === "chatPanel" &&
      (lanzador.getAttribute("aria-label") || "").length > 0,
    [lanzador.getAttribute("aria-expanded"), lanzador.getAttribute("aria-controls")],
  );
  comprobar(
    "el panel es un diálogo etiquetado",
    panel.getAttribute("role") === "dialog" &&
      doc.getElementById(panel.getAttribute("aria-labelledby")) !== null,
  );
  comprobar(
    "el registro se anuncia con aria-live",
    registro.getAttribute("role") === "log" && registro.getAttribute("aria-live") === "polite",
  );
  comprobar(
    "el campo tiene etiqueta asociada",
    entrada.labels.length === 1 && entrada.labels[0].textContent === "Escribe tu duda",
    entrada.labels.length,
  );
  comprobar(
    "el widget vive fuera de #cuerpo (sobrevive a los fragmentos)",
    doc.getElementById("cuerpo").querySelector(".chat-widget") === null,
  );
  comprobar(
    "el icono del lanzador está oculto a lectores",
    lanzador.querySelector("i").getAttribute("aria-hidden") === "true",
  );

  // --- Saludo inicial ---
  comprobar(
    "el bot saluda al cargar",
    burbujas().length === 1 && /asistente/i.test(ultima().textContent),
  );
  comprobar(
    "el saludo es un mensaje del bot",
    ultima().classList.contains("chat-mensaje-bot"),
    ultima().className,
  );

  // --- Abrir y cerrar ---
  lanzador.click();
  comprobar(
    "al pulsar el lanzador se abre el panel y se anuncia",
    !panel.hasAttribute("hidden") && lanzador.getAttribute("aria-expanded") === "true",
  );
  comprobar("al abrir, el foco va al campo", doc.activeElement === entrada);
  doc.getElementById("chatCerrar").click();
  comprobar(
    "el botón de cerrar oculta el panel y devuelve el foco",
    panel.hasAttribute("hidden") &&
      lanzador.getAttribute("aria-expanded") === "false" &&
      doc.activeElement === lanzador,
  );

  // --- Motor de reglas ---
  comprobar("normaliza acentos y signos", win.normalizarTexto("  ¿MÁSCARA?  ") === "mascara");
  comprobar("normaliza la eñe", win.normalizarTexto("Contraseña") === "contrasena");
  comprobar(
    "una palabra suelta por debajo del umbral no responde",
    win.buscarIntencion("ip") === null,
  );
  comprobar("un texto sin claves no responde", win.buscarIntencion("qwerty") === null);
  comprobar("el umbral es positivo", contexto.umbral > 0, contexto.umbral);

  const clase = await win.responder("¿A qué clase pertenece la 10.0.0.1?");
  comprobar(
    "responde la intención de clases y ofrece su vista",
    clase.vista === "clases" && /primer octeto/.test(clase.texto),
    clase,
  );

  const desconocida = await win.responder("qwerty");
  comprobar(
    "sin respuesta ofrece tres sugerencias",
    Array.isArray(desconocida.sugerencias) &&
      desconocida.sugerencias.length === 3 &&
      desconocida.vista === undefined,
    desconocida,
  );

  comprobar(
    "toda pregunta sugerida vuelve a su propia intención",
    contexto.base.every((entradaBase) => {
      const encontrada = win.buscarIntencion(entradaBase.pregunta);
      return encontrada !== null && encontrada.pregunta === entradaBase.pregunta;
    }),
    contexto.base
      .filter((entradaBase) => {
        const encontrada = win.buscarIntencion(entradaBase.pregunta);
        return encontrada === null || encontrada.pregunta !== entradaBase.pregunta;
      })
      .map((entradaBase) => entradaBase.pregunta),
  );
  comprobar(
    "cada entrada tiene claves, pregunta y respuesta",
    contexto.base.every(
      (entradaBase) =>
        Array.isArray(entradaBase.claves) &&
        entradaBase.claves.length > 0 &&
        entradaBase.pregunta &&
        entradaBase.respuesta,
    ),
  );
  comprobar(
    "cada vista del bot existe en VISTAS y lleva etiqueta",
    contexto.base
      .filter((entradaBase) => entradaBase.vista)
      .every(
        (entradaBase) =>
          contexto.vistas.includes(entradaBase.vista) && Boolean(entradaBase.etiqueta),
      ),
  );

  // --- Envío desde la interfaz ---
  lanzador.click();
  await preguntar("¿Cuántas subredes salen con /26?");
  comprobar(
    "el mensaje del usuario y la respuesta entran en el registro",
    burbujas().length === 3 &&
      burbujas()[1].classList.contains("chat-mensaje-usuario") &&
      burbujas()[2].classList.contains("chat-mensaje-bot"),
    burbujas().length,
  );
  comprobar("el campo se vacía al enviar", entrada.value === "");
  const accion = ultima().querySelector(".chat-accion");
  comprobar(
    "la respuesta trae el botón de navegación",
    accion !== null &&
      accion.dataset.vista === "subneting" &&
      accion.getAttribute("href") === "#" &&
      accion.textContent.length > 0,
    accion && accion.outerHTML,
  );

  accion.click();
  await esperar();
  comprobar("el botón carga la vista indicada", pedidos.includes("subneting.html"), pedidos);
  comprobar(
    "al navegar desde el chat el panel se cierra",
    panel.hasAttribute("hidden") && lanzador.getAttribute("aria-expanded") === "false",
  );
  comprobar(
    "el fragmento cargado no se lleva por delante el chat",
    doc.getElementById("cuerpo").querySelector(".chat-widget") === null && burbujas().length === 3,
  );

  // --- Seguridad: los mensajes son texto ---
  lanzador.click();
  await preguntar("<img src=x onerror=alert(1)>");
  comprobar("un mensaje con HTML no crea nodos", registro.querySelector("img") === null);
  comprobar(
    "el mensaje se ve tal cual se escribió",
    registro.textContent.includes("<img src=x onerror=alert(1)>"),
  );

  // --- Persistencia ---
  const guardado = JSON.parse(win.localStorage.getItem("chat") || "[]");
  comprobar(
    "el historial queda en localStorage",
    Array.isArray(guardado) && guardado.length === burbujas().length,
    guardado.length,
  );
  comprobar(
    "el historial guarda autor y texto de cada mensaje",
    guardado.every((mensaje) => Boolean(mensaje.autor) && Boolean(mensaje.texto)),
  );

  // --- Teclado y borrado ---
  entrada.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  comprobar("Escape cierra el panel", panel.hasAttribute("hidden"));

  const antesDeBorrar = burbujas().length;
  lanzador.click();
  doc.getElementById("chatLimpiar").click();
  comprobar(
    "borrar deja solo el saludo y vacía el almacén",
    antesDeBorrar > 1 &&
      burbujas().length === 1 &&
      JSON.parse(win.localStorage.getItem("chat")).length === 1,
    antesDeBorrar,
  );

  console.log(fallos === 0 ? "\nTODO OK" : "\n" + fallos + " FALLOS");
  process.exit(fallos ? 1 : 0);
})();

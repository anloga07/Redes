// Asistente de chat del sitio: bot de reglas, sin backend ni clave de API.
//
// Las respuestas salen de BASE_CONOCIMIENTO (scripts/chatDatos.js) y la
// navegación reutiliza el listener delegado de redes.js: el botón de una
// respuesta es un enlace con data-vista, no una llamada nueva a cargarFragmento.
//
// El widget vive en index.html (fuera de #cuerpo) y el historial se guarda en
// localStorage con la clave "chat". Los mensajes se pintan con createElement y
// textContent: nunca se construye HTML con datos del usuario.
const CLAVE_HISTORIAL = "chat";
const MAXIMO_MENSAJES = 40;
const UMBRAL_RESPUESTA = 3;
const MENSAJE_INICIAL =
  "Hola. Soy el asistente de Redes IP. Pregúntame por las clases de direcciones, las máscaras, el subneting o cualquiera de las herramientas del sitio.";
const MENSAJE_SIN_RESPUESTA =
  "No tengo una respuesta para eso. Prueba con alguna de estas preguntas o mira el menú.";

let historial = [];

// Deja el mensaje en el mismo formato que las claves de la base de
// conocimiento: minúsculas, sin acentos y sin signos de puntuación.
function normalizarTexto(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Suma la longitud de cada clave que aparezca como palabra completa: así
// "mascara" pesa más que "ip" y no se confunde "red" con "subred".
function puntuarIntencion(mensaje, intencion) {
  const texto = " " + mensaje + " ";
  let puntos = 0;
  intencion.claves.forEach((clave) => {
    if (texto.includes(" " + clave + " ")) puntos += clave.length;
  });
  return puntos;
}

function buscarIntencion(mensaje) {
  const texto = normalizarTexto(mensaje);
  if (!texto) return null;
  let mejor = null;
  let maxima = 0;
  BASE_CONOCIMIENTO.forEach((intencion) => {
    const puntos = puntuarIntencion(texto, intencion);
    if (puntos > maxima) {
      maxima = puntos;
      mejor = intencion;
    }
  });
  return maxima >= UMBRAL_RESPUESTA ? mejor : null;
}

// Se mantiene asíncrona a propósito: el día que haya un endpoint real solo hay
// que cambiar el cuerpo de esta función y toda la interfaz sigue valiendo.
async function responder(mensaje) {
  const intencion = buscarIntencion(mensaje);
  if (!intencion) {
    return { texto: MENSAJE_SIN_RESPUESTA, sugerencias: sugerenciasIniciales() };
  }
  return { texto: intencion.respuesta, vista: intencion.vista, etiqueta: intencion.etiqueta };
}

function sugerenciasIniciales() {
  return BASE_CONOCIMIENTO.slice(0, 3).map((intencion) => intencion.pregunta);
}

// Solo se ofrece el botón si la vista existe de verdad en el sitio.
function vistaValida(vista) {
  return (
    Boolean(vista) &&
    typeof VISTAS !== "undefined" &&
    Object.prototype.hasOwnProperty.call(VISTAS, vista)
  );
}

function crearBurbuja(autor) {
  const burbuja = document.createElement("div");
  const variante = autor === "usuario" ? "chat-mensaje-usuario" : "chat-mensaje-bot";
  burbuja.className = "chat-mensaje " + variante;
  return burbuja;
}

function anadirAccion(burbuja, mensaje) {
  if (!vistaValida(mensaje.vista)) return;
  const enlace = document.createElement("a");
  enlace.className = "chat-accion";
  enlace.href = "#";
  enlace.dataset.vista = mensaje.vista;
  enlace.textContent = mensaje.etiqueta || "Abrir";
  enlace.addEventListener("click", cerrarChat);
  burbuja.appendChild(enlace);
}

function crearSugerencia(pregunta) {
  const boton = document.createElement("button");
  boton.className = "chat-sugerencia";
  boton.type = "button";
  boton.textContent = pregunta;
  boton.addEventListener("click", () => enviarTexto(pregunta));
  return boton;
}

function anadirSugerencias(burbuja, sugerencias) {
  if (!Array.isArray(sugerencias) || sugerencias.length === 0) return;
  const lista = document.createElement("div");
  lista.className = "chat-sugerencias";
  sugerencias.forEach((pregunta) => lista.appendChild(crearSugerencia(pregunta)));
  burbuja.appendChild(lista);
}

function pintarMensaje(mensaje) {
  const registro = document.getElementById("chatRegistro");
  if (!registro) return;
  const burbuja = crearBurbuja(mensaje.autor);
  const texto = document.createElement("p");
  texto.className = "chat-texto";
  texto.textContent = mensaje.texto;
  burbuja.appendChild(texto);
  anadirAccion(burbuja, mensaje);
  anadirSugerencias(burbuja, mensaje.sugerencias);
  registro.appendChild(burbuja);
  registro.scrollTop = registro.scrollHeight;
}

function guardarHistorial() {
  try {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
  } catch (error) {
    console.error("No se pudo guardar el chat:", error);
  }
}

function leerHistorial() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudo leer el chat:", error);
    return [];
  }
}

function agregarMensaje(autor, respuesta) {
  const mensaje = {
    autor,
    texto: respuesta.texto,
    vista: respuesta.vista,
    etiqueta: respuesta.etiqueta,
    sugerencias: respuesta.sugerencias,
  };
  historial = historial.concat(mensaje).slice(-MAXIMO_MENSAJES);
  guardarHistorial();
  pintarMensaje(mensaje);
}

async function enviarTexto(texto) {
  const limpio = String(texto).trim();
  if (!limpio) return;
  agregarMensaje("usuario", { texto: limpio });
  const respuesta = await responder(limpio);
  agregarMensaje("bot", respuesta);
}

function manejarEnvio(evento) {
  evento.preventDefault();
  const entrada = document.getElementById("chatEntrada");
  if (!entrada) return;
  const texto = entrada.value;
  entrada.value = "";
  enviarTexto(texto);
  entrada.focus();
}

function abrirChat() {
  const panel = document.getElementById("chatPanel");
  const lanzador = document.getElementById("chatLanzador");
  const entrada = document.getElementById("chatEntrada");
  if (!panel || !lanzador) return;
  panel.hidden = false;
  lanzador.setAttribute("aria-expanded", "true");
  lanzador.setAttribute("aria-label", "Cerrar chat de ayuda");
  if (entrada) entrada.focus();
  const registro = document.getElementById("chatRegistro");
  if (registro) registro.scrollTop = registro.scrollHeight;
}

function cerrarChat() {
  const panel = document.getElementById("chatPanel");
  const lanzador = document.getElementById("chatLanzador");
  if (!panel || !lanzador) return;
  panel.hidden = true;
  lanzador.setAttribute("aria-expanded", "false");
  lanzador.setAttribute("aria-label", "Abrir chat de ayuda");
  lanzador.focus();
}

function alternarChat() {
  const panel = document.getElementById("chatPanel");
  if (!panel) return;
  if (panel.hidden) {
    abrirChat();
  } else {
    cerrarChat();
  }
}

function manejarTecla(evento) {
  const panel = document.getElementById("chatPanel");
  if (evento.key !== "Escape" || !panel || panel.hidden) return;
  cerrarChat();
}

function iniciarConversacion() {
  if (historial.length === 0) {
    agregarMensaje("bot", { texto: MENSAJE_INICIAL });
    return;
  }
  historial.forEach((mensaje) => pintarMensaje(mensaje));
}

function borrarChat() {
  historial = [];
  guardarHistorial();
  const registro = document.getElementById("chatRegistro");
  if (registro) registro.textContent = "";
  iniciarConversacion();
  const entrada = document.getElementById("chatEntrada");
  if (entrada) entrada.focus();
}

function iniciarChat() {
  historial = leerHistorial();
  iniciarConversacion();
  const acciones = [
    ["chatLanzador", "click", alternarChat],
    ["chatCerrar", "click", cerrarChat],
    ["chatLimpiar", "click", borrarChat],
    ["chatFormulario", "submit", manejarEnvio],
  ];
  acciones.forEach(([id, evento, manejador]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.addEventListener(evento, manejador);
  });

  // Escape se escucha en document y no en el widget: el panel no atrapa el foco,
  // así que el usuario puede estar escribiendo en cualquier otra parte de la página.
  document.addEventListener("keydown", manejarTecla);
}

iniciarChat();

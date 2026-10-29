// Las rutas de este script son relativas a la raíz del repositorio.
process.chdir(require("path").join(__dirname, ".."));

// Prueba de integración: simula la carga de cada fragmento, el clic de sus
// botones y la persistencia en localStorage (recargas incluidas)
const fs = require("fs");

function crearElemento(tag) {
  const e = {
    tag: tag || "div",
    value: "",
    checked: false,
    textContent: "",
    innerText: "",
    className: "",
    children: [],
    _q: null,
    _lis: null,
    _texto: false,
    onclick: null,
    onkeypress: null,
    get id() {
      return e._id || "";
    },
    set id(v) {
      e._id = v;
      elementos[v] = e;
    },
    get innerHTML() {
      return serializar(e);
    },
    set innerHTML(v) {
      e.children = v === "" ? [] : [v];
    },
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      },
    },
    appendChild(h) {
      e.children.push(h);
      return h;
    },
    append(...nodos) {
      for (const n of nodos) e.children.push(n);
    },
    replaceChildren(...nodos) {
      e.children = [];
      for (const n of nodos) e.children.push(n);
    },
    remove() {},
    addEventListener(t, fn) {
      (e._lis = e._lis || {})[t] = (e._lis[t] || []).concat(fn);
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    querySelector() {
      if (!e._q) e._q = crearElemento();
      return e._q;
    },
  };
  return e;
}

// Reconstruye el contenido como texto (equivalente a innerHTML) para poder comprobarlo
function serializar(e) {
  return (e.children || [])
    .map((n) => {
      if (typeof n === "string") return n;
      if (n._html !== undefined) return n._html;
      if (n._texto) return n.textContent;
      const clase = n.className ? ' class="' + n.className + '"' : "";
      const tag = n.tag || "div";
      return "<" + tag + clase + ">" + serializar(n) + "</" + tag + ">";
    })
    .join("");
}

const elementos = {};
global.document = {
  getElementById(id) {
    if (!elementos[id]) elementos[id] = crearElemento();
    return elementos[id];
  },
  createElement(tag) {
    return crearElemento(tag);
  },
  createTextNode(t) {
    const e = crearElemento();
    e._texto = true;
    e.textContent = t;
    return e;
  },
  addEventListener() {},
  querySelectorAll() {
    return [];
  },
  createRange() {
    return {
      selectNodeContents() {},
      selectNode() {},
      createContextualFragment(html) {
        return { _html: html };
      },
    };
  },
};
global.window = global;
// El tema claro/oscuro (redes.js) consulta documentElement al cargar.
global.document.documentElement = {
  setAttribute: () => undefined,
  getAttribute: () => "dark",
};
global.alert = () => {};
global.prompt = () => null;
const almacen = {};
global.localStorage = {
  getItem: (k) => (k in almacen ? almacen[k] : null),
  setItem: (k, v) => {
    almacen[k] = String(v);
  },
  removeItem: (k) => {
    delete almacen[k];
  },
};

for (const f of [
  "scripts/redes.js",
  "scripts/scriptpass.js",
  "scripts/scriptTareas.js",
  "scripts/notas.js",
]) {
  // eval indirecto: las funciones pasan a ser globales (igual que en un <script> de navegador)
  (0, eval)(fs.readFileSync(f, "utf8"));
}

let fallos = 0;
function comprobar(nombre, cond, detalle) {
  if (cond) console.log("OK   " + nombre);
  else {
    fallos++;
    console.log("FALLA " + nombre + (detalle ? " -> " + detalle : ""));
  }
}
const el = (id) => document.getElementById(id);
const disparar = (elemento, evento) =>
  ((elemento._lis && elemento._lis[evento]) || []).forEach((fn) => fn());

// ============ PassGenerator ============
el("length").value = "12";
el("includeLetters").checked = true;
el("includeNumbers").checked = true;
el("includeSymbols").checked = true;

inicializarFragmento("pass.html");
inicializarFragmento("pass.html"); // doble carga no debe romper nada
comprobar("pass: botón enganchado", typeof el("generateBtn").onclick === "function");
el("generateBtn").onclick();
const pass = el("passwordResult").innerText;
comprobar(
  "pass: genera contraseña de 12 caracteres",
  pass.length === 12 && pass !== "Aquí aparecerá tu contraseña",
  pass,
);

// Botón Copiar: se muestra tras generar y copia el texto (Clipboard API simulada)
let copiado = null;
global.isSecureContext = true;
Object.defineProperty(global, "navigator", {
  configurable: true,
  value: {
    clipboard: {
      writeText: (t) => {
        copiado = t;
        return Promise.resolve();
      },
    },
  },
});
comprobar("pass: el botón Copiar aparece tras generar", el("copyBtn").hidden === false);
el("copyBtn").onclick();
comprobar("pass: el botón Copiar copia la contraseña", copiado === pass, copiado);

el("login").value = "ana@colegio.es";
el("saveBtn").onclick();
comprobar(
  "pass: guarda en localStorage",
  (almacen["contrasenas"] || "").includes("ana@colegio.es"),
);
comprobar("pass: limpia el login", el("login").value === "");
let filas = el("savedTable").querySelector().children;
comprobar("pass: pinta 1 fila", filas.length === 1);
comprobar(
  "pass: fila con login y contraseña",
  filas[0].children[0].textContent === "ana@colegio.es" &&
    filas[0].children[1].textContent === pass,
);

// Simular recarga de la web: el fragmento se vuelve a inyectar e inicializar
inicializarFragmento("pass.html");
filas = el("savedTable").querySelector().children;
comprobar(
  "pass: la tabla sobrevive a la recarga",
  filas.length === 1 && filas[0].children[0].textContent === "ana@colegio.es",
);

// Eliminar fila (botones de la tabla: Copiar + Eliminar)
const acciones = filas[0].children[2].children[0];
const botonCopiar = acciones.children[0];
const botonEliminar = acciones.children[1];
comprobar("pass: hay botón Copiar en la fila", typeof botonCopiar.onclick === "function");
comprobar(
  "pass: hay botón Eliminar en la fila",
  botonEliminar.textContent === "Eliminar" && typeof botonEliminar.onclick === "function",
);
botonEliminar.onclick();
comprobar("pass: elimina del almacenamiento", (almacen["contrasenas"] || "[]") === "[]");
comprobar("pass: elimina de la tabla", el("savedTable").querySelector().children.length === 0);

// ============ Tareas ============
inicializarFragmento("tareas.html");
comprobar("tareas: botón enganchado", typeof el("addTaskButton").onclick === "function");
el("taskInput").value = "Estudiar subneting";
el("addTaskButton").onclick();
comprobar(
  "tareas: guarda en localStorage",
  (almacen["tareas"] || "").includes("Estudiar subneting"),
);
comprobar("tareas: limpia el campo", el("taskInput").value === "");

// Simular recarga de la web
inicializarFragmento("tareas.html");
const tareasDOM = el("taskList").children;
comprobar(
  "tareas: la lista sobrevive a la recarga",
  tareasDOM.length === 1 &&
    tareasDOM[0].children[0].children[0].textContent === "Estudiar subneting",
);

// Marcar como completada
disparar(tareasDOM[0].children[1], "click");
comprobar(
  "tareas: marcar completada persiste",
  (almacen["tareas"] || "").includes('"completada":true'),
);

// Editar
global.prompt = () => "Repasar máscaras";
disparar(tareasDOM[0].children[2], "click");
comprobar(
  "tareas: editar persiste",
  (almacen["tareas"] || "").includes("Repasar máscaras"),
  almacen["tareas"],
);
comprobar(
  "tareas: editar actualiza el texto en pantalla",
  tareasDOM[0].children[0].children[0].textContent === "Repasar máscaras",
);

// Eliminar
disparar(tareasDOM[0].children[3], "click");
comprobar("tareas: eliminar limpia el almacenamiento", (almacen["tareas"] || "[]") === "[]");
comprobar("tareas: eliminar limpia la pantalla", el("taskList").children.length === 0);

// ============ Notas ============
inicializarFragmento("notas.html");
comprobar(
  'notas: al entrar la lista está oculta ("Ver notas")',
  el("btn-cargar").innerHTML.includes("Ver notas"),
);

el("titulo").value = "Prueba";
el("contenido").value = "Contenido de prueba";
el("fecha").value = "2026-10-09T10:00";
guardarNota();
comprobar("notas: guarda en localStorage", (almacen["notas"] || "").includes("Prueba"));
comprobar("notas: limpia el formulario", el("titulo").value === "" && el("contenido").value === "");
comprobar("notas: la nota aparece al guardar", el("lista-notas").children.length === 1);
comprobar(
  "notas: título correcto en pantalla",
  el("lista-notas").children[0].children[0].children[0].textContent === "Prueba",
);

// Toggle mostrar/ocultar
comprobar(
  'notas: tras guardar el botón dice "Ocultar notas"',
  el("btn-cargar").innerHTML.includes("Ocultar notas"),
);
alternarNotas();
comprobar(
  'notas: el toggle vuelve a "Ver notas"',
  el("btn-cargar").innerHTML.includes("Ver notas"),
);
alternarNotas();

// Editar en línea
const idNota = JSON.parse(almacen["notas"])[0].id;
editarNota(idNota);
comprobar(
  "notas: editar carga los valores actuales",
  el("edit-titulo").value === "Prueba" && el("edit-contenido").value === "Contenido de prueba",
);
el("edit-titulo").value = "Prueba editada";
el("edit-contenido").value = "Contenido editado";
guardarEdicionNota(idNota);
comprobar(
  "notas: la edición persiste",
  almacen["notas"].includes("Prueba editada") && almacen["notas"].includes("Contenido editado"),
);
comprobar(
  "notas: la edición se ve en pantalla",
  el("lista-notas").children[0].children[0].children[0].textContent === "Prueba editada",
);

// Cancelar no modifica
editarNota(idNota);
el("edit-titulo").value = "No debería guardarse";
cancelarEdicion();
comprobar(
  "notas: cancelar no modifica los datos",
  !almacen["notas"].includes("No debería guardarse"),
);

// Simular recarga: la lista empieza oculta y las notas se recuperan
inicializarFragmento("notas.html");
comprobar(
  "notas: sobreviven a la recarga",
  el("lista-notas").children.length === 1 &&
    el("lista-notas").children[0].children[0].children[0].textContent === "Prueba editada",
);

// ============ Otros fragmentos ============
inicializarFragmento("inicio.html");
inicializarFragmento("subneting.html");
inicializarFragmento("agenda.html");
comprobar("fragmentos sin inicializador no lanzan error", true);

// Datos corruptos no rompen nada
almacen["tareas"] = "{esto no es json";
almacen["contrasenas"] = "no-array";
inicializarFragmento("tareas.html");
inicializarFragmento("pass.html");
comprobar("datos corruptos: no lanzan error", true);

console.log(fallos === 0 ? "\nTODO OK" : "\n" + fallos + " FALLOS");
process.exit(fallos ? 1 : 0);

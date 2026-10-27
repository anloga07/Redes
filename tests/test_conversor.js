// Verifica el Conversor de bases (conversor.html + scripts/scriptConversor.js):
// la validación por sistema, las cuatro equivalencias, el límite de 32 bits y
// el caso que antes escribía el octal con toString(16).
// Uso: node tests/test_conversor.js
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const raiz = path.join(__dirname, "..");
const leer = (rel) => fs.readFileSync(path.join(raiz, rel), "utf8");

const dom = new JSDOM('<!DOCTYPE html><html><body><main id="cuerpo"></main></body></html>', {
  runScripts: "outside-only",
  url: "http://localhost/",
});
const win = dom.window;
const doc = win.document;

const cuerpo = doc.getElementById("cuerpo");
cuerpo.appendChild(doc.createRange().createContextualFragment(leer("conversor.html")));
win.eval(leer("scripts/scriptConversor.js"));
win.iniciarConversor();

let fallos = 0;
function comprobar(nombre, condicion, detalle) {
  if (condicion) {
    console.log("OK   " + nombre);
    return;
  }
  fallos++;
  console.log("FALLA " + nombre + (detalle === undefined ? "" : " -> " + JSON.stringify(detalle)));
}

const selector = doc.getElementById("base-origen");
const campo = doc.getElementById("numero-convertir");
const boton = doc.getElementById("btn-convertir");
const resultado = doc.getElementById("resultado-conversor");
const ayuda = doc.getElementById("ayuda-conversor");

// Texto de cada fila del resultado con el formato "Etiqueta valor".
function filas() {
  return [...resultado.querySelectorAll(".conversor-fila")].map(
    (fila) =>
      fila.querySelector(".conversor-etiqueta").textContent.trim() +
      " " +
      fila.querySelector(".conversor-valor").textContent.trim().replace(/\s+/g, " "),
  );
}

function aviso() {
  const parrafo = resultado.querySelector(".conversor-aviso");
  return parrafo ? parrafo.textContent : "";
}

// Cambia de sistema (como el usuario) y convierte el valor indicado.
function convertir(base, valor) {
  selector.value = String(base);
  selector.dispatchEvent(new win.Event("change"));
  campo.value = valor;
  boton.click();
  return filas();
}

// --- Estructura del fragmento ---
comprobar(
  "el resultado se anuncia con aria-live",
  resultado.getAttribute("aria-live") === "polite",
);
comprobar("el campo empieza en decimal", selector.value === "10" && campo.placeholder === "192", [
  selector.value,
  campo.placeholder,
]);
comprobar(
  "la ayuda está asociada al campo",
  campo.getAttribute("aria-describedby") === "ayuda-conversor",
  campo.getAttribute("aria-describedby"),
);
comprobar("el campo no recorta lo pegado", !campo.hasAttribute("maxlength"));

// --- Conversiones válidas ---
comprobar(
  "decimal 192 -> binario/octal/hexadecimal",
  JSON.stringify(convertir(10, "192")) ===
    JSON.stringify(["Decimal 192", "Binario 11000000", "Octal 300", "Hexadecimal C0"]),
  convertir(10, "192"),
);
comprobar(
  "hexadecimal C0 -> 192 (el octal dejó de salir en hexadecimal)",
  JSON.stringify(convertir(16, "C0")) ===
    JSON.stringify(["Decimal 192", "Binario 11000000", "Octal 300", "Hexadecimal C0"]),
  convertir(16, "C0"),
);
comprobar(
  "hexadecimal admite minúsculas",
  convertir(16, "ff")[0] === "Decimal 255" && convertir(16, "ff")[2] === "Octal 377",
  convertir(16, "ff"),
);
comprobar("octal 777 -> 511", convertir(8, "777")[0] === "Decimal 511", convertir(8, "777"));
comprobar(
  "el binario se agrupa en octetos",
  convertir(2, "111110100")[1] === "Binario 00000001 11110100",
  convertir(2, "111110100"),
);
comprobar(
  "el cero es un valor válido",
  convertir(10, "0")[1] === "Binario 00000000" && convertir(10, "0")[0] === "Decimal 0",
  convertir(10, "0"),
);
comprobar(
  "el máximo de 32 bits se acepta",
  convertir(10, "4294967295")[3] === "Hexadecimal FFFFFFFF",
  convertir(10, "4294967295"),
);
comprobar(
  "los espacios sobrantes se ignoran",
  convertir(10, " 192 ")[0] === "Decimal 192",
  convertir(10, " 192 "),
);
comprobar(
  "acepta el binario agrupado que imprime la herramienta",
  convertir(2, "11000000 10101000")[0] === "Decimal 49320",
  convertir(2, "11000000 10101000"),
);

// --- Validación ---
comprobar(
  "el campo vacío avisa",
  convertir(10, "").length === 0 && /Escribe un número/.test(aviso()),
  aviso(),
);
comprobar(
  "un binario con dígitos inválidos no se convierte",
  convertir(2, "1012").length === 0 && /no es un número binario válido/.test(aviso()),
  aviso(),
);
comprobar(
  "un octal fuera de rango no se convierte",
  convertir(8, "98").length === 0 && /no es un número octal válido/.test(aviso()),
  aviso(),
);
comprobar(
  "un hexadecimal con G no se convierte",
  convertir(16, "1G").length === 0 && /no es un número hexadecimal válido/.test(aviso()),
  aviso(),
);
comprobar(
  "no se aceptan negativos",
  convertir(10, "-5").length === 0 && /no es un número decimal válido/.test(aviso()),
  aviso(),
);
comprobar(
  "el límite de 32 bits se explica",
  convertir(10, "4294967296").length === 0 && /32 bits/.test(aviso()),
  aviso(),
);
comprobar(
  "los valores largos pegados no se recortan en silencio",
  convertir(2, "1".repeat(40)).length === 0 && /32 bits/.test(aviso()),
  aviso(),
);
comprobar(
  "el error se marca en el campo y en el aviso",
  campo.getAttribute("aria-invalid") === "true" &&
    resultado.querySelector(".conversor-aviso-error") !== null,
  [campo.getAttribute("aria-invalid"), aviso()],
);
comprobar(
  "el texto del aviso escapa el valor escrito",
  convertir(10, "<b>1</b>")[0] === undefined && resultado.querySelector("b") === null,
  aviso(),
);

// --- Interacción ---
selector.value = "16";
selector.dispatchEvent(new win.Event("change"));
comprobar(
  "al cambiar de sistema se limpia el campo y la ayuda",
  campo.value === "" && campo.placeholder === "C0" && /A a la F/.test(ayuda.textContent),
  [campo.value, campo.placeholder, ayuda.textContent],
);
comprobar(
  "el aviso vuelve al texto inicial y el campo deja de estar marcado",
  aviso() === "Escribe un número y pulsa «Convertir»." && !campo.hasAttribute("aria-invalid"),
  [aviso(), campo.getAttribute("aria-invalid")],
);

campo.value = "FF";
campo.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
comprobar("Intro también convierte", filas()[0] === "Decimal 255", filas());
comprobar(
  "una conversión correcta retira el estado de error",
  !campo.hasAttribute("aria-invalid") && resultado.querySelector(".conversor-aviso-error") === null,
  campo.getAttribute("aria-invalid"),
);

selector.value = "2";
selector.dispatchEvent(new win.Event("change"));
comprobar(
  "el binario anuncia su propio formato",
  /solo 0 y 1/.test(ayuda.textContent) && campo.placeholder === "11000000",
  [ayuda.textContent, campo.placeholder],
);

console.log(fallos === 0 ? "\nTODO OK" : "\n" + fallos + " FALLOS");
process.exit(fallos ? 1 : 0);

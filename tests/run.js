// Ejecuta todas las suites de verificación del sitio.
// Uso: npm test  (equivalente a  node tests/run.js)
//
// Cada suite es un script independiente que termina con código 0 si todo va
// bien. Aquí se lanzan todas con la raíz del repositorio como directorio de
// trabajo, se resume cada una en una línea y se muestran completas solo si
// fallan. Estas suites no sustituyen a los linters: comprueban el
// comportamiento (cálculos de IP, herramientas, navegación, DOM real con jsdom)
// y las invariantes del proyecto (portada duplicada, fragmentos puros...).
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const raiz = path.join(__dirname, "..");
const htmls = [
  "index.html",
  "inicio.html",
  "teoria.html",
  "clases.html",
  "subneting.html",
  "conversor.html",
  "pass.html",
  "tareas.html",
  "notas.html",
  "agenda.html",
];

const suites = [
  { nombre: "utilidades y cálculos de IP", script: "test_redes.js" },
  { nombre: "flujo de las herramientas", script: "test_flujo.js" },
  { nombre: "fragmentos, navegación y accesibilidad", script: "test_fragmentos.js" },
  { nombre: "sincronía de la portada duplicada", script: "sync_check.js" },
  { nombre: "sincronía: casos que deben fallar", script: "test_sync_negativo.js" },
  { nombre: "copia al portapapeles con reserva", script: "test_copia_fallback.js" },
  { nombre: "DOM real (jsdom)", script: "test_dom_real.js" },
  { nombre: "conversor de bases", script: "test_conversor.js" },
  { nombre: "asistente de chat", script: "test_chat.js" },
  // index.html sí lleva doctype/head/link, así que allí solo se mira el balance.
  ...htmls.map((f) => ({
    nombre: "balance del marcado de " + f,
    script: "check_balance.js",
    args: f === "index.html" ? [f, "balance"] : [f],
  })),
];

let fallos = 0;
const fallidas = [];

for (const suite of suites) {
  const resultado = spawnSync(
    process.execPath,
    [path.join(__dirname, suite.script), ...(suite.args || [])],
    { cwd: raiz, encoding: "utf8" },
  );
  const salida = (resultado.stdout || "").trim();
  const errores = (resultado.stderr || "").trim();
  // El resumen se toma de stdout: algunas suites provocan a propósito errores
  // del sitio (JSON corrupto) y estos llegan por stderr como ruido esperado.
  if (resultado.status === 0) {
    const resumen = salida.split("\n").pop() || "";
    console.log("OK   " + suite.nombre + " -> " + resumen);
  } else {
    fallos++;
    fallidas.push(suite.nombre);
    console.log("FALLA " + suite.nombre);
    console.log((salida + (errores ? "\n--- stderr ---\n" + errores : "")).trim());
  }
}

console.log("\n" + (suites.length - fallos) + "/" + suites.length + " suites correctas");
if (fallos > 0) {
  console.log("Fallan: " + fallidas.join(", "));
  process.exit(1);
}

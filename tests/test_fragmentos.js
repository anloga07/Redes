// Las rutas de este script son relativas a la raíz del repositorio.
process.chdir(require("path").join(__dirname, ".."));

const fs = require("fs");

const idx = fs.readFileSync("index.html", "utf8");
const scripts = [...idx.matchAll(/<script src="([^"]+\.js)"/g)].map((m) => m[1]);
console.log("Scripts locales en index.html: " + scripts.join(", "));

let js = "";
for (const s of scripts) {
  if (/^https?:/.test(s)) continue;
  js += fs.readFileSync(s.replace(/^\.\//, ""), "utf8") + "\n";
}

const redes = fs.readFileSync("scripts/redes.js", "utf8");
const fragments = [
  "inicio.html",
  "teoria.html",
  "clases.html",
  "subneting.html",
  "conversor.html",
  "pass.html",
  "notas.html",
  "tareas.html",
  "agenda.html",
];
const todos = ["index.html"].concat(fragments);
let fallos = 0;
const fallo = (msg) => {
  console.log("FALLA " + msg);
  fallos++;
};
const ok = (msg) => console.log("OK   " + msg);

// --- 1. Ningún manejador en línea en el HTML (HTML-05) ---
for (const f of todos) {
  const html = fs.readFileSync(f, "utf8");
  const m = html.match(
    /\son(?:click|change|input|keypress|keyup|keydown|submit|blur|focus|load)\s*=/,
  );
  if (m) fallo(f + ": manejador en línea" + m[0]);
  else ok(f + ": sin manejadores en línea");
}

// --- 2. Los data-vista del HTML existen en el mapa VISTAS de redes.js ---
const bloque = redes.match(/const VISTAS = \{([\s\S]*?)\};/);
const vistas = {};
if (bloque) for (const m of bloque[1].matchAll(/(\w+):\s*"([\w.]+\.html)"/g)) vistas[m[1]] = m[2];
if (Object.keys(vistas).length === 0) fallo("no se pudo leer el mapa VISTAS de redes.js");
else
  ok(
    "mapa VISTAS: " +
      Object.entries(vistas)
        .map(([k, v]) => k + "->" + v)
        .join(", "),
  );

for (const [vista, archivo] of Object.entries(vistas)) {
  if (!fs.existsSync(archivo))
    fallo("VISTAS: " + vista + " apunta a " + archivo + " que no existe");
}

const usadas = new Set();
for (const f of todos) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(/data-vista="([\w-]+)"/g)) {
    usadas.add(m[1]);
    if (!vistas[m[1]]) fallo(f + ': data-vista="' + m[1] + '" no está en VISTAS');
  }
}
for (const v of [...usadas].sort()) if (vistas[v]) ok('data-vista="' + v + '" -> ' + vistas[v]);
const sinUsar = Object.keys(vistas).filter((v) => !usadas.has(v));
if (sinUsar.length) console.log("AVISO vistas sin ningún enlace: " + sinUsar.join(", "));

// --- 3. Inicializadores de fragmento registrados ---
const inicializadores = [
  ["clases.html", "iniciarClases"],
  ["subneting.html", "iniciarSubneting"],
  ["conversor.html", "iniciarConversor"],
  ["pass.html", "iniciarPass"],
  ["tareas.html", "iniciarTareas"],
  ["notas.html", "cargarNotas"],
];
for (const [frag, fn] of inicializadores) {
  // Tolerante al formateo: Prettier usa comillas dobles (singleQuote: false).
  const enMapa = new RegExp(
    "[\"']" + frag.replace(".", "\\.") + "[\"']\\s*:\\s*[\"']" + fn + "[\"']",
  ).test(redes);
  const definida = new RegExp("function\\s+" + fn + "\\b").test(js);
  if (enMapa && definida) ok("inicializador " + frag + " -> " + fn + "()");
  else
    fallo(
      "inicializador " +
        frag +
        " -> " +
        fn +
        "() (mapa: " +
        enMapa +
        ", función: " +
        definida +
        ")",
    );
}

// --- 4. Ningún fragmento debe llevar <script> ni <link> (markup puro) ---
for (const f of fragments) {
  const html = fs.readFileSync(f, "utf8");
  const conScript = /<script/i.test(html);
  const conLink = /<link/i.test(html);
  const conDoctype = /<!DOCTYPE/i.test(html);
  if (!conScript && !conLink && !conDoctype) ok(f + ": markup puro (sin script/link/doctype)");
  else fallo(f + ": contiene script=" + conScript + " link=" + conLink + " doctype=" + conDoctype);
}

// --- 5. Los ids que busca el JS existen en el HTML (o los crea el JS) ---
const idsHTML = new Set();
for (const f of todos)
  for (const m of fs.readFileSync(f, "utf8").matchAll(/\sid="([\w-]+)"/g)) idsHTML.add(m[1]);
// Ids que el propio JS crea en tiempo de ejecución (formulario de edición de notas)
const idsCreados = new Set();
for (const m of js.matchAll(/\.id = ["']([\w-]+)["']/g)) idsCreados.add(m[1]);
for (const m of js.matchAll(/setAttribute\(["']id["'],\s*["']([\w-]+)["']\)/g))
  idsCreados.add(m[1]);
const idsBuscados = new Set();
for (const m of js.matchAll(/getElementById\(["']([\w-]+)["']\)/g)) idsBuscados.add(m[1]);
for (const id of [...idsBuscados].sort()) {
  if (idsHTML.has(id)) ok('el HTML define el id "' + id + '" que busca el JS');
  else if (idsCreados.has(id)) ok('el JS crea en tiempo de ejecución el id "' + id + '" que busca');
  else fallo('el JS busca el id "' + id + '" y no lo define ningún HTML ni el propio JS');
}

// --- 6. Los iconos decorativos de Bootstrap Icons no se anuncian (A11Y) ---
// Un <i class="bi …"> solo lleva el glifo por CSS y siempre acompaña a texto, así
// que debe ir marcado con aria-hidden="true" para que el lector de pantalla lo ignore.
let iconos = 0;
for (const f of todos) {
  const html = fs.readFileSync(f, "utf8");
  const total = (html.match(/<i class="bi\b/g) || []).length;
  const ocultos = (html.match(/<i class="bi[^"]*" aria-hidden="true">/g) || []).length;
  iconos += total;
  if (total === ocultos) ok(f + ": los " + total + ' iconos van con aria-hidden="true"');
  else fallo(f + ": " + (total - ocultos) + " de " + total + " iconos sin aria-hidden");
}
// Los que construye el JS: se busca aria-hidden en las líneas siguientes al createElement.
for (const f of ["scripts/notas.js", "scripts/scriptpass.js"]) {
  const lineas = fs.readFileSync(f, "utf8").split(/\r?\n/);
  const sinOcultar = [];
  let creados = 0;
  lineas.forEach((linea, i) => {
    if (/createElement\("i"\)/.test(linea)) {
      creados++;
      if (!/aria-hidden/.test(lineas.slice(i, i + 4).join("\n"))) sinOcultar.push(i + 1);
    }
  });
  if (creados === 0) fallo(f + ': no se encontró ningún createElement("i")');
  else if (sinOcultar.length === 0)
    ok(f + ": los " + creados + " iconos que crea el JS llevan aria-hidden");
  else fallo(f + ": iconos sin aria-hidden en las líneas " + sinOcultar.join(", "));
}

// --- 7. El enlace "saltar al contenido" existe y enfoca su destino (A11Y) ---
const enlaceSaltar = idx.match(/<a class="skip-link" href="#([\w-]+)"/);
if (!enlaceSaltar) fallo("index.html: no hay enlace skip-link");
else if (!new RegExp('id="' + enlaceSaltar[1] + '"[^>]*tabindex="-1"').test(idx)) {
  fallo(
    "skip-link -> #" +
      enlaceSaltar[1] +
      ' pero el destino no lleva tabindex="-1" (no recibiría el foco)',
  );
} else ok("skip-link -> #" + enlaceSaltar[1] + ' con tabindex="-1"');

const css = fs.readFileSync("css/estilos.css", "utf8");
if (/\.skip-link\s*\{[\s\S]*?top:/.test(css) && /\.skip-link:focus\s*\{/.test(css)) {
  ok("css/estilos.css: .skip-link oculto y visible con :focus");
} else fallo("css/estilos.css: falta el estilo de .skip-link o su estado :focus");

// --- 8. Cabecera de la portada: idioma, descripción y SRI en los CDN (SEO/seguridad) ---
if (/<html lang="es"/.test(idx)) ok('index.html: lang="es"');
else fallo('index.html: falta lang="es" en <html>');

const idxPlano = idx.replace(/\s+/g, " ");
const descripcion = idxPlano.match(/<meta name="description" content="([^"]*)"/);
if (descripcion && descripcion[1].length >= 50 && descripcion[1].length <= 160) {
  ok("index.html: meta description de " + descripcion[1].length + " caracteres");
} else fallo("index.html: falta meta description (o no mide entre 50 y 160 caracteres)");

const externos =
  idxPlano.match(/<(?:link|script)[^>]*(?:href|src)="https:\/\/cdn\.jsdelivr\.net[^"]*"[^>]*>/g) ||
  [];
if (externos.length === 0) fallo("index.html: no se encontraron recursos de jsDelivr");
for (const etiqueta of externos) {
  const url = (etiqueta.match(/(?:href|src)="([^"]+)"/) || [])[1];
  if (/integrity="sha384-[^"]+"/.test(etiqueta) && /crossorigin/.test(etiqueta)) {
    ok("SRI: " + url.replace(/^https:\/\/cdn\.jsdelivr\.net\//, ""));
  } else fallo("SRI: " + url + " sin integrity sha384 o sin crossorigin");
}

// --- 9. Un h1 por vista y sin saltos de nivel (HTML-01) ---
// pintarHTML() reemplaza el contenido de #cuerpo, así que el h1 de la portada
// desaparece al navegar: cada fragmento tiene que traer el suyo.
for (const f of todos) {
  const niveles = [...fs.readFileSync(f, "utf8").matchAll(/<h([1-6])[\s>]/g)].map((m) =>
    Number(m[1]),
  );
  const cuantosH1 = niveles.filter((n) => n === 1).length;
  let salto = "";
  for (let i = 1; i < niveles.length; i++) {
    if (niveles[i] - niveles[i - 1] > 1) salto = "h" + niveles[i - 1] + "->h" + niveles[i];
  }
  if (cuantosH1 === 1 && niveles[0] === 1 && !salto) ok(f + ": un h1 y sin saltos de nivel");
  else {
    fallo(
      f + ": h1=" + cuantosH1 + ", primer nivel=h" + niveles[0] + (salto ? ", salto " + salto : ""),
    );
  }
}

// --- 10. Los contenedores que rellena el JS se anuncian (aria-live) ---
const contenedores = [
  ["clases.html", "result"],
  ["pass.html", "passwordResult"],
  ["tareas.html", "taskList"],
];
for (const [f, id] of contenedores) {
  const etiqueta = new RegExp('<[^>]*\\sid="' + id + '"[^>]*>').exec(fs.readFileSync(f, "utf8"));
  if (etiqueta && /aria-live="polite"/.test(etiqueta[0])) {
    ok(f + ": #" + id + ' es aria-live="polite"');
  } else {
    fallo(f + ": #" + id + ' sin aria-live="polite"');
  }
}

console.log(fallos === 0 ? "\nTODO OK" : "\n" + fallos + " FALLOS");
process.exit(fallos ? 1 : 0);

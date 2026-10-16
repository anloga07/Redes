// Las rutas de este script son relativas a la raíz del repositorio.
process.chdir(require("path").join(__dirname, ".."));

const fs = require("fs");

// Invariante de sincronia: la portada duplicada (inicio.html y el contenido inicial
// de #cuerpo en index.html) debe contener EXACTAMENTE las mismas etiquetas y las
// mismas palabras visibles. Se ignora el reparto de espacios/newlines porque Prettier
// formatea cada copia segun su indentacion (parte etiquetas largas en una y no en la otra),
// algo que no cambia el render.

function contenido(idx) {
  const m = idx.indexOf('id="cuerpo"');
  const s2 = idx.indexOf(">", m) + 1;
  const end = idx.indexOf("<footer");
  return idx.slice(s2, end).replace(/<\/(?:div|main)>\s*$/, "");
}

// Etiquetas: nombre + atributos con espacios internos normalizados.
const tags = (s) =>
  (s.match(/<[^<>]*>/g) || [])
    .map((t) => t.replace(/\s+/g, " ").replace(/\s+>$/, ">"))
    .filter((t) => !/^<!--/.test(t));

// Palabras visibles: sin etiquetas, espacios colapsados.
const palabras = (s) =>
  s
    .replace(/<[^<>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

const ini = fs.readFileSync("inicio.html", "utf8");
const idx = contenido(fs.readFileSync("index.html", "utf8"));

const T1 = tags(ini),
  T2 = tags(idx);
const W1 = palabras(ini),
  W2 = palabras(idx);

const etiquetasIguales = JSON.stringify(T1) === JSON.stringify(T2);
const palabrasIguales = JSON.stringify(W1) === JSON.stringify(W2);

function primeras(a, b, n) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length) && out.length < n; i++) {
    if (a[i] !== b[i])
      out.push(
        "  [" + i + "] inicio.html=" + JSON.stringify(a[i]) + "  #cuerpo=" + JSON.stringify(b[i]),
      );
  }
  return out.join("\n");
}

if (etiquetasIguales && palabrasIguales) {
  console.log(
    "SINCRONIZADO: inicio.html == #cuerpo inicial de index.html (" +
      T1.length +
      " etiquetas, " +
      W1.length +
      " palabras)",
  );
} else {
  console.log("DIVERGEN");
  if (!etiquetasIguales) {
    console.log("  etiquetas: inicio=" + T1.length + " #cuerpo=" + T2.length);
    console.log(primeras(T1, T2, 8));
  }
  if (!palabrasIguales) {
    console.log("  palabras visibles: inicio=" + W1.length + " #cuerpo=" + W2.length);
    console.log(primeras(W1, W2, 10));
  }
  process.exitCode = 1;
}

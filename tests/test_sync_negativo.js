// Las rutas de este script son relativas a la raíz del repositorio.
process.chdir(require("path").join(__dirname, ".."));

const fs = require("fs");
const ini = fs.readFileSync("inicio.html", "utf8");
const idxRaw = fs.readFileSync("index.html", "utf8");
const contenido = (i) => {
  const m = i.indexOf('id="cuerpo"');
  const s = i.indexOf(">", m) + 1;
  return i.slice(s, i.indexOf("<footer")).replace(/<\/(?:div|main)>\s*$/, "");
};
const tags = (s) =>
  (s.match(/<[^<>]*>/g) || [])
    .map((t) => t.replace(/\s+/g, " ").replace(/\s+>$/, ">"))
    .filter((t) => !/^<!--/.test(t));
const palabras = (s) =>
  s
    .replace(/<[^<>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

function compara(a, b) {
  return (
    JSON.stringify(tags(a)) === JSON.stringify(tags(b)) &&
    JSON.stringify(palabras(a)) === JSON.stringify(palabras(b))
  );
}

const idx = contenido(idxRaw);
const casos = [
  ["identicas (debe pasar)", ini, idx],
  [
    "una palabra cambiada (debe fallar)",
    ini.replace("Explora el sitio", "Explora los sitios"),
    idx,
  ],
  ["una etiqueta quitada (debe fallar)", ini.replace("<h3>Teoría</h3>", "Teoría"), idx],
  [
    "una clase cambiada (debe fallar)",
    ini.replace('class="hero-breadcrumb mb-0"', 'class="hero-breadcrumb"'),
    idx,
  ],
  ["anadir un parrafo (debe fallar)", ini + "<p>extra</p>", idx],
];
let ok = 0;
for (const [nombre, a, b] of casos) {
  const r = compara(a, b);
  const esperado = nombre.includes("debe pasar");
  const bien = r === esperado;
  if (bien) ok++;
  console.log((bien ? "OK   " : "MAL  ") + nombre + " -> " + (r ? "sincronizado" : "divergen"));
}
console.log("\n" + ok + "/" + casos.length + " casos correctos");
process.exit(ok === casos.length ? 0 : 1);

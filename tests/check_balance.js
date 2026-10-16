// Las rutas de este script son relativas a la raíz del repositorio.
process.chdir(require("path").join(__dirname, ".."));

const fs = require("fs");
const h = fs.readFileSync(process.argv[2], "utf8");
const tags = [
  "div",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "ul",
  "li",
  "h1",
  "h2",
  "p",
  "span",
  "a",
  "code",
  "b",
  "i",
  "button",
];
let ok = true;
for (const t of tags) {
  // Tolerante al formateo: Prettier puede partir la etiqueta de cierre (</span\n>).
  const open = (h.match(new RegExp("<" + t + "(\\s|>)", "g")) || []).length;
  const close = (h.match(new RegExp("</" + t + "\\s*>", "g")) || []).length;
  if (open !== close) {
    ok = false;
    console.log("DESBALANCE " + t + ": " + open + " abiertas / " + close + " cerradas");
  }
}
// Con un tercer argumento "balance" se omite la comprobación de markup puro:
// index.html sí lleva doctype/head/link, así que solo se mira el balance.
const soloBalance = process.argv[3] === "balance";
const impuro = h.match(/<script|<\/script|<link|<!DOCTYPE|<head|<body/i);
if (impuro && !soloBalance) {
  ok = false;
  console.log("Markup no puro:", impuro);
}
const resultado = soloBalance ? "HTML balanceado" : "HTML balanceado y markup puro";
console.log(ok ? process.argv[2] + ": " + resultado : process.argv[2] + ": PROBLEMAS");

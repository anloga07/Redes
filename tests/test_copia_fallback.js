// Las rutas de este script son relativas a la raíz del repositorio.
process.chdir(require("path").join(__dirname, ".."));

// Comprueba la ruta de respaldo de copiado (contexto NO seguro: http en LAN)
const fs = require("fs");

let areaCreada = null;
let portapapeles = null;

global.window = global;
global.isSecureContext = false;
Object.defineProperty(global, "navigator", { configurable: true, value: {} });

global.document = {
  createElement() {
    areaCreada = { style: {}, value: "", setAttribute() {}, select() {} };
    return areaCreada;
  },
  body: { appendChild() {}, removeChild() {} },
  execCommand(comando) {
    if (comando === "copy") portapapeles = areaCreada.value;
    return true;
  },
};

(0, eval)(fs.readFileSync("scripts/scriptpass.js", "utf8"));

copiarAlPortapapeles("Clave<con>simbolos&%")
  .then(() => {
    console.log(
      portapapeles === "Clave<con>simbolos&%"
        ? "OK   fallback execCommand copia el texto exacto"
        : "FALLA fallback -> " + JSON.stringify(portapapeles),
    );
    process.exit(portapapeles === "Clave<con>simbolos&%" ? 0 : 1);
  })
  .catch((err) => {
    console.log("FALLA fallback lanzó: " + err.message);
    process.exit(1);
  });

const fs = require("fs");

// --- Stub mínimo de DOM ---
const elementos = {};
function crearElemento() {
  const e = { checked: false, value: "", _partes: [] };
  Object.defineProperty(e, "innerHTML", {
    get() {
      return e._partes.join("");
    },
    set(v) {
      e._partes = v ? [String(v)] : [];
    },
  });
  Object.defineProperty(e, "textContent", {
    get() {
      return e._partes.join("");
    },
    set(v) {
      e._partes = v ? [String(v)] : [];
    },
  });
  e.append = (...nodos) => {
    for (const n of nodos) {
      if (typeof n === "string") e._partes.push(n);
      else if (n && n._html !== undefined) e._partes.push(n._html);
      else if (n && n.textContent !== undefined) e._partes.push(n.textContent);
    }
  };
  e.replaceChildren = (...nodos) => {
    e._partes = [];
    e.append(...nodos);
  };
  e.addEventListener = () => undefined;
  e.removeEventListener = () => undefined;
  e.querySelector = () => null;
  e.setAttribute = () => undefined;
  e.removeAttribute = () => undefined;
  e.getAttribute = () => null;
  e.classList = {
    add: () => undefined,
    remove: () => undefined,
    toggle: () => undefined,
    contains: () => false,
  };
  return e;
}
global.document = {
  getElementById(id) {
    if (!elementos[id]) elementos[id] = crearElemento();
    return elementos[id];
  },
  createElement() {
    return crearElemento();
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
const alertas = [];
global.alert = (msg) => alertas.push(msg);

// El tema claro/oscuro (redes.js) consulta localStorage y documentElement al cargar.
global.document.documentElement = {
  setAttribute: () => undefined,
  getAttribute: () => "dark",
};
global.localStorage = { getItem: () => null, setItem: () => undefined };

function reset() {
  for (const k of Object.keys(elementos)) elementos[k].replaceChildren();
  alertas.length = 0;
}

// Por defecto se prueba el redes.js del repositorio; se puede pasar otra ruta.
const rutaRedes = process.argv[2] || require("path").join(__dirname, "..", "scripts", "redes.js");
eval(fs.readFileSync(rutaRedes, "utf8"));

let fallos = 0;
function comprobar(nombre, condicion, detalle) {
  if (condicion) {
    console.log("OK   " + nombre);
  } else {
    fallos++;
    console.log("FALLA " + nombre + (detalle ? " -> " + detalle : ""));
  }
}

// 1. verClase válida
reset();
let r = verClase("192.168.1.1");
comprobar("verClase clase C", r && r.clase === "C" && r.i === 3, JSON.stringify(r));

// 2. verClase inválida
reset();
r = verClase("999.1.1.1");
comprobar("verClase IP inválida devuelve null", r === null);
r = verClase("abc");
comprobar("verClase texto devuelve null", r === null);
r = verClase("");
comprobar("verClase vacía devuelve null", r === null);
r = verClase("1.2.3");
comprobar("verClase 3 octetos devuelve null", r === null);

// 3. calculaConMascara clase C /26
reset();
calculaConMascara("192.168.5.130", "255.255.255.192");
let dir = elementos["direcciones"].innerHTML;
comprobar("/26 lista 4 subredes", (dir.match(/Direcciones de subred/g) || []).length === 4);
comprobar("/26 primera subred 192.168.5.0", dir.includes("192.168.5.0"));
comprobar("/26 última subred 192.168.5.192", dir.includes("192.168.5.192"));
comprobar("/26 broadcast 192.168.5.255", dir.includes("192.168.5.255"));
comprobar("/26 hosts 62 útiles", elementos["result"].innerHTML.includes("útiles <b>62</b>"));

// 4. calculaConMascara clase A /16 (bug antiguo: se desbordaba de la red principal)
reset();
calculaConMascara("10.1.2.3", "255.255.0.0");
dir = elementos["direcciones"].innerHTML;
comprobar("/16 clase A empieza en 10.0.0.0", dir.includes("10.0.0.0"));
comprobar("/16 clase A no desborda a 11.x", !dir.includes("subred <b>11."));
comprobar("/16 lista 256 subredes", dir.includes("Número de subredes <b>256</b>"));
comprobar(
  "/16 rangos completos",
  dir.includes("10.0.0.1 - 10.0.255.254") &&
    dir.includes("10.0.0.255") === false &&
    dir.includes("10.0.255.255"),
);

// 5. máscara no contigua
reset();
calculaConMascara("192.168.1.1", "255.0.255.0");
comprobar(
  "máscara no contigua rechazada",
  elementos["result"].innerHTML.includes("bits a 1 deben ser consecutivos"),
);

// 6. máscara por debajo de la de clase
reset();
calculaConMascara("192.168.1.1", "255.255.0.0");
comprobar(
  "máscara menor que la de clase rechazada",
  elementos["result"].innerHTML.includes("igual o mayor"),
);

// 7. IP inválida en calculaConMascara (bug antiguo: TypeError)
reset();
calculaConMascara("no-es-ip", "255.255.255.0");
comprobar(
  "IP inválida no lanza excepción",
  elementos["result"].innerHTML.includes("Por favor, ingrese"),
);

// 8. calculaConRedes
reset();
calculaConRedes("192.168.1.10", "6");
comprobar("6 redes -> 8 subredes", elementos["result"].innerHTML.includes("<b>8</b> subredes"));
comprobar(
  "6 redes -> máscara 255.255.255.224",
  elementos["result"].innerHTML.includes("255.255.255.224"),
);
comprobar("6 redes sin alert", alertas.length === 0, alertas.join(" | "));

// 9. calculaConRedes no potencia de 2
reset();
calculaConRedes("192.168.1.10", "5");
comprobar("5 redes -> redondea a 8", elementos["result"].innerHTML.includes("<b>8</b> subredes"));

// 10. calculaConRedes imposible para clase C
reset();
calculaConRedes("192.168.1.10", "128");
comprobar(
  "128 redes clase C rechazado",
  alertas.some((a) => a.includes("No es posible")),
  alertas.join(" | "),
);

// 11. calculaConRedes entrada no numérica
reset();
calculaConRedes("192.168.1.10", "abc");
comprobar(
  "redes no numéricas rechazadas",
  elementos["result"].innerHTML.includes("número de redes válido"),
);

// 12. calculaConHosts 254 hosts -> /24
reset();
calculaConHosts("192.168.1.10", "254");
comprobar("254 hosts -> 255.255.255.0", elementos["result"].innerHTML.includes("255.255.255.0"));

// 13. calculaConHosts 256 hosts en clase C (imposible en sistema classful)
reset();
calculaConHosts("192.168.1.10", "256");
comprobar(
  "256 hosts clase C rechazado",
  alertas.some((a) => a.includes("No es posible")),
  alertas.join(" | "),
);

// 13b. calculaConHosts 2000 hosts en clase A -> /21
reset();
calculaConHosts("10.1.2.3", "2000");
comprobar(
  "2000 hosts clase A -> 255.255.248.0",
  elementos["result"].innerHTML.includes("255.255.248.0"),
);
comprobar(
  "2000 hosts -> 2046 útiles",
  elementos["result"].innerHTML.includes("útiles <b>2046</b>"),
  elementos["result"].innerHTML,
);

// 14. calculaConHosts 1 host -> /30
reset();
calculaConHosts("192.168.1.10", "1");
comprobar("1 host -> 255.255.255.252", elementos["result"].innerHTML.includes("255.255.255.252"));

// 15. calculaConHosts imposible para clase C
reset();
calculaConHosts("192.168.1.10", "1000");
comprobar(
  "1000 hosts clase C rechazado",
  alertas.some((a) => a.includes("No es posible")),
  alertas.join(" | "),
);

// 16. Modo tutor
reset();
elementos["modoTutor"].checked = true;
calculaConMascara("192.168.5.130", "255.255.255.192");
const tutor = elementos["result"].innerHTML;
comprobar("tutor se genera", tutor.includes("Desglose paso a paso"));
comprobar("tutor binario", tutor.includes("Conversión a binario") && tutor.includes("AND lógica"));
comprobar("tutor número mágico", tutor.includes("256 - 192 = 64"));
comprobar(
  "tutor lista subredes válidas",
  tutor.includes("192.168.5.64") && !tutor.includes("192.168.5.256"),
);

// 17. Modo tutor en clase A /16
reset();
elementos["modoTutor"].checked = true;
calculaConMascara("10.1.2.3", "255.255.0.0");
const tutor2 = elementos["result"].innerHTML;
comprobar("tutor /16 sin direcciones inválidas", !/\d+\.\d+\.\d+\.256\b/.test(tutor2));
comprobar("tutor /16 lista 256 subredes", tutor2.includes("hay <b>256</b> subredes"));
elementos["modoTutor"].checked = false;

// 18. actualización de máscara desde el select
reset();
comprobar("prefijo /26 -> 255.255.255.192", prefijoAMascara(26).join(".") === "255.255.255.192");
comprobar("prefijo /8 -> 255.0.0.0", prefijoAMascara(8).join(".") === "255.0.0.0");
comprobar("prefijo /0 -> 0.0.0.0", prefijoAMascara(0).join(".") === "0.0.0.0");
comprobar("prefijo /32 -> 255.255.255.255", prefijoAMascara(32).join(".") === "255.255.255.255");
comprobar("prefijo /12 -> 255.240.0.0", prefijoAMascara(12).join(".") === "255.240.0.0");

// 19. cálculo inverso: int <-> IP
comprobar("intAIP(3232235776) = 192.168.1.0", intAIP(3232235776) === "192.168.1.0");
comprobar("ipAInt([10,0,0,1])", ipAInt([10, 0, 0, 1]) === 167772161);

// 20. clase D/E rechazadas en cálculos
reset();
calculaConMascara("224.0.0.1", "255.255.255.0");
comprobar(
  "clase D rechazada",
  alertas.some((a) => a.includes("clase A, B y C")),
  alertas.join(" | "),
);

console.log(fallos === 0 ? "\nTODAS LAS PRUEBAS PASAN" : `\n${fallos} FALLOS`);
process.exit(fallos === 0 ? 0 : 1);

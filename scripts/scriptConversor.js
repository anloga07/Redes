// Conversor de bases (decimal, binario, octal y hexadecimal) pensado para los
// octetos de una dirección IP. Todo vive dentro de una IIFE: el fragmento se
// inyecta después de cargar este archivo y solo se publica iniciarConversor(),
// que es lo que busca inicializarFragmento() en window.

(function () {
  const TEXTO_INICIAL = "Escribe un número y pulsa «Convertir».";
  const MAXIMO_32_BITS = 4294967295;
  const LIMITE_TEXTO = "4 294 967 295";

  const SISTEMAS = {
    2: {
      nombre: "Binario",
      patron: /^[01]+$/,
      ejemplo: "11000000",
      ayuda: "Acepta solo 0 y 1.",
    },
    8: {
      nombre: "Octal",
      patron: /^[0-7]+$/,
      ejemplo: "300",
      ayuda: "Acepta dígitos del 0 al 7.",
    },
    10: {
      nombre: "Decimal",
      patron: /^\d+$/,
      ejemplo: "192",
      ayuda: "Acepta dígitos del 0 al 9.",
    },
    16: {
      nombre: "Hexadecimal",
      patron: /^[0-9a-f]+$/i,
      ejemplo: "C0",
      ayuda: "Acepta dígitos del 0 al 9 y letras de la A a la F.",
    },
  };

  // Orden en el que se muestran las equivalencias.
  const BASES_RESULTADO = [10, 2, 8, 16];

  // Punto de entrada: lo llama inicializarFragmento() después de inyectar el HTML.
  function iniciarConversor() {
    const selector = document.getElementById("base-origen");
    const campo = document.getElementById("numero-convertir");
    const boton = document.getElementById("btn-convertir");
    if (!selector || !campo || !boton) return;

    const convertir = () => convertirNumero(campo, selector.value);
    boton.addEventListener("click", convertir);
    campo.addEventListener("keydown", (evento) => {
      if (evento.key !== "Enter") return;
      evento.preventDefault();
      convertir();
    });
    selector.addEventListener("change", () => prepararBase(selector, campo));
    prepararBase(selector, campo);
  }

  // Deja el formulario listo para el sistema elegido: campo vacío, ayuda y aviso inicial.
  function prepararBase(selector, campo) {
    const base = Number(selector.value);
    const sistema = SISTEMAS[base];
    if (!sistema) return;
    campo.value = "";
    campo.placeholder = sistema.ejemplo;
    campo.setAttribute("inputmode", base === 16 ? "text" : "numeric");
    const ayuda = document.getElementById("ayuda-conversor");
    if (ayuda) ayuda.textContent = sistema.ayuda;
    mostrarMensaje(campo, TEXTO_INICIAL, false);
  }

  // Valida el texto escrito y, si es correcto, pinta las cuatro equivalencias.
  function convertirNumero(campo, baseTexto) {
    const base = Number(baseTexto);
    const sistema = SISTEMAS[base];
    if (!sistema) return;

    // Los espacios se ignoran: el binario se imprime agrupado en octetos y debe
    // poder pegarse de vuelta sin que lo rechace la validación.
    const valor = campo.value.replace(/\s+/g, "");
    if (valor === "") {
      mostrarMensaje(campo, "Escribe un número antes de convertir.", true);
      return;
    }
    if (!sistema.patron.test(valor)) {
      mostrarMensaje(
        campo,
        "«" +
          valor +
          "» no es un número " +
          sistema.nombre.toLowerCase() +
          " válido. " +
          sistema.ayuda,
        true,
      );
      return;
    }
    const numero = parseInt(valor, base);
    if (numero > MAXIMO_32_BITS) {
      mostrarMensaje(
        campo,
        "El número se pasa de 32 bits: el máximo es " + LIMITE_TEXTO + ".",
        true,
      );
      return;
    }
    mostrarConversiones(campo, numero);
  }

  function mostrarConversiones(campo, numero) {
    const contenedor = document.getElementById("resultado-conversor");
    if (!contenedor) return;
    const filas = BASES_RESULTADO.map((base) =>
      crearFila(SISTEMAS[base].nombre, formatearEnBase(numero, base)),
    );
    contenedor.replaceChildren(...filas);
    campo.removeAttribute("aria-invalid");
  }

  // El binario se agrupa en octetos; el resto de bases se muestran en mayúsculas.
  function formatearEnBase(numero, base) {
    const texto = numero.toString(base).toUpperCase();
    return base === 2 ? agruparEnOctetos(texto) : texto;
  }

  function agruparEnOctetos(binario) {
    const longitud = Math.ceil(binario.length / 8) * 8;
    return binario.padStart(longitud, "0").match(/.{8}/g).join(" ");
  }

  function crearFila(nombre, valor) {
    const fila = document.createElement("div");
    fila.className = "conversor-fila";
    const etiqueta = document.createElement("span");
    etiqueta.className = "conversor-etiqueta";
    etiqueta.textContent = nombre;
    const contenido = document.createElement("span");
    contenido.className = "conversor-valor";
    contenido.textContent = valor;
    fila.append(etiqueta, contenido);
    return fila;
  }

  // Pinta un aviso en la caja de resultados y refleja el error en el campo.
  function mostrarMensaje(campo, texto, esError) {
    const contenedor = document.getElementById("resultado-conversor");
    if (!contenedor) return;
    const aviso = document.createElement("p");
    aviso.className = esError
      ? "conversor-aviso conversor-aviso-error mb-0"
      : "conversor-aviso mb-0";
    aviso.textContent = texto;
    contenedor.replaceChildren(aviso);
    if (esError) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
  }

  window.iniciarConversor = iniciarConversor;
})();

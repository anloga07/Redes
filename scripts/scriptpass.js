/* ALUMNO A */

// Las contraseñas guardadas se recuerdan en el navegador (localStorage).
// AVISO: se guardan en texto plano en este navegador; son para ejercicios
// de clase, no para cuentas reales.
const CLAVE_CONTRASENAS = "contrasenas";

// Lee la lista guardada. Devuelve [] si no hay nada o si los datos están rotos.
function leerPass() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_CONTRASENAS) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudieron leer las contraseñas guardadas:", error);
    return [];
  }
}

// Guarda la lista completa en el navegador
function escribirPass(lista) {
  try {
    localStorage.setItem(CLAVE_CONTRASENAS, JSON.stringify(lista));
  } catch (error) {
    alert("No se han podido guardar las contraseñas en este navegador");
    console.error(error);
  }
}

// Engancha los botones del fragmento pass.html y pinta la tabla guardada.
// Se llama desde cargarFragmento() tras inyectar el HTML (los <script>
// de un fragmento inyectado no se ejecutan).
// Se usa onclick = para poder llamarla varias veces sin duplicar listeners.
function iniciarPass() {
  const generateBtn = document.getElementById("generateBtn");
  const saveBtn = document.getElementById("saveBtn");
  if (!generateBtn || !saveBtn) return;
  generateBtn.onclick = generatePassword;
  saveBtn.onclick = savePassword;
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.onclick = copiarPassword;
    copyBtn.hidden = true; // se muestra al generar una contraseña
  }
  updateTable(); // recupera las contraseñas guardadas al abrir la herramienta
}

function generatePassword() {
  const length = document.getElementById("length").value;
  const includeLetters = document.getElementById("includeLetters").checked;
  const includeNumbers = document.getElementById("includeNumbers").checked;
  const includeSymbols = document.getElementById("includeSymbols").checked;

  let chars = "";
  if (includeLetters) chars += "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) chars += "0123456789";
  if (includeSymbols) chars += "!@#$%^&*()-_=+[]{};:,.<>?/";

  if (!chars) {
    alert("Debes seleccionar al menos una opción");
    return;
  }

  // No repetir contraseñas ya guardadas
  const guardadas = leerPass();
  let password;
  do {
    password = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join(
      "",
    );
  } while (guardadas.some((entrada) => entrada.password === password));

  document.getElementById("passwordResult").innerText = password;
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.hidden = false; // ya hay contraseña que copiar
  return password;
}

// Copia texto al portapapeles y devuelve una promesa.
// La Clipboard API solo funciona en contexto seguro (https o localhost);
// el sitio se sirve a menudo por http en la red del aula, así que si no
// hay contexto seguro se usa el método antiguo con execCommand.
function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }
  return new Promise((resolver, rechazar) => {
    try {
      const area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      ok ? resolver() : rechazar(new Error("No se pudo copiar"));
    } catch (error) {
      rechazar(error);
    }
  });
}

// Muestra "Copiado" en el botón durante ~1,5 s y lo restaura.
// Se cambia solo el nodo de texto (junto al icono) para no borrar el <i>.
function feedbackCopiado(boton) {
  const icono = boton.querySelector("i");
  const nodoTexto = boton.lastChild;
  const conTexto = nodoTexto && nodoTexto.nodeType === 3;
  const textoOriginal = conTexto ? nodoTexto.nodeValue : boton.textContent;
  const iconoOriginal = icono ? icono.className : "";
  if (icono) icono.className = "bi bi-check2";
  if (conTexto) nodoTexto.nodeValue = " Copiado";
  else boton.textContent = "✓ Copiado";
  setTimeout(() => {
    if (icono) icono.className = iconoOriginal;
    if (conTexto) nodoTexto.nodeValue = textoOriginal;
    else boton.textContent = textoOriginal;
  }, 1500);
}

// Botón "Copiar" junto a la contraseña recién generada
function copiarPassword() {
  const div = document.getElementById("passwordResult");
  const boton = document.getElementById("copyBtn");
  if (!div || !boton) return;
  const password = div.innerText;
  if (!password || password === "Aquí aparecerá tu contraseña") return;
  copiarAlPortapapeles(password)
    .then(() => feedbackCopiado(boton))
    .catch(() => alert("No se ha podido copiar al portapapeles"));
}

// Botón "Copiar" de una fila de la tabla de contraseñas guardadas
function copiarPasswordFila(indice, boton) {
  const guardadas = leerPass();
  if (indice < 0 || indice >= guardadas.length) return;
  copiarAlPortapapeles(guardadas[indice].password)
    .then(() => feedbackCopiado(boton))
    .catch(() => alert("No se ha podido copiar al portapapeles"));
}

function savePassword() {
  const login = document.getElementById("login").value.trim();
  const password = document.getElementById("passwordResult").innerText;

  if (!login) {
    alert("Debes ingresar un login");
    return;
  }
  if (password === "Aquí aparecerá tu contraseña") {
    alert("Primero genera una contraseña");
    return;
  }

  const guardadas = leerPass();
  if (guardadas.some((entrada) => entrada.password === password)) {
    alert("Esta contraseña ya está guardada. Genera otra.");
    return;
  }

  guardadas.push({ login, password });
  escribirPass(guardadas);
  updateTable();
  document.getElementById("login").value = "";
}

// Elimina una fila de la tabla y actualiza el almacenamiento
function eliminarPassword(indice) {
  const guardadas = leerPass();
  if (indice < 0 || indice >= guardadas.length) return;
  guardadas.splice(indice, 1);
  escribirPass(guardadas);
  updateTable();
}

// Pinta la tabla con lo guardado en el navegador.
// Se usa createElement/textContent (no innerHTML) porque las contraseñas
// pueden contener símbolos como < o > que romperían el HTML.
function updateTable() {
  const tabla = document.getElementById("savedTable");
  if (!tabla) return;
  const tbody = tabla.querySelector("tbody");
  tbody.replaceChildren();

  leerPass().forEach((entrada, indice) => {
    const fila = document.createElement("tr");

    const celdaLogin = document.createElement("td");
    celdaLogin.textContent = entrada.login;

    const celdaPassword = document.createElement("td");
    celdaPassword.textContent = entrada.password;

    const celdaAcciones = document.createElement("td");
    const acciones = document.createElement("div");
    acciones.className = "acciones";

    const botonCopiar = document.createElement("button");
    botonCopiar.className = "copiar";
    botonCopiar.type = "button";
    botonCopiar.setAttribute("aria-label", "Copiar la contraseña de " + entrada.login);
    botonCopiar.onclick = () => copiarPasswordFila(indice, botonCopiar);
    const iconoCopiar = document.createElement("i");
    iconoCopiar.className = "bi bi-clipboard";
    iconoCopiar.setAttribute("aria-hidden", "true");
    botonCopiar.appendChild(iconoCopiar);
    botonCopiar.appendChild(document.createTextNode(" Copiar"));
    acciones.appendChild(botonCopiar);

    const botonEliminar = document.createElement("button");
    botonEliminar.textContent = "Eliminar";
    botonEliminar.className = "eliminar";
    botonEliminar.onclick = () => eliminarPassword(indice);
    acciones.appendChild(botonEliminar);

    celdaAcciones.appendChild(acciones);

    fila.appendChild(celdaLogin);
    fila.appendChild(celdaPassword);
    fila.appendChild(celdaAcciones);
    tbody.appendChild(fila);
  });
}

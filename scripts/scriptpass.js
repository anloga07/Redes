/* ALUMNO A */

// Las contraseñas guardadas se recuerdan en el navegador (localStorage).
// AVISO: se guardan en texto plano en este navegador; son para ejercicios
// de clase, no para cuentas reales.
const CLAVE_CONTRASENAS = 'contrasenas';

// Lee la lista guardada. Devuelve [] si no hay nada o si los datos están rotos.
function leerPass() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_CONTRASENAS) || '[]');
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error('No se pudieron leer las contraseñas guardadas:', error);
    return [];
  }
}

// Guarda la lista completa en el navegador
function escribirPass(lista) {
  try {
    localStorage.setItem(CLAVE_CONTRASENAS, JSON.stringify(lista));
  } catch (error) {
    alert('No se han podido guardar las contraseñas en este navegador');
    console.error(error);
  }
}

// Engancha los botones del fragmento pass.html y pinta la tabla guardada.
// Se llama desde cargarFragmento() tras inyectar el HTML (los <script>
// de un fragmento inyectado con innerHTML no se ejecutan).
// Se usa onclick = para poder llamarla varias veces sin duplicar listeners.
function iniciarPass() {
  const generateBtn = document.getElementById("generateBtn");
  const saveBtn = document.getElementById("saveBtn");
  if (!generateBtn || !saveBtn) return;
  generateBtn.onclick = generatePassword;
  saveBtn.onclick = savePassword;
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
    password = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (guardadas.some(entrada => entrada.password === password));

  document.getElementById("passwordResult").innerText = password;
  return password;
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
  if (guardadas.some(entrada => entrada.password === password)) {
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
  tbody.innerHTML = "";

  leerPass().forEach((entrada, indice) => {
    const fila = document.createElement("tr");

    const celdaLogin = document.createElement("td");
    celdaLogin.textContent = entrada.login;

    const celdaPassword = document.createElement("td");
    celdaPassword.textContent = entrada.password;

    const celdaAcciones = document.createElement("td");
    const botonEliminar = document.createElement("button");
    botonEliminar.textContent = "Eliminar";
    botonEliminar.className = "eliminar";
    botonEliminar.onclick = () => eliminarPassword(indice);
    celdaAcciones.appendChild(botonEliminar);

    fila.appendChild(celdaLogin);
    fila.appendChild(celdaPassword);
    fila.appendChild(celdaAcciones);
    tbody.appendChild(fila);
  });
}

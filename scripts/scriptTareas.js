// Las tareas se guardan en el navegador (localStorage) para que no se
// pierdan al recargar o al cambiar de herramienta.
const CLAVE_TAREAS = "tareas";

// Fuente de verdad: [{ id, texto, completada }, ...]
let listaTareas = [];

// Selección de elementos (se rellena al cargar el fragmento tareas.html)
let addTaskButton = null;
let taskInput = null;
let taskList = null;

// Lee las tareas guardadas. Devuelve [] si no hay nada o si los datos están rotos.
function leerTareas() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_TAREAS) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudieron leer las tareas guardadas:", error);
    return [];
  }
}

// Guarda la lista completa en el navegador
function guardarTareas() {
  try {
    localStorage.setItem(CLAVE_TAREAS, JSON.stringify(listaTareas));
  } catch (error) {
    alert("No se han podido guardar las tareas en este navegador");
    console.error(error);
  }
}

// Engancha los botones del fragmento tareas.html y pinta las tareas guardadas.
// Se llama desde cargarFragmento() tras inyectar el HTML (los <script>
// de un fragmento inyectado con innerHTML no se ejecutan).
// Se usa onclick = para poder llamarla varias veces sin duplicar listeners.
function iniciarTareas() {
  addTaskButton = document.getElementById("addTaskButton");
  taskInput = document.getElementById("taskInput");
  taskList = document.getElementById("taskList");
  if (!addTaskButton || !taskInput || !taskList) return;

  // Botón: agregar una tarea
  addTaskButton.onclick = addTask;

  // Enter: agregar una tarea
  taskInput.onkeypress = function (event) {
    if (event.key === "Enter") {
      addTask();
    }
  };

  cargarTareas(); // recupera las tareas guardadas al abrir la herramienta
}

// Carga las tareas del navegador y las pinta
function cargarTareas() {
  listaTareas = leerTareas();
  pintarTareas();
}

// Vuelve a pintar la lista completa desde el array
function pintarTareas() {
  taskList.innerHTML = "";
  listaTareas.forEach((tarea) => taskList.appendChild(crearTareaDOM(tarea)));
}

// Función para agregar una nueva tarea
function addTask() {
  const taskText = taskInput.value.trim();

  if (taskText === "") {
    alert("Por favor, ingresa una tarea.");
    return;
  }

  listaTareas.push({ id: Date.now(), texto: taskText, completada: false });
  guardarTareas();
  pintarTareas();

  // Limpiar el campo de entrada
  taskInput.value = "";
}

// Crea el DOM de una tarea a partir de su objeto
function crearTareaDOM(tarea) {
  // Crear el contenedor de la tarea
  const taskItem = document.createElement("div");
  taskItem.classList.add("taskItem");
  if (tarea.completada) taskItem.classList.add("completed");

  // Crear el texto de la tarea
  const taskTextNode = document.createTextNode(tarea.texto);
  const taskContent = document.createElement("span");
  taskContent.appendChild(taskTextNode);

  // Crear el botón de completar
  const toggleButton = document.createElement("button");
  toggleButton.textContent = tarea.completada ? "Marcar como Pendiente" : "Marcar como Completada";
  toggleButton.classList.add("toggleButton");
  toggleButton.addEventListener("click", function () {
    tarea.completada = !tarea.completada;
    taskItem.classList.toggle("completed", tarea.completada);
    toggleButton.textContent = tarea.completada
      ? "Marcar como Pendiente"
      : "Marcar como Completada";
    guardarTareas();
  });

  // Crear el botón de editar
  const editButton = document.createElement("button");
  editButton.textContent = "Editar";
  editButton.classList.add("editButton");
  editButton.addEventListener("click", function () {
    const newText = prompt("Edita tu tarea:", taskTextNode.textContent);
    if (newText !== null && newText.trim() !== "") {
      tarea.texto = newText.trim();
      taskTextNode.textContent = tarea.texto;
      guardarTareas();
    }
  });

  // Crear el botón de eliminar
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Eliminar";
  deleteButton.classList.add("deleteButton");
  deleteButton.addEventListener("click", function () {
    listaTareas = listaTareas.filter((t) => t.id !== tarea.id);
    guardarTareas();
    pintarTareas();
  });

  // Agregar los elementos al contenedor de la tarea
  taskItem.appendChild(taskContent);
  taskItem.appendChild(toggleButton);
  taskItem.appendChild(editButton);
  taskItem.appendChild(deleteButton);

  return taskItem;
}

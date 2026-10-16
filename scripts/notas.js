// Las notas se cargan desde cargarFragmento() → inicializarFragmento()
// justo después de inyectar notas.html (el evento DOMContentLoaded ya se
// habría disparado, así que no sirve engancharse a él).
// cargarNotas debe seguir siendo global porque inicializarFragmento la busca en
// window; los botones se enganchan aquí y en cada repintado con onclick =.

const CLAVE_NOTAS = "notas";

// Estado de la vista
let notasVisibles = false; // la lista empieza oculta
let notaEditando = null; // id de la nota en edición (o null)

// Lee las notas guardadas. Devuelve [] si no hay nada o los datos están rotos.
function leerNotas() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_NOTAS) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudieron leer las notas guardadas:", error);
    return [];
  }
}

// Guarda la lista completa en el navegador
function escribirNotas(lista) {
  try {
    localStorage.setItem(CLAVE_NOTAS, JSON.stringify(lista));
  } catch (error) {
    alert("No se han podido guardar las notas en este navegador");
    console.error(error);
  }
}

// Inicializador (registrado en redes.js): engancha el botón de guardar, la
// lista empieza oculta y sin ninguna nota en edición.
function cargarNotas() {
  notasVisibles = false;
  notaEditando = null;

  const botonGuardar = document.getElementById("btn-guardar");
  if (botonGuardar) botonGuardar.onclick = guardarNota;

  renderNotas();
}

// Rellena un botón con un icono de Bootstrap Icons y su texto. Se construye con
// createElement/textContent (nunca con innerHTML) para no interpretar HTML.
function ponerIcono(boton, claseIcono, texto) {
  const icono = document.createElement("i");
  icono.className = claseIcono + " me-1";
  icono.setAttribute("aria-hidden", "true");
  boton.replaceChildren(icono, texto);
}

// Etiqueta accesible para un campo de formulario. Se oculta a la vista (la clase
// visually-hidden de Bootstrap la expone a los lectores de pantalla) y se asocia
// al control con el atributo for.
function etiquetaCampo(texto, id) {
  const etiqueta = document.createElement("label");
  etiqueta.className = "visually-hidden";
  etiqueta.htmlFor = id;
  etiqueta.textContent = texto;
  return etiqueta;
}

// Vuelve a pintar la lista completa desde el almacenamiento
function renderNotas() {
  const contenedor = document.getElementById("lista-notas");
  if (!contenedor) return;

  contenedor.replaceChildren();
  leerNotas().forEach((nota) => contenedor.appendChild(crearNotaDOM(nota)));

  contenedor.classList.toggle("d-none", !notasVisibles);

  const boton = document.getElementById("btn-cargar");
  if (boton) {
    boton.onclick = alternarNotas;
    boton.setAttribute("aria-expanded", String(notasVisibles));
    ponerIcono(
      boton,
      notasVisibles ? "bi bi-eye-slash" : "bi bi-eye",
      notasVisibles ? "Ocultar notas" : "Ver notas",
    );
  }
}

// Crea el DOM de una nota: en modo lectura o en modo edición
function crearNotaDOM(nota) {
  const articulo = document.createElement("div");
  articulo.className = "nota";

  if (nota.id === notaEditando) {
    articulo.classList.add("nota-editando");
    articulo.appendChild(crearFormularioEdicion(nota));
    return articulo;
  }

  const info = document.createElement("div");
  info.className = "nota-info";

  const titulo = document.createElement("h3");
  titulo.textContent = nota.titulo;

  const contenido = document.createElement("p");
  contenido.textContent = nota.contenido;

  const fechaCreacion = document.createElement("small");
  fechaCreacion.textContent = "Fecha creación: " + nota.fecha;

  const fechaRealizar = document.createElement("small");
  fechaRealizar.textContent = "A realizar el día: " + (nota.fechaR || "—");

  info.appendChild(titulo);
  info.appendChild(contenido);
  info.appendChild(fechaCreacion);
  info.appendChild(fechaRealizar);

  const acciones = document.createElement("div");
  acciones.className = "nota-acciones";

  const botonEditar = document.createElement("button");
  botonEditar.className = "editar";
  ponerIcono(botonEditar, "bi bi-pencil", "Editar");
  botonEditar.onclick = () => editarNota(nota.id);

  const botonEliminar = document.createElement("button");
  botonEliminar.className = "eliminar";
  ponerIcono(botonEliminar, "bi bi-trash", "Eliminar");
  botonEliminar.onclick = () => eliminarNota(nota.id);

  acciones.appendChild(botonEditar);
  acciones.appendChild(botonEliminar);

  articulo.appendChild(info);
  articulo.appendChild(acciones);
  return articulo;
}

// Campos de edición en línea de una nota
function crearFormularioEdicion(nota) {
  const form = document.createElement("div");
  form.className = "nota-edicion";

  const campoTitulo = document.createElement("input");
  campoTitulo.type = "text";
  campoTitulo.id = "edit-titulo";
  campoTitulo.className = "form-control mb-2";
  campoTitulo.value = nota.titulo;

  const campoContenido = document.createElement("textarea");
  campoContenido.id = "edit-contenido";
  campoContenido.className = "form-control mb-2";
  campoContenido.rows = 4;
  campoContenido.value = nota.contenido;

  const campoFecha = document.createElement("input");
  campoFecha.type = "datetime-local";
  campoFecha.id = "edit-fecha";
  campoFecha.className = "form-control mb-2";
  campoFecha.value = nota.fechaR || "";

  const acciones = document.createElement("div");
  acciones.className = "nota-acciones";

  const botonGuardar = document.createElement("button");
  botonGuardar.className = "guardar";
  ponerIcono(botonGuardar, "bi bi-check-lg", "Guardar");
  botonGuardar.onclick = () => guardarEdicionNota(nota.id);

  const botonCancelar = document.createElement("button");
  botonCancelar.className = "cancelar";
  ponerIcono(botonCancelar, "bi bi-x-lg", "Cancelar");
  botonCancelar.onclick = cancelarEdicion;

  acciones.appendChild(botonGuardar);
  acciones.appendChild(botonCancelar);

  form.appendChild(etiquetaCampo("Título", "edit-titulo"));
  form.appendChild(campoTitulo);
  form.appendChild(etiquetaCampo("Contenido", "edit-contenido"));
  form.appendChild(campoContenido);
  form.appendChild(etiquetaCampo("A realizar el día", "edit-fecha"));
  form.appendChild(campoFecha);
  form.appendChild(acciones);
  return form;
}

// Muestra u oculta la lista de notas
function alternarNotas() {
  notasVisibles = !notasVisibles;
  renderNotas();
}

// Pone una nota en modo edición
function editarNota(id) {
  notaEditando = id;
  notasVisibles = true;
  renderNotas();
}

// Cancela la edición sin tocar los datos
function cancelarEdicion() {
  notaEditando = null;
  renderNotas();
}

// Guarda los cambios de la nota en edición
function guardarEdicionNota(id) {
  const campoTitulo = document.getElementById("edit-titulo");
  const campoContenido = document.getElementById("edit-contenido");
  const campoFecha = document.getElementById("edit-fecha");
  if (!campoTitulo || !campoContenido || !campoFecha) return;

  const titulo = campoTitulo.value.trim();
  const contenido = campoContenido.value.trim();

  if (!titulo || !contenido) {
    alert("Por favor, completa el título y el contenido");
    return;
  }

  const notas = leerNotas();
  const nota = notas.find((n) => n.id === id);
  if (!nota) {
    notaEditando = null;
    renderNotas();
    return;
  }

  nota.titulo = titulo;
  nota.contenido = contenido;
  nota.fechaR = campoFecha.value;

  escribirNotas(notas);
  notaEditando = null;
  notasVisibles = true;
  renderNotas();
}

// Crea una nota nueva a partir del formulario superior
function guardarNota() {
  const titulo = document.getElementById("titulo").value;
  const contenido = document.getElementById("contenido").value;
  const fechaR = document.getElementById("fecha").value;

  if (!titulo.trim() || !contenido.trim()) {
    alert("Por favor, completa todos los campos");
    return;
  }

  const notas = leerNotas();
  notas.push({
    id: Date.now(),
    titulo: titulo.trim(),
    contenido: contenido.trim(),
    fechaR,
    fecha: new Date().toLocaleString(),
  });
  escribirNotas(notas);

  document.getElementById("titulo").value = "";
  document.getElementById("contenido").value = "";
  document.getElementById("fecha").value = "";

  // Mostramos la lista para ver la nota recién creada
  notaEditando = null;
  notasVisibles = true;
  renderNotas();
}

// Elimina una nota
function eliminarNota(id) {
  const notas = leerNotas().filter((nota) => nota.id !== id);
  escribirNotas(notas);
  if (notaEditando === id) notaEditando = null;
  renderNotas();
}

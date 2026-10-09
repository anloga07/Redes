// Las notas se cargan desde cargarFragmento() → inicializarFragmento()
// justo después de inyectar notas.html (el evento DOMContentLoaded ya se
// habría disparado, así que no sirve engancharse a él).
// guardarNota/cargarNotas/eliminarNota deben ser globales porque las
// llaman los onclick inline del fragmento notas.html.


        function guardarNota() {
            const titulo = document.getElementById('titulo').value;
            const contenido = document.getElementById('contenido').value;
            const fechaR = document.getElementById ('fecha').value;
            if (!titulo || !contenido) {
                alert('Por favor, completa todos los campos');
                return;
            }

            // Obtener notas existentes
            const notas = JSON.parse(localStorage.getItem('notas') || '[]');
            
            // Agregar nueva nota
            notas.push({
                id: Date.now(),
                titulo,
                contenido,
                fechaR,
                fecha: new Date().toLocaleString()
                
            });
            
            
            // Guardar en localStorage
            localStorage.setItem('notas', JSON.stringify(notas));
            
            // Limpiar formulario
            document.getElementById('titulo').value = '';
            document.getElementById('contenido').value = '';
            document.getElementById('fecha').value = '';
            
            // Actualizar lista
            cargarNotas();
        }

        function cargarNotas() {
            const notas = JSON.parse(localStorage.getItem('notas') || '[]');
            const contenedor = document.getElementById('lista-notas');
            
            contenedor.innerHTML = notas.map(nota => `
                <div class="nota">
                    <div>
                        <h3>${nota.titulo}</h3>
                        <p>${nota.contenido}</p>
                        <small>Fecha creación: ${nota.fecha}</small>
                        <small>A realizar el día:  ${nota.fechaR} </small>
                    </div>
                    <button class="eliminar" onclick="eliminarNota(${nota.id})">Eliminar</button>
                </div>
            `).join('');
    /*     cargar.attributes("display:none");
        ocultar.attributes("display:block"); */
        }
function ocultarNotas(){

}

        function eliminarNota(id) {
            const notas = JSON.parse(localStorage.getItem('notas') || '[]');
            const notasFiltradas = notas.filter(nota => nota.id !== id);
            localStorage.setItem('notas', JSON.stringify(notasFiltradas));
            cargarNotas();
        }
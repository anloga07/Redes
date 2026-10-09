# Redes IP

Sitio web educativo estático sobre redes IP con herramientas de cálculo interactivas y pequeñas herramientas de aula.

## Características

- **Detección de clase IP** — Identifica si una dirección IP pertenece a la clase A, B, C, D o E
- **Calculadora de Subneting** — Tres modos de cálculo:
  - Por máscara de subred
  - Por número de redes deseadas
  - Por número de hosts deseados
- **Modo Tutor** — Desglose paso a paso: conversión a binario, operación AND, número mágico y rango de subredes
- **Resultados detallados** — Muestra máscara en decimal y binario, número de subredes, hosts útiles, rangos de direcciones y broadcast
- **Validación en vivo** — El campo de IP se resalta en verde/rojo mientras se escribe
- **Herramientas de aula** — Generador de contraseñas, gestor de tareas, gestor de notas y agenda (en construcción)
- **Persistencia en el navegador** — Contraseñas, tareas y notas se guardan en `localStorage` y no se pierden al recargar o cambiar de herramienta
- **Tema visual unificado** — Estética oscura tipo centro de datos (NOC) con acento cian, construida sobre Bootstrap y responsive en todas las pantallas

## Tecnologías

- HTML5
- CSS3
- JavaScript (vanilla)
- Bootstrap 5.3.8
- Bootstrap Icons 1.11.3

## Cómo ejecutar

La navegación usa `fetch()`, así que **hay que servir la carpeta con un servidor local** (abrir `index.html` con doble clic no funciona). Ejecuta en la carpeta del proyecto (donde está el `index.html`):

```bash
python -m http.server 8000
```

Luego accede a `http://localhost:8000`

### Live Server (VS Code)

Si usas la extensión **Live Server**, iníciala siempre sobre **`index.html`** (botón derecho → *Open with Live Server*), nunca sobre un fragmento (`inicio.html`, `pass.html`...): los fragmentos no llevan `<head>` ni `<body>` a propósito, así que abrirlos directamente muestra una página sin estilos ni navegación.

Por ese mismo motivo Live Server mostrará el aviso *"Live Reload is not possible without a head or body tag"* al servir los fragmentos; es esperado y está silenciado por `.vscode/settings.json` (`liveServer.settings.donotVerifyTags: true`).

## Estructura del proyecto

```
Redes/
├── index.html           # Punto de entrada único (navbar + contenedor + CSS/JS)
├── inicio.html          # Fragmento: página de inicio
├── clases.html          # Fragmento: detección de clase IP
├── subneting.html       # Fragmento: calculadora de subneting
├── pass.html            # Fragmento: generador de contraseñas
├── tareas.html          # Fragmento: gestor de tareas
├── notas.html           # Fragmento: gestor de notas
├── agenda.html          # Fragmento: agenda (en construcción)
├── scripts/
│   ├── redes.js         # Lógica IP + carga de fragmentos
│   ├── scriptpass.js    # Generador de contraseñas
│   ├── scriptTareas.js  # Gestor de tareas
│   └── notas.js         # Gestor de notas
├── css/
│   ├── tema.css         # Tema oscuro: tokens y variables de Bootstrap
│   ├── estilos.css      # Layout del sitio (navbar, inicio, pie, agenda)
│   ├── stylepass.css    # Estilos del generador de contraseñas
│   ├── tareas.css       # Estilos del gestor de tareas
│   └── notas.css        # Estilos del gestor de notas
├── img/                 # Imágenes del proyecto
├── AGENTS.md            # Documentación técnica
├── MEMORY.md            # Notas del proyecto
└── README.md            # Este archivo
```

Los ficheros `.html` que no son `index.html` son **fragmentos de markup** (sin `<!DOCTYPE>`, `<head>`, `<body>`, `<link>` ni `<script>`) que se inyectan en el `#cuerpo` de `index.html` con `fetch()`. Como los `<script>` inyectados con `innerHTML` no se ejecutan, cada herramienta se inicializa desde `scripts/redes.js` (`inicializarFragmento`) justo después de cargar su fragmento.

## Dependencias

Cargadas desde CDN:

- [Bootstrap 5.3.8](https://getbootstrap.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)

Locales:

- `css/tema.css` (tema y tokens), `css/estilos.css` (layout) y los CSS de cada herramienta (con scope para no afectar al resto del sitio)

## Licencia

MIT

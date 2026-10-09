# AGENTS.md

## Project type

Static educational site about IP networks (Redes IP) plus a few small classroom tools. Pure HTML/CSS/JS — no build step, no package manager, no framework, no tests, no CI.

## Running

Open `index.html` in a browser **through a local server** (e.g. `python -m http.server`). Pages are loaded with `fetch()`, so opening the file directly (`file://`) breaks all navigation. There is no dev server or build command.

## Architecture

- `index.html` is the **only real entry point**. It contains the Bootstrap navbar and a `#cuerpo` div (with the same initial content as `inicio.html`), and it is the **only** place where CSS and JS are declared.
- `inicio.html`, `clases.html`, `subneting.html`, `pass.html`, `tareas.html`, `notas.html`, `agenda.html` are **fragments of pure markup**: no `<!DOCTYPE>`, `<head>`, `<body>`, `<link>` or `<script>` tags (they would not work when injected with `innerHTML`). They are injected into `#cuerpo` via `fetch()` in `scripts/redes.js` (`cargarInicio`, `cargarClases`, `cargarSubneting`, `passGenerator`, `tareas`, `notas`, `agenda`, all routed through `cargarFragmento`).
- **Fragment initialization**: `<script>` tags inside an `innerHTML` injection never run, so after injecting a fragment `cargarFragmento()` calls `inicializarFragmento(archivo)`, which runs the fragment's init function when it needs one (`pass.html` → `iniciarPass`, `tareas.html` → `iniciarTareas`, `notas.html` → `cargarNotas`) plus `prepararValidacionIP()`. Any new fragment with JS must be registered there.
- `scripts/` holds **all** JS:
  - `redes.js`: utilities (`ipAInt`, `intAIP`, `claseDelPrimerOcteto`, `prefijoAMascara`), IP class detection (`verClase`, returns `null` on invalid input — callers must check), subneting calculators (`calculaConMascara`, `calculaConRedes`, `calculaConHosts`; classful: classes A, B and C, masks must be contiguous and ≥ the class default), tutor breakdown (`generarDesgloseTutor`), page loading and live IP validation.
  - `scriptpass.js`, `scriptTareas.js`, `notas.js`: one file per tool. They must not touch the DOM at load time (the fragment does not exist yet); everything goes in an init function called by `inicializarFragmento`. Global functions invoked from inline `onclick` in fragments (`guardarNota`, `cargarNotas`, `eliminarNota`, `generatePassword`, `addTask`...) must stay global.
- CSS is organised per feature in `css/`. Rules of the tool stylesheets are **scoped** under their fragment wrapper class (`.vista-pass`, `.vista-tareas`, `.vista-notas`) so they never leak into the rest of the site (`body`, `button`, `input`, `.container` selectors would otherwise restyle everything).
- Tool data persists in `localStorage` as JSON (keys `contrasenas`, `tareas`, `notas`) through `leerX()`/`escribirX()` helpers with `try/catch`. Init functions reload from storage after each injection; after every mutation the data is saved and the view repainted. Render user data with `createElement`/`textContent`, not `innerHTML` (password charset contains `<`/`>`).

## Dependencies

- Bootstrap 5.3.8 and Bootstrap Icons are loaded from CDN. No local copies.
- jQuery is **not** used.
- `css/normalize.css` and `css/estilos.css` are local stylesheets referenced from `index.html`.

## Language

All UI text, comments, and alerts are in **Spanish**. Maintain this for any new content.

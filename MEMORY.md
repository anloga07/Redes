# MEMORY.md

## Project Overview
Static educational site about IP networks (Redes IP) plus classroom tools (generador de contraseñas, tareas, notas, agenda). Pure HTML/CSS/JS — no build step, no package manager, no framework, no tests, no CI. Must be served over HTTP (`python -m http.server`): navigation uses `fetch()` and breaks on `file://`.

## Architecture
- `index.html` is the **only real entry point** and the only place with `<link>`/`<script>` tags (Bootstrap CDN + `scripts/*.js` + `css/*.css`).
- `inicio.html`, `clases.html`, `subneting.html`, `pass.html`, `tareas.html`, `notas.html`, `agenda.html` are **pure-markup fragments** (no doctype/head/body/link/script) injected into `#cuerpo` by `cargarFragmento()` in `scripts/redes.js`.
- **Key gotcha:** `<script>` tags injected with `innerHTML` never execute. That is why `cargarFragmento()` calls `inicializarFragmento(archivo)` after injection, which runs the per-fragment init function: `iniciarPass()`, `iniciarTareas()`, `cargarNotas()`, plus `prepararValidacionIP()`. New fragment with JS → register it there.
- Tool scripts must not run DOM code at load time (elements do not exist yet). Inline `onclick` handlers in fragments need their functions to stay global.
- `scripts/`: `redes.js` (IP utilities, class detection, subneting calculators, tutor mode, loaders), `scriptpass.js`, `scriptTareas.js`, `notas.js`.
- **Persistence:** the tools save data in `localStorage` as JSON — keys `contrasenas` (`[{login, password}]`), `tareas` (`[{id, texto, completada}]`) and `notas`. Pattern: `leerX()`/`escribirX()` helpers with `try/catch` (private mode/quota), init function reloads from storage and repaints after every mutation. Stored passwords are plain text in the browser (classroom use only — noted in the UI). Rendering uses `createElement`/`textContent`, never `innerHTML` with user data (password charset contains `<`/`>`).
- `css/`: `normalize.css`, `estilos.css` (global) + `stylepass.css`, `tareas.css`, `notas.css` scoped under `.vista-pass` / `.vista-tareas` / `.vista-notas` (their fragment wrapper) so `body`/`button`/`input`/`.container` rules don't leak site-wide.
- Subneting is **classful**: classes A/B/C only, contiguous masks ≥ the class default, at least 2 host bits. Listings use 32-bit arithmetic (no manual carry).

## Dependencies
- Bootstrap 5.3.8 and Bootstrap Icons from CDN. jQuery is not used.

## Conventions
- All UI text, comments, and alerts are in **Spanish**. Maintain this for any new content.
- No build tools, no package manager, no test suite, no CI pipeline.

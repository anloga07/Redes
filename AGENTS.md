# AGENTS.md

## Project type

Static educational site about IP networks (Redes IP). Pure HTML/CSS/JS — no build step, no package manager, no framework, no tests, no CI.

## Running

Open `index.html` in a browser, or serve the folder with any static server (e.g. `python -m http.server`). There is no dev server or build command.

## Architecture

- `index.html` is the **only real entry point**. It contains the Bootstrap navbar and a `#cuerpo` div (with the same initial content as `inicio.html`).
- `inicio.html`, `clases.html`, and `subneting.html` are **fragments of pure markup** (no `<!DOCTYPE>`, `<head>` or `<body>`), not standalone pages. They are injected into `#cuerpo` via `fetch()` in `redes.js` (`cargarInicio`, `cargarClases`, `cargarSubneting`, all routed through `cargarFragmento`). Opening them directly in a browser will not work as intended.
- `redes.js` holds **all** logic:
  - utilities: `ipAInt`, `intAIP` (32-bit arithmetic), `claseDelPrimerOcteto`, `prefijoAMascara`;
  - IP class detection: `verClase` (returns `null` on invalid input — callers must check);
  - subneting calculators: `calculaConMascara`, `calculaConRedes`, `calculaConHosts` (classful: only classes A, B and C, and masks must be ≥ the class default mask);
  - step-by-step breakdown: `generarDesgloseTutor` (activated by the `modoTutor` switch);
  - page loading (`cargarFragmento`) and live IP validation (`prepararValidacionIP`, re-attached after each fragment load).
  There are no other JS files or modules.

## Dependencies

- Bootstrap 5.3.8 and Bootstrap Icons are loaded from CDN. No local copies.
- jQuery is **not** used.
- `css/normalize.css` and `css/estilos.css` are local stylesheets referenced from `index.html`.

## Language

All UI text, comments, and alerts are in **Spanish**. Maintain this for any new content.

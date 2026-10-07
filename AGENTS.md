# AGENTS.md

## Project type

Static educational site about IP networks (Redes IP). Pure HTML/CSS/JS — no build step, no package manager, no framework, no tests, no CI.

## Running

Open `index.html` in a browser, or serve the folder with any static server (e.g. `python -m http.server`). There is no dev server or build command.

## Architecture

- `index.html` is the **only real entry point**. It contains the Bootstrap navbar and a `#cuerpo` div.
- `inicio.html`, `clases.html`, and `subneting.html` are **fragments**, not standalone pages. They are loaded into `#cuerpo` via `fetch()` in `redes.js` (`cargarInicio`, `cargarClases`, `cargarSubneting`). Opening them directly in a browser will not work as intended.
- `redes.js` holds **all** logic: IP class detection (`verClase`), subneting calculators (`calculaConMascara`, `calculaConRedes`, `calculaConHosts`), page loading, and form validation. There are no other JS files or modules.

## Dependencies

- Bootstrap 5.3.3, Bootstrap Icons, and jQuery are loaded from CDN. No local copies.
- `normalize.css` is referenced in `index.html`.

## Language

All UI text, comments, and alerts are in **Spanish**. Maintain this for any new content.

# MEMORY.md

## Project Overview
Static educational site about IP networks (Redes IP). Pure HTML/CSS/JS — no build step, no package manager, no framework, no tests, no CI.

## Architecture
- `index.html` is the **only real entry point**. Contains the Bootstrap navbar and a `#cuerpo` div with the default (inicio) content.
- `inicio.html`, `clases.html`, and `subneting.html` are **pure-markup fragments**, not standalone pages (no doctype/head/body). They are loaded into `#cuerpo` via `fetch()` in `redes.js` (`cargarInicio`, `cargarClases`, `cargarSubneting` → shared `cargarFragmento`). Opening them directly in a browser will not work as intended.
- `redes.js` holds **all** logic: conversion helpers (`ipAInt`, `intAIP`, `prefijoAMascara`), IP class detection (`verClase`, returns `null` on invalid input), subneting calculators (`calculaConMascara`, `calculaConRedes`, `calculaConHosts`), tutor breakdown (`generarDesgloseTutor`), page loading, and live IP validation. There are no other JS files or modules.
- Subneting is **classful**: only classes A/B/C, masks must be contiguous and ≥ the class default mask, at least 2 host bits are required. All subnet listings use 32-bit arithmetic (no manual carry).

## Dependencies
- Bootstrap 5.3.8 and Bootstrap Icons are loaded from CDN. jQuery is not used.
- `css/normalize.css` and `css/estilos.css` are local, referenced from `index.html`.

## Running
Open `index.html` in a browser, or serve the folder with any static server (e.g. `python -m http.server`). There is no dev server or build command.

## Conventions
- All UI text, comments, and alerts are in **Spanish**. Maintain this for any new content.
- No build tools, no package manager, no test suite, no CI pipeline.

# AGENTS.md

## Project type

Static educational site about IP networks (Redes IP) plus a few small classroom tools. Pure HTML/CSS/JS — no build step, no framework, no tests, no CI. A root `package.json` holds **dev-only** lint/format tooling (see "Lint and format").

## Running

Open `index.html` in a browser **through a local server** (e.g. `python -m http.server`). Pages are loaded with `fetch()`, so opening the file directly (`file://`) breaks all navigation. There is no dev server or build command. There is no test runner either: the unit-style checks live in throwaway node scripts, not in the repo.

## Architecture

- `index.html` is the **only real entry point**. It contains the Bootstrap navbar (wrapped in a `<header>`) and a `<main id="cuerpo">` (with the same initial content as `inicio.html`), and it is the **only** place where CSS and JS are declared. `#cuerpo` keeps its `id`, so `cargarFragmento()` still finds it.
- `inicio.html`, `teoria.html`, `clases.html`, `subneting.html`, `pass.html`, `tareas.html`, `notas.html`, `agenda.html` are **fragments of pure markup**: no `<!DOCTYPE>`, `<head>`, `<body>`, `<link>` or `<script>` tags (they would not work when injected with `innerHTML`). They are injected into `#cuerpo` via `fetch()` in `scripts/redes.js` (`cargarInicio`, `teoria`, `cargarClases`, `cargarSubneting`, `passGenerator`, `tareas`, `notas`, `agenda`, all routed through `cargarFragmento`). `teoria.html` is static (no init function): it holds the theory tutorial and a "Más lectura" list of external links.
- **Fragment initialization**: `<script>` tags inside an `innerHTML` injection never run, so after injecting a fragment `cargarFragmento()` calls `inicializarFragmento(archivo)`, which runs the fragment's init function when it needs one (`pass.html` → `iniciarPass`, `tareas.html` → `iniciarTareas`, `notas.html` → `cargarNotas`) plus `prepararValidacionIP()`. Any new fragment with JS must be registered there.
- `scripts/` holds **all** JS:
  - `redes.js`: utilities (`ipAInt`, `intAIP`, `claseDelPrimerOcteto`, `prefijoAMascara`), IP class detection (`verClase`, returns `null` on invalid input — callers must check), subneting calculators (`calculaConMascara`, `calculaConRedes`, `calculaConHosts`; classful: classes A, B and C, masks must be contiguous and ≥ the class default), tutor breakdown (`generarDesgloseTutor`), page loading and live IP validation.
  - `scriptpass.js`, `scriptTareas.js`, `notas.js`: one file per tool. They must not touch the DOM at load time (the fragment does not exist yet); everything goes in an init function called by `inicializarFragmento`. Global functions invoked from inline `onclick` in fragments (`guardarNota`, `cargarNotas`, `eliminarNota`, `generatePassword`, `addTask`...) must stay global.
- CSS is organised per feature in `css/`. `tema.css` defines the design tokens (CSS custom properties) and overrides Bootstrap's CSS variables for the **dark "NOC" theme** (cyan accent, `data-bs-theme="dark"` on `<html>`); `estilos.css` holds the site layout (navbar, hero, footer, agenda). Rules of the tool stylesheets are **scoped** under their fragment wrapper class (`.vista-pass`, `.vista-tareas`, `.vista-notas`, `.vista-agenda`) so they never leak into the rest of the site (`body`, `button`, `input`, `.container` selectors would otherwise restyle everything). Reuse the theme tokens and utilities (`.panel`, `.section-title`, `.result-box`, `.ip-out`, `.btn-outline-accent`, `--red-*`) instead of adding new hardcoded colors. Stylelint enforces kebab-case class names and a `0,3,0` specificity ceiling, so drop redundant element/ancestor selectors (`.vista-notas .editar:hover`) and mirror any class rename in the JS that creates the node.
- Tool data persists in `localStorage` as JSON (keys `contrasenas`, `tareas`, `notas`) through `leerX()`/`escribirX()` helpers with `try/catch`. Init functions reload from storage after each injection; after every mutation the data is saved and the view repainted. Render user data with `createElement`/`textContent`, not `innerHTML` (password charset contains `<`/`>`).

## Dependencies

- Bootstrap 5.3.8 and Bootstrap Icons are loaded from CDN. No local copies.
- jQuery is **not** used.
- Local stylesheets referenced from `index.html`: `css/tema.css` (theme tokens), `css/estilos.css` (layout) and the per-tool CSS. `css/normalize.css` was removed because Bootstrap Reboot already normalizes.

## Lint and format (local tooling)

- The root `package.json` is **dev-only**; it does not affect how the site runs. Scripts: `npm run lint` (`lint:js` eslint + `lint:css` stylelint + `lint:html` html-validate), `npm run format` (`prettier --write .`) and `npm run format:check`.
- Config files: `eslint.config.mjs` (flat config; `no-restricted-syntax` bans `innerHTML`, reported as `JS-02`), `.stylelintrc.json`, `.htmlvalidate.json`, `.prettierrc` (double quotes, semicolons, 100 columns).
- Prettier covers the whole site **and** the root `*.md` files. `.prettierignore` keeps `.agents/`, `skills-lock.json`, `.opencode/` and `.vscode/` out of it: they are regenerable or local config that is read as instructions.
- **Prettier and html-validate disagree by default.** Prettier writes `<!doctype html>` and self-closing void elements (`<meta ... />`); `html-validate:recommended` demands `<!DOCTYPE html>` and omitted end tags. `.htmlvalidate.json` therefore overrides `doctype-style` to `lowercase` and `void-style` to `selfclosing`. Keep both in sync, or freshly formatted HTML fails `npm run lint:html`.
- **Line endings:** the repo stores LF and `.gitattributes` (`* text=auto eol=lf`) forces LF in the working tree, because Prettier's default is `endOfLine: "lf"` while Windows git (`core.autocrlf=true`) would otherwise check files out as CRLF. Do not drop that rule: without it `npm run format:check` flags every file on a fresh clone.
- Outstanding real debt (not formatting): `innerHTML` in the tool scripts (eslint). Stylelint is clean: colours use modern notation, class names are kebab-case, selectors stay at or below `0,3,0`, and the only `!important` is the `prefers-reduced-motion` block with a `stylelint-disable`. html-validate is clean: form controls in the fragments have labels and every `<button>` declares its `type`. The inline edit form that `notas.js` builds at runtime (`edit-titulo`, `edit-contenido`, `edit-fecha`) is still unlabeled — html-validate cannot see it.

## OpenCode tooling (local)

- `.opencode/` holds this project's local OpenCode configuration. It is **not part of the site**; `node_modules`, `package.json` and `package-lock.json` inside it are git-ignored.
- `commands/revisar.md` defines the `/revisar` command: it runs with the `revisar` agent and loads the `revision-frontend` skill. Usage: `/revisar <ruta>`.
- `agents/revisar.md` is the read-only reviewer agent (`mode: all`; `edit` denied, `shell` allowed so the linters required by the skill can run).
- `skills/revision-frontend/` holds the review skill (`SKILL.md` + `reglas-html.md`, `reglas-css.md`, `reglas-js.md`). The skill **id comes from the folder name**, so keep the folder `revision-frontend`; the frontmatter `name` is only a display label.
- A command's `agent:` field must reference an **existing** agent id. Otherwise the command still appears in the list but fails on run with `Error: Agent not found: <id>`.

## Language

All UI text, comments, and alerts are in **Spanish**. Maintain this for any new content. You must keep the MEMORY.md file updated with the changes.

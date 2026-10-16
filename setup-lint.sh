#!/usr/bin/env bash
# Instala y configura ESLint, Stylelint, html-validate y Prettier en el proyecto actual.
# Uso:  bash scripts/setup-lint.sh [--force]
#   --force  sobrescribe los archivos de configuración que ya existan.
# Compatible con Git Bash (Windows), Linux y macOS. No sobrescribe nada sin --force.

set -u
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

say()  { printf '\n==> %s\n' "$1"; }
ok()   { printf '    [ok] %s\n' "$1"; }
skip() { printf '    [se conserva] %s (ya existe; usa --force para sobrescribir)\n' "$1"; }

# ---------- 1. Requisitos ----------
say "Comprobando requisitos"
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js no está instalado."; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "ERROR: npm no está instalado."; exit 1; }
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: se necesita Node.js 20 o superior (tienes $(node --version))."; exit 1
fi
ok "Node $(node --version), npm $(npm --version)"

# ---------- 2. package.json ----------
say "Preparando package.json"
if [ ! -f package.json ]; then
  npm init -y >/dev/null 2>&1 && ok "package.json creado"
else
  ok "package.json existente"
fi

# ---------- 3. Dependencias ----------
say "Instalando dependencias (puede tardar un minuto)"
npm install --save-dev eslint @eslint/js globals stylelint stylelint-config-standard html-validate prettier \
  || { echo "ERROR: falló npm install. Revisa la conexión y vuelve a ejecutar el script."; exit 1; }
ok "dependencias instaladas"

# ---------- 4. Detectar si los scripts son clásicos o módulos ----------
SOURCE_TYPE="module"
UNUSED_RULE='"no-unused-vars": "warn",'
UNDEF_RULE=''
if grep -hs '<script' ./*.html 2>/dev/null | grep 'src=' | grep -vq 'type="module"'; then
  SOURCE_TYPE="script"
  UNUSED_RULE='"no-unused-vars": ["warn", { vars: "local" }],'
  UNDEF_RULE='"no-undef": "off",'
fi
say "Tipo de scripts detectado: $SOURCE_TYPE"
[ "$SOURCE_TYPE" = "script" ] && ok "scripts clásicos: se ajusta no-unused-vars y se desactiva no-undef"

# ---------- 5. Archivos de configuración ----------
write_file() { # $1 = ruta; el contenido llega por stdin
  if [ -f "$1" ] && [ "$FORCE" -eq 0 ]; then cat >/dev/null; skip "$1"; else cat >"$1"; ok "$1 creado"; fi
}

say "Creando archivos de configuración"

write_file eslint.config.mjs <<EOF
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "dist/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "${SOURCE_TYPE}",
      globals: { ...globals.browser },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-console": "warn",
      ${UNUSED_RULE}
      ${UNDEF_RULE}
      complexity: ["warn", 10],
      "max-lines-per-function": ["warn", { max: 50, skipComments: true }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)\$/]",
          message: "JS-02: usa textContent o createElement en lugar de innerHTML.",
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: "JS-02: usa textContent o createElement en lugar de insertAdjacentHTML.",
        },
      ],
    },
  },
];
EOF

write_file .stylelintrc.json <<'EOF'
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "declaration-no-important": true,
    "selector-max-id": 0,
    "selector-max-specificity": "0,3,0",
    "media-feature-range-notation": "prefix",
    "no-duplicate-selectors": true,
    "declaration-block-no-duplicate-properties": true,
    "property-disallowed-list": ["float"]
  }
}
EOF

write_file .htmlvalidate.json <<'EOF'
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "no-inline-style": "error",
    "wcag/h37": "error",
    "wcag/h30": "error",
    "input-missing-label": "error",
    "no-implicit-button-type": "error",
    "prefer-native-element": "error"
  }
}
EOF

write_file .prettierrc <<'EOF'
{
  "singleQuote": false,
  "semi": true,
  "printWidth": 100
}
EOF

write_file .prettierignore <<'EOF'
node_modules
package-lock.json
EOF

if [ ! -f .gitignore ] || ! grep -qx 'node_modules/' .gitignore; then
  printf 'node_modules/\n' >> .gitignore && ok ".gitignore: añadido node_modules/"
fi

# ---------- 6. Scripts de npm (sin pisar los existentes) ----------
say "Añadiendo scripts a package.json"
HAS_HTML=0
ls ./*.html >/dev/null 2>&1 && HAS_HTML=1
HAS_HTML="$HAS_HTML" node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.scripts = p.scripts || {};
const hasHtml = process.env.HAS_HTML === "1";
const wanted = {
  "lint:js": "eslint .",
  "lint:css": "stylelint \"**/*.css\" --allow-empty-input --ignore-pattern node_modules",
};
if (hasHtml) wanted["lint:html"] = "html-validate \"*.html\"";
wanted["lint"] = Object.keys(wanted).map(k => "npm run " + k).join(" && ");
wanted["format"] = "prettier --write .";
wanted["format:check"] = "prettier --check .";
for (const [k, v] of Object.entries(wanted)) {
  if (p.scripts[k]) console.log("    [se conserva] script " + k + " (ya existe)");
  else { p.scripts[k] = v; console.log("    [ok] script " + k); }
}
if (!hasHtml) console.log("    [aviso] no hay archivos .html en la raíz: no se añade lint:html");
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
'

# ---------- 7. Comprobación final ----------
say "Ejecutando npm run lint"
if npm run lint; then
  say "Todo correcto: las herramientas están instaladas y no hay errores."
else
  say "Instalación completada. El lint ha encontrado avisos o errores en tu código (es normal en un proyecto existente)."
  echo "    Revisa el listado anterior: la configuración funciona; los errores son del código."
fi
echo
echo "Comandos útiles: npm run lint | npm run lint:js | npm run lint:css | npm run format"
exit 0

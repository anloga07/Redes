---
name: revision-frontend
description: Úsala cuando se pida revisar, auditar u optimizar código HTML, CSS o JavaScript del cliente (calidad, accesibilidad, rendimiento, buenas prácticas). No la uses para escribir funcionalidades nuevas.
---
# Revisión de código front-end

## Principios
- Revisión de solo lectura: NO modifiques archivos salvo que se pida.
- Cada hallazgo cita una regla por su ID (HTML-03, CSS-05, JS-02...).
- No inventes reglas: si algo no está en los ficheros de reglas, márcalo como "sugerencia".
- Prioriza la herramienta sobre la opinión: ejecuta los linters antes de revisar a mano.

## Procedimiento
1. Identifica qué lenguajes hay en el alcance pedido y lee SOLO los ficheros de reglas necesarios (reglas-html.md, reglas-css.md, reglas-js.md).
2. Ejecuta las comprobaciones automáticas disponibles:
  - JS: `npx eslint <ruta>`
  - CSS: `npx stylelint "<ruta>/**/*.css"`
  - HTML: `npx html-validate <ruta>`
  Si una herramienta no está instalada, indícalo y continúa con la revisión manual.
3. Revisa manualmente lo que los linters no detectan (semántica, accesibilidad, estructura, rendimiento).
4. Clasifica cada hallazgo por gravedad: CRÍTICO, IMPORTANTE o MEJORA.
5. Entrega el informe con el formato indicado.

## Formato del informe
Resumen de 2-3 líneas con la valoración global y después una tabla:

| Gravedad | Archivo:línea | Regla | Problema | Corrección propuesta |

Termina con "Lo que está bien" (máximo 3 puntos) y "Siguientes pasos" (máximo 3).

## Límites
- Máximo 15 hallazgos por informe: agrupa los repetidos ("falta alt en 8 imágenes").
- No reescribas el archivo completo: propón el cambio mínimo.


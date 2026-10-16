# Reglas JavaScript
- JS-01 (CRÍTICO): sin `var`; `const` por defecto y `let` si se reasigna.
- JS-02 (CRÍTICO): no insertar datos del usuario con `innerHTML`; usar `textContent` o `createElement`.
- JS-03 (IMPORTANTE): `fetch` con comprobación de `response.ok` y `try/catch`.
- JS-04 (IMPORTANTE): funciones pequeñas con una sola responsabilidad; sin lógica duplicada.
- JS-05 (IMPORTANTE): módulos ES (`import`/`export`) y sin variables globales innecesarias.
- JS-06 (MEJORA): delegación de eventos en listas dinámicas y `removeEventListener` cuando proceda.
- JS-07 (MEJORA): sin acceso repetido al DOM dentro de bucles; cachear referencias.

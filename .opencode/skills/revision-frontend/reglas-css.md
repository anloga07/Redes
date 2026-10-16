# Reglas CSS
- CSS-01 (CRÍTICO): una hoja de herramienta no reestiliza el sitio entero (`body`, `button`, `input`, `.container`); todo va bajo la clase del fragmento (`.vista-pass`, `.vista-tareas`, `.vista-notas`, `.vista-agenda`).
- CSS-02 (CRÍTICO): sin `float` ni `!important` (`property-disallowed-list`, `declaration-no-important`); la maquetación se resuelve con flex/grid y, si `!important` es imprescindible, se documenta con `stylelint-disable` y su motivo.
- CSS-03 (IMPORTANTE): sin `#id` como selector y con especificidad ≤ `0,3,0` (`selector-max-id`, `selector-max-specificity`); se quitan los selectores de elemento o de ancestro que la clase ya cubre.
- CSS-04 (IMPORTANTE): clases en kebab-case, con el mismo texto en el CSS y en el JS que crea el nodo; si se renombra, se cambian los dos a la vez.
- CSS-05 (IMPORTANTE): ni selectores ni propiedades duplicadas (`no-duplicate-selectors`, `declaration-block-no-duplicate-properties`).
- CSS-06 (MEJORA): los colores salen de los tokens del tema (`--red-*`), con notación moderna (`rgb(… / …%)`) y hex corto (`#fff`).
- CSS-07 (MEJORA): sin código muerto: toda clase del CSS existe en el HTML/JS, y toda clase que crea el JS tiene estilo (o se borra de los dos sitios).
- CSS-08 (MEJORA): estados `:hover`, `:focus-visible` y `:disabled` definidos; el movimiento (transiciones y animaciones) respeta `prefers-reduced-motion` y no anima `box-shadow` ni `filter`.
- CSS-09 (MEJORA): media queries con notación de prefijo (`(max-width: 992px)`, `media-feature-range-notation`) y sin `@import` de otras hojas.

# Redes IP

Sitio web educativo estático sobre redes IP con herramientas de cálculo interactivas.

## Características

- **Detección de clase IP** — Identifica si una dirección IP pertenece a la clase A, B, C, D o E
- **Calculadora de Subneting** — Tres modos de cálculo:
  - Por máscara de subred
  - Por número de redes deseadas
  - Por número de hosts deseados
- **Modo Tutor** — Desglose paso a paso: conversión a binario, operación AND, número mágico y rango de subredes
- **Resultados detallados** — Muestra máscara en decimal y binario, número de subredes, hosts útiles, rangos de direcciones y broadcast
- **Validación en vivo** — El campo de IP se resalta en verde/rojo mientras se escribe

## Tecnologías

- HTML5
- CSS3
- JavaScript (vanilla)
- Bootstrap 5.3.8
- Bootstrap Icons 1.11.3

## Cómo ejecutar

Abre `index.html` directamente en el navegador, o sirve la carpeta con un servidor estático:

Ejecuta en la carpeta de tu proyecto (donde esta el index.html)
```bash
python -m http.server 8000
```

Luego accede a `http://localhost:8000`

## Estructura del proyecto

```
Redes/
├── index.html          # Punto de entrada único (navbar + contenedor)
├── inicio.html         # Fragmento: página de inicio
├── clases.html         # Fragmento: detección de clase IP
├── subneting.html      # Fragmento: calculadora de subneting
├── redes.js            # Toda la lógica (cálculos, carga de páginas, validación)
├── css/
│   ├── normalize.css   # Reset de estilos
│   └── estilos.css     # Estilos personalizados
├── img/                # Imágenes del proyecto
├── AGENTS.md           # Documentación técnica
├── MEMORY.md           # Notas del proyecto
└── README.md           # Este archivo
```

Los tres ficheros `.html` que no son `index.html` son **fragmentos de markup** (sin `<!DOCTYPE>`, `<head>` ni `<body>`) que se inyectan en el `#cuerpo` de `index.html` con `fetch()`; abiertos directamente no funcionan como páginas independientes.

## Dependencias

Cargadas desde CDN:

- [Bootstrap 5.3.8](https://getbootstrap.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)

Locales:

- `css/normalize.css`
- `css/estilos.css`

## Licencia

MIT

# AIUTO — índice del paquete

Sitio institucional, 9 pantallas. Español (MX). Base visual: Modernist + paleta del isotipo AIUTO.

---

## 1. Empieza por aquí

| Si eres… | Abre |
| --- | --- |
| Cliente / revisión | `entrega/aiuto-prototipo.html` — doble clic, funciona offline. Las 9 pantallas navegables. |
| Desarrollador | `entrega/HANDOFF.md` primero, luego `sitio/index.html`. |
| Diseño | `sitio/ui-kit.html` — foundations y componentes en todos sus estados. |

---

## 2. `sitio/` — sitio estático (HTML + CSS separados)

Una página por archivo. Se puede subir tal cual a cualquier hosting.

| Archivo | Pantalla |
| --- | --- |
| `index.html` | Home |
| `nosotros.html` | Nosotros — misión, visión, 6 valores |
| `empresas.html` | Para Empresas — flujo de 6 pasos, beneficios |
| `talento.html` | Para Talento — 8 servicios |
| `categorias.html` | Categorías — las 7 en lista, con todos sus servicios |
| `categoria.html?cat=slug` | **Plantilla maestra de categoría.** Una sola página sirve a las 7 |
| `bolsa.html` | Bolsa de Trabajo — filtros, 7 vacantes, estados de postulación |
| `contacto.html` | Contacto — formulario completo, error de validación y panel de éxito |
| `ui-kit.html` | UI Kit — logo, color, tipografía, rejilla, botones, formularios, bloques, estados |

Archivos de soporte:

| Archivo | Qué hace |
| --- | --- |
| `styles.css` | Hoja única. **Todos los tokens están en `:root`, arriba del archivo** — cambiarlos ahí cambia todo el sitio. Incluye los breakpoints. |
| `main.js` | Menú móvil, estados de formulario (enviando → éxito), búsqueda de vacantes, postular, y el pintado de la plantilla de categoría. |
| `categorias.json` | Las 7 categorías: color, icono, propuesta de valor y lista de servicios. |
| `categorias.js` | Los mismos datos como script, para que `categoria.html` funcione también abierta con `file://`. |
| `assets/` | `aiuto-lockup.png`, `aiuto-isotipo.png` |

Slugs de categoría: `estrategia`, `comercial`, `capital-humano`, `operaciones`, `tecnologia`, `finanzas`, `comex`.

Breakpoints: **1440** base · **1024** margen 32 · **900** menú a hamburguesa · **768** una columna · **640/390** botones a ancho completo, vacantes en tarjetas.

---

## 3. `entrega/` — para enviar

| Archivo | Qué es |
| --- | --- |
| `HANDOFF.md` | Especificación completa: tokens, escala tipográfica, rejilla, interacción, notas por pantalla y los pendientes antes de producción. |
| `tokens.json` | Los mismos tokens en formato legible por máquina (para Tailwind, Figma Tokens, variables CSS). |
| `aiuto-prototipo.html` | El mockup completo en un solo archivo, sin dependencias. Para enviar por correo. |

---

## 4. Mockup y fuentes

| Archivo | Qué es |
| --- | --- |
| `AIUTO Website.dc.html` | El mockup navegable editable. Incluye la vista **Móvil 390** (enlace en el pie). |
| `assets/` | Logos originales con transparencia. |
| `uploads/` | Los archivos que subiste (logo). |
| `_ds/` | Tokens del sistema Modernist del que parte el diseño. |
| `support.js` | Runtime del mockup. No editar. |

---

## 5. Pendientes antes de producción

1. **Fotografía** — todo es marcador rayado recortado con la geometría del isotipo. Sustituir por `<img>` con el mismo `clip-path` y `filter: grayscale(1)`; el layout no cambia.
2. **Logo monocromático** — falta la versión de una tinta y la sólo-tipográfica.
3. **Contenido real** — teléfono, correo, número de WhatsApp, redes, avisos legales y las vacantes son de muestra.
4. **Backend** — los formularios simulan el envío (la validación de cliente y el honeypot ya están). Conectar a correo/CRM con validación de servidor.
5. **Analítica** — falta el contenedor de analítica (Open Graph, favicon, `sitemap.xml` y `robots.txt` ya incluidos).
6. **Iconos** — set lineal propio; si se adopta Lucide, mantener grosor 1.6 y remates rectos.

> **Nota (2026-08):** el sitio en `sitio/` recibió una pasada production-ready: tokens de categoría centralizados, layouts responsivos por clase, validación de formularios, filtros funcionales en la bolsa, accesibilidad de menú/skip link, SEO por página y microinteracciones con `prefers-reduced-motion`. Detalle en `entrega/HANDOFF.md` §5. El prototipo de `entrega/` y el mockup `.dc.html` quedan como referencia congelada del diseño aprobado.

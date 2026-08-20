# AIUTO — paquete de handoff

Versión: 1.0 · Alcance: sitio institucional (9 pantallas) · Idioma: español (MX)

## 1. Qué hay en este repositorio

| Ruta | Qué es | Para quién |
| --- | --- | --- |
| `sitio/` | Sitio estático real: HTML + CSS separados, una página por archivo. Responsive 1440 / 1024 / 768 / 390. | Desarrollo |
| `sitio/styles.css` | Hoja única. Los tokens viven en `:root` — editarlos cambia todo el sitio. | Desarrollo |
| `sitio/main.js` | Comportamiento del prototipo: menú móvil, estados de formulario, búsqueda de vacantes, plantilla de categoría. | Desarrollo |
| `sitio/categorias.json` / `categorias.js` | Las 7 categorías (color, icono, propuesta, servicios). Alimentan `categoria.html`; el `.js` existe para que la página funcione también abierta con `file://`. | Desarrollo / contenido |
| `sitio/ui-kit.html` | Foundations y componentes en estados reales. Referencia visual normativa. | Diseño / desarrollo |
| `AIUTO Website.dc.html` | Mockup navegable de las 9 pantallas (revisión y aprobación). | Cliente / diseño |
| `entrega/aiuto-prototipo.html` | El mockup en un solo archivo, funciona offline sin dependencias. | Envío por correo |
| `assets/` | Logos originales (PNG con transparencia). | Todos |

## 2. Sistema visual

Base **Modernist**: Archivo en todos los pesos, radio 0 px en todo componente, reglas de 2 px entre secciones y 1 px dentro de bloques, todo alineado a la izquierda (incluidas las etiquetas de los botones), fotografía en blanco y negro.

Marca **AIUTO**: el morado del isotipo (`#572967`) es el único color de acción. Los siete colores del isotipo forman el sistema de categorías — cada categoría tiene tres pasos (base, oscuro, tinte) y no se usan fuera de su categoría.

### Tokens globales

| Token | Valor | Uso |
| --- | --- | --- |
| `--white` | `#ffffff` | Fondo dominante |
| `--off` | `#f8f7f7` | Bandas y superficies |
| `--ink` | `#201e1d` | Texto y reglas de 2 px |
| `--ink-2` | `#57534f` | Párrafos secundarios |
| `--neutral` | `#6b6866` | Texto terciario, labels |
| `--line` | `#d6d3d1` | Reglas de 1 px |
| `--field` | `#b8b3b0` | Borde de campo |
| `--purple` | `#572967` | Acción primaria |
| `--purple-700` | `#3d1c49` | Hover |
| `--purple-900` | `#2c1435` | Active |
| `--purple-100` | `#f3eff5` | Fondo tenue |

### Categorías

| Categoría | `--cat` | `--cat-dark` | `--cat-tint` | slug |
| --- | --- | --- | --- | --- |
| Consultoría Estratégica | `#66a2ba` | `#2f6d86` | `#eef4f7` | `estrategia` |
| Comercial y Crecimiento | `#c20e59` | `#96063f` | `#fbeef3` | `comercial` |
| Capital Humano | `#7cb39a` | `#3f7a5f` | `#eef5f1` | `capital-humano` |
| Operaciones | `#c21624` | `#94101b` | `#fbeeef` | `operaciones` |
| Tecnología e Innovación | `#572967` | `#3d1c49` | `#f3eff5` | `tecnologia` |
| Finanzas y Administración | `#cd5d22` | `#9c4415` | `#fbf1ea` | `finanzas` |
| Comercio Exterior & Supply Chain | `#158a92` | `#0f6a70` | `#eaf4f5` | `comex` |

### Tipografía

Archivo (Google Fonts, pesos 400/500/600/700). Escala: Display 56 / H1 48 / H2 30 / H3 21 / H4 16.5 / Body-L 18 / Body 16 / Small 14.5 / Label 11.5 con `letter-spacing: .14em`. Interlineado 1.04 en display, 1.5–1.6 en párrafo. `text-wrap: pretty` en titulares y leads.

### Rejilla y espaciado

12 columnas, gutter 24, ancho máximo 1240, margen 48. Escala de espaciado 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72.

Breakpoints: **1440** (base de diseño) · **1024** (margen 32, 4–5 col → 2) · **900** (menú colapsa a hamburguesa) · **768** (splits a una columna) · **640/390** (margen 20, botones full-width, tabla de vacantes a tarjetas).

## 3. Notas por pantalla

| Pantalla | Archivo | Notas de implementación |
| --- | --- | --- |
| Home | `index.html` | Hero con composición de rombos + foto recortada; selector Empresas/Talento; 7 categorías; 5 servicios de talento; métricas; proceso de 5 pasos; banda de cierre. |
| Nosotros | `nosotros.html` | Foto 16:9 recortada, misión/visión a dos columnas divididas por regla, 6 valores en fila de rombos. |
| Para Empresas | `empresas.html` | El flujo de 6 pasos usa `.flow`: cada celda lleva su color de categoría en `border-bottom`. En móvil se apila y la regla pasa arriba. |
| Para Talento | `talento.html` | 8 servicios en rejilla de 4. Banda de cierre en morado sólido (única variante `banner--solid`). |
| Categorías | `categorias.html` | Lista, no rejilla: icono en tinte, nombre con rombo, todos los servicios como tags, CTA por fila. |
| Categoría (master) | `categoria.html?cat=slug` | **Una sola plantilla para las 7.** `main.js` lee el slug, escribe `--cat/--cat-dark/--cat-tint` en `:root` y pinta nombre, icono, propuesta, servicios y chips desde `categorias.json`. El formulario se superpone al hero con `margin-top:-84px`; en móvil pasa a flujo normal. |
| Bolsa de Trabajo | `bolsa.html` | Barra de filtros de 5 celdas; la búsqueda filtra por puesto, empresa y categoría. Estados de vacante: `new` (chip NUEVA), `open`, `applied`, `closed`. En móvil cada fila se vuelve tarjeta. |
| Contacto | `contacto.html` | Tres columnas: datos / formulario / composición. Trae **a propósito** un error de validación visible en el campo de correo como referencia de estado. Al enviar, el formulario se reemplaza por el panel de éxito. |
| UI Kit | `ui-kit.html` | Foundations + componentes en todos sus estados. Es la referencia normativa: si algo no está aquí, no está en el sistema. |

## 4. Interacción

- Transiciones 150–300 ms ease-out. Hover de tarjeta: `translateY(-3px)` + fondo `--off`. Nav: subrayado de 2 px.
- Focus de teclado: `outline: 2px solid var(--purple); outline-offset: 2px` — nunca el anillo azul del navegador.
- Estados de formulario: default, focus, error (rombo + texto, no sólo color), disabled, enviando (spinner), éxito.
- Targets mínimos de 48 px en móvil; el botón principal pasa a ancho completo.

## 5. Refinamiento production-ready (aplicado)

Sobre la base 1.0 se aplicó una pasada de refinamiento sin cambiar la dirección visual:

- **Tokens de categoría centralizados.** Clases `.cat--estrategia … .cat--comex` en `styles.css` escriben `--cat/--cat-dark/--cat-tint`; ya no hay hexes duplicados inline en `index.html` ni `categorias.html`. Se añadieron los tintes faltantes (`--magenta-100`, `--orange-100`, `--teal-100`).
- **Layouts responsivos por clase** (los grids inline no podían responder a media queries): `.proof`/`.metrics` (métricas del home), `.need` (proceso de 5 pasos), `.contact-layout` (contacto a 3 → 2 → 1 columnas), `.cat-row` (filas de categorías), `.mv` (misión/visión) y `.values` (valores).
- **Formularios.** Validación en cliente (requeridos + formato de correo) con el patrón de error del kit (rombo + texto), foco al primer campo inválido y honeypot `_hp`. Se retiró el error de muestra que venía horneado en `contacto.html` (sigue documentado en el UI Kit).
- **Header.** Skip link, `aria-expanded`/`aria-controls` en el toggle, cierre con Escape y clic fuera; el CTA entra al menú colapsado como `.nav__cta`.
- **Bolsa.** Los tres selects ahora filtran de verdad (`data-job-filter`) combinados con la búsqueda; corregido `[hidden]{display:none!important}` (el atributo perdía contra `display:grid`) y el botón Buscar invisible (blanco sobre blanco por `.filters > *`).
- **Microinteracciones.** Entrada suave de secciones (`.reveal`, 280 ms) vía IntersectionObserver, con `prefers-reduced-motion` respetado globalmente.
- **SEO.** Favicon, `theme-color`, canonical, Open Graph/Twitter por página, `robots.txt` y `sitemap.xml` (dominio `https://aiuto.com.mx`); `ui-kit.html` con `noindex`.
- **Táctil.** `btn-sm` y `chip` con mínimo 44 px en móvil.

## 6. Pendientes antes de producción

1. **Fotografía.** Todas las imágenes son marcadores rayados recortados con la geometría del isotipo. Sustituir el `div.photo` por un `<img>` con el mismo `clip-path` y `filter: grayscale(1)`; el layout no cambia.
2. **Logo monocromático.** Falta la versión de una tinta para fondos cromáticos; hoy se resuelve con caja blanca. Pedir el archivo aislado (también la versión sólo tipográfica).
3. **Contenido real.** Teléfono, correo, dirección, avisos legales, blog, casos de éxito, redes sociales, el número de WhatsApp (`wa.me/525500000000`) y las vacantes de la bolsa son de muestra.
4. **Backend.** El envío sigue simulado: conectar a correo/CRM y añadir validación de servidor (la validación de cliente y el honeypot ya están).
5. **Analítica.** Falta el contenedor de analítica y verificación de Search Console (OG, favicon, `sitemap.xml` y `robots.txt` ya incluidos).
6. **Iconos.** El set lineal es propio; si se adopta Lucide, mantener grosor 1.6 y remates rectos.

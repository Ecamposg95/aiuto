# AIUTO — Sitio institucional

**Ecosistema de soluciones empresariales que conecta necesidades con especialistas capaces de resolverlas.**

> Conectamos necesidades con soluciones que generan resultados.

Sitio institucional estático de AIUTO (es-MX): 9 pantallas, sin frameworks ni dependencias de build. HTML semántico, CSS con design tokens centralizados y JavaScript vanilla. Listo para desplegarse en cualquier hosting estático bajo el dominio `aiuto.com.mx`.

---

## Estructura del repositorio

```
├── sitio/                  Sitio desplegable (subir tal cual a cualquier hosting estático)
│   ├── index.html          Home
│   ├── nosotros.html       Misión, visión y valores
│   ├── empresas.html       Para Empresas — flujo de acompañamiento de 6 pasos
│   ├── talento.html        Para Talento — 8 servicios de empleabilidad
│   ├── categorias.html     Las 7 categorías de especialistas
│   ├── categoria.html      Plantilla maestra de categoría (?cat=slug)
│   ├── bolsa.html          Bolsa de Trabajo con búsqueda y filtros
│   ├── contacto.html       Formulario de contacto con validación
│   ├── ui-kit.html         UI Kit — referencia normativa del sistema visual
│   ├── styles.css          Hoja única; todos los tokens en :root
│   ├── main.js             Comportamiento: menú, formularios, filtros, categoría
│   ├── categorias.json/.js Datos de las 7 categorías
│   ├── robots.txt          + sitemap.xml
│   └── assets/             Logos AIUTO
└── docs/
    ├── HANDOFF.md          Especificación de diseño: tokens, tipografía, rejilla, notas por pantalla
    ├── tokens.json         Design tokens en formato máquina (Tailwind / Figma Tokens / CSS vars)
    └── diseno/             Paquete de diseño original (mockup editable, prototipo offline, fuentes)
```

## Vista local

No requiere instalación. Cualquier servidor estático funciona:

```bash
cd sitio
python3 -m http.server 8080
# → http://localhost:8080
```

`categoria.html` funciona incluso abierto con `file://` gracias a `categorias.js` (espejo del JSON).

## Stack y principios

| Aspecto | Decisión |
| --- | --- |
| Stack | HTML5 + CSS3 + JS vanilla · cero dependencias, cero build |
| Tipografía | [Archivo](https://fonts.google.com/specimen/Archivo) (Google Fonts, 400–700) |
| Sistema visual | Base *Modernist*: radio 0 px, reglas de 2 px, alineación izquierda, fotografía B/N |
| Tokens | Centralizados en `:root` de `sitio/styles.css` y en `docs/tokens.json` |
| Accesibilidad | WCAG AA: skip link, focus visible, `aria-expanded`, targets ≥ 44 px, `prefers-reduced-motion` |
| SEO | Canonical, Open Graph, favicon, `robots.txt`, `sitemap.xml`; un solo H1 por pantalla |
| Responsive | Breakpoints 1440 (base) · 1024 · 900 (menú) · 768 · 640/390 |

## Sistema de categorías

El morado del isotipo (`#572967`) es el único color de acción. Los siete colores del isotipo forman el sistema de categorías; cada una expone `--cat` / `--cat-dark` / `--cat-tint` mediante la clase `.cat--<slug>`:

| Categoría | Color | Slug |
| --- | --- | --- |
| Consultoría Estratégica | `#66a2ba` | `estrategia` |
| Comercial y Crecimiento | `#c20e59` | `comercial` |
| Capital Humano | `#7cb39a` | `capital-humano` |
| Operaciones | `#c21624` | `operaciones` |
| Tecnología e Innovación | `#572967` | `tecnologia` |
| Finanzas y Administración | `#cd5d22` | `finanzas` |
| Comercio Exterior & Supply Chain | `#158a92` | `comex` |

## Despliegue

El contenido de `sitio/` se publica tal cual en la raíz del hosting (GitHub Pages, Netlify, Vercel, S3, nginx…). El dominio canónico configurado en metadatos, `robots.txt` y `sitemap.xml` es `https://aiuto.com.mx`.

## Pendientes antes del lanzamiento

1. **Fotografía real** — los marcadores rayados se sustituyen por `<img>` con el mismo `clip-path`; el layout no cambia.
2. **Contenido real** — teléfono, correo, número de WhatsApp, redes sociales, avisos legales y vacantes son de muestra.
3. **Backend de formularios** — el envío está simulado; la validación de cliente y el honeypot ya están. Conectar a correo/CRM.
4. **Analítica** — contenedor de analítica y verificación en Search Console.

Detalle completo en [`docs/HANDOFF.md`](docs/HANDOFF.md).

---

© AIUTO. Todos los derechos reservados. Los logotipos y la identidad visual AIUTO son propiedad de sus titulares.

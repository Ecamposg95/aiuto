# AIUTO — Sitio institucional

**Ecosistema de soluciones empresariales que conecta necesidades con especialistas capaces de resolverlas.**

> Conectamos necesidades con soluciones que generan resultados.

Sitio institucional estático de AIUTO (es-MX): 9 pantallas, sin frameworks ni dependencias de build. HTML semántico, CSS con design tokens centralizados y JavaScript vanilla.

**En línea en [aiuto.com.mx](https://aiuto.com.mx) desde el 8 de septiembre de 2026**, con contenido de muestra pendiente de sustituir — ver [`docs/CONTENIDO.md`](docs/CONTENIDO.md).

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
│   ├── 404.html            Página de error
│   ├── .htaccess           Config Apache: HTTPS, www→raíz, compresión, caché
│   ├── styles.css          Hoja única; todos los tokens en :root
│   ├── main.js             Comportamiento: menú, formularios, filtros, categoría
│   ├── categorias.json/.js Datos de las 7 categorías
│   ├── robots.txt          + sitemap.xml
│   └── assets/             Logos AIUTO
├── docs/
│   ├── HANDOFF.md          Especificación de diseño: tokens, tipografía, rejilla, notas por pantalla
│   ├── DESPLIEGUE.md       Guía de publicación: subida, DNS, HTTPS y verificación
│   ├── CONTENIDO.md        Qué falta sustituir: datos, enlaces, fotos, formulario
│   ├── tokens.json         Design tokens en formato máquina (Tailwind / Figma Tokens / CSS vars)
│   └── diseno/             Paquete de diseño original (mockup editable, prototipo offline, fuentes)
└── tools/
    ├── datos.json          Datos reales por sustituir (WhatsApp, correo, enlaces del footer)
    └── aplicar-datos.py    Los aplica a las 9 páginas de una pasada
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

El contenido de `sitio/` se publica tal cual en la raíz pública del hosting (`public_html/` en cPanel; también sirve en Netlify, Vercel, S3 o nginx). El dominio canónico configurado en metadatos, `robots.txt` y `sitemap.xml` es `https://aiuto.com.mx`, sin `www`.

Paquete listo para subir:

```bash
cd sitio && zip -r ../aiuto-sitio.zip .
```

Pasos completos —subida por cPanel o FTP, registros DNS, AutoSSL y verificación con `curl`— en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

## Contenido pendiente

El sitio está publicado con datos de muestra. Para ver qué falta:

```bash
python3 tools/aplicar-datos.py --estado
```

1. **Formulario de contacto** — el envío está simulado: hoy los mensajes se pierden. Es lo más urgente.
2. **Datos reales** — WhatsApp, correo y horario. Se sustituyen llenando `tools/datos.json` y corriendo `python3 tools/aplicar-datos.py --aplicar`.
3. **Enlaces del footer** — blog, redes sociales y avisos legales apuntan a `#`. El aviso de privacidad es obligatorio en cuanto el formulario recoja datos personales.
4. **Fotografía** — basta con sustituir el `<span class="mono">` por un `<img>` dentro del mismo `div.photo`; el CSS ya conserva recorte, blanco y negro y posición. Medidas de cada hueco en `docs/CONTENIDO.md` §3.
5. **Vacantes** — las 7 de `bolsa.html` son inventadas.
6. **Analítica** — contenedor de analítica y verificación en Search Console.

Inventario completo en [`docs/CONTENIDO.md`](docs/CONTENIDO.md); especificación de diseño en [`docs/HANDOFF.md`](docs/HANDOFF.md).

---

© AIUTO. Todos los derechos reservados. Los logotipos y la identidad visual AIUTO son propiedad de sus titulares.

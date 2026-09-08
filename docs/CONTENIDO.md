# Reemplazo de datos e imágenes

El sitio está publicado en `https://aiuto.com.mx` con **contenido de muestra**.
Este documento es el inventario de todo lo que falta sustituir, dónde vive y qué
formato necesita.

Para ver en cualquier momento qué sigue pendiente:

```bash
python3 tools/aplicar-datos.py --estado
```

---

## 1. Datos de contacto

Se sustituyen desde un solo lugar: llena `tools/datos.json` y ejecuta el script.
No hace falta editar las 9 páginas a mano.

| Dato | Valor de muestra actual | Dónde aparece |
| --- | --- | --- |
| Enlace de WhatsApp | `https://wa.me/525500000000` | 10 archivos (las 9 páginas + `404.html`) |
| WhatsApp visible | `+52 55 0000 0000` | `contacto.html` |
| Correo | `contacto@aiuto.mx` | `contacto.html` |
| Horario | `Lun a Vie · 9:00 a 18:00` | `contacto.html` |

> **Ojo con el correo.** El de muestra es `contacto@aiuto.mx` pero el dominio del
> sitio es `aiuto.com.mx`. Confirma cuál es el bueno antes de publicarlo.

> **Formato del WhatsApp.** `wa.me` no acepta `+`, espacios ni guiones. Para un
> móvil mexicano: `https://wa.me/52` + `1` + los 10 dígitos —
> ej. `https://wa.me/5215512345678`. Pruébalo en el navegador antes de subirlo:
> si el número está mal, WhatsApp abre una pantalla de error, no falla el sitio.

### Cómo aplicarlo

```bash
# 1. Edita los campos "reemplazar" de tools/datos.json (los vacíos se ignoran)
# 2. Simulacro: dice qué cambiaría, sin escribir nada
python3 tools/aplicar-datos.py

# 3. Escribir los cambios
python3 tools/aplicar-datos.py --aplicar

# 4. Revisar y subir
git diff sitio/
```

El script es idempotente: si lo corres dos veces, la segunda no hace nada. Puedes
ir llenando el JSON por partes.

---

## 2. Enlaces del footer

Nueve enlaces apuntan a `#` en las 10 páginas. Se resuelven con la sección
`enlaces` de `tools/datos.json`.

| Enlace | Qué hacer |
| --- | --- |
| LinkedIn · Instagram · Facebook · YouTube | Poner la URL real, o **borrar del footer** los perfiles que no existan. Un enlace muerto a una red social resta más de lo que suma. |
| Blog · Preguntas frecuentes · Casos de éxito | No existen esas páginas todavía. Mejor retirarlos del footer hasta que haya contenido que enlazar. |
| Aviso de privacidad · Términos y condiciones | **Estos sí hacen falta.** Ver abajo. |

### Aviso de privacidad

El formulario de contacto recoge nombre, correo, teléfono y empresa: son datos
personales, y en México la LFPDPPP obliga a poner un aviso de privacidad a
disposición de quien los entrega. Hoy ese enlace apunta a `#`.

Lo mínimo para quedar en regla:

1. Crear `sitio/aviso-de-privacidad.html` (copiar la estructura de
   `nosotros.html` y sustituir el contenido del `<main>`).
2. Añadir bajo el botón de envío del formulario en `contacto.html` una casilla o
   una línea de texto que remita al aviso.
3. Enlazarlo desde el footer y añadirlo a `sitemap.xml`.

No es algo que convenga redactar improvisando: el aviso debe decir quién es el
responsable, qué datos se recaban, para qué, con quién se comparten y cómo
ejercer los derechos ARCO. Si tienes asesoría legal, es su terreno.

---

## 3. Fotografía

Hoy hay cinco marcadores rayados. El CSS ya acepta imágenes reales: **basta con
cambiar el `<span class="mono">` por un `<img>` dentro del mismo `div.photo`.**
No se toca el layout, ni la posición, ni el recorte.

```html
<!-- antes -->
<div class="photo photo--a" style="left:34px;top:22px;width:396px;height:426px">
  <span class="mono">foto · profesionales recortados</span>
</div>

<!-- después -->
<div class="photo photo--a" style="left:34px;top:22px;width:396px;height:426px">
  <img src="assets/home-profesionales.jpg" alt="Dos consultoras revisando un tablero"
       width="1000" height="1000" fetchpriority="high">
</div>
```

El `div.photo` conserva el `clip-path` con la geometría del isotipo y el
`filter: grayscale(1)`, así que **puedes entregar las fotos a color**: el sitio
las pasa a blanco y negro solo. Si prefieres controlar tú el revelado, entrégalas
ya en B/N; se ve igual y pesan menos.

### Medidas reales de cada hueco

Medido en el sitio, en los cuatro breakpoints. El recuadro se recorta con
`object-fit: cover`, es decir: **la imagen se centra y se recorta por los bordes.**

| Archivo | Clase | 1440 | 1024 | 768 | 390 | Origen sugerido |
| --- | --- | --- | --- | --- | --- | --- |
| `index.html` | `.photo--a` | 396×426 | 396×426 | 396×426 | 390×300 | **1000×1000** |
| `nosotros.html` | `.photo--b` | 1144×360 | 960×360 | 704×360 | 350×360 | **2400×760** |
| `empresas.html` | `.photo--c` | 380×400 | 380×400 | 380×400 | 390×440 | **900×1000** |
| `talento.html` | `.photo--d` | 370×390 | 370×390 | 370×390 | 390×440 | **900×1000** |
| `contacto.html` | `.photo--d` | 300×430 | oculta | oculta | oculta | **700×1000** |

Notas que importan al encuadrar:

- **`nosotros.html` es el caso difícil.** Pasa de una banda muy ancha en
  escritorio (3.18:1) a casi un cuadrado en móvil (0.97:1). En móvil se ve
  únicamente la franja central: **lo importante tiene que estar al centro**, y
  todo lo que quede en los extremos desaparece en el teléfono.
- **`contacto.html` solo existe en escritorio** (se oculta por debajo de 1024 px),
  así que esa foto no necesita funcionar en vertical.
- En `index`, `empresas` y `talento` la proporción es estable (~0.9:1) salvo en
  móvil, donde `index` se vuelve horizontal. Deja aire alrededor del sujeto.
- El recorte del `clip-path` se come las esquinas: **no pongas caras ni texto
  cerca de los bordes superiores**, sobre todo en `.photo--a` y `.photo--d`, que
  cortan en punta arriba.

### Formato y peso

| Aspecto | Recomendación |
| --- | --- |
| Formato | JPEG calidad 80–85. WebP si quieres afinar, pero el ahorro aquí es marginal |
| Peso | ≤ 200 KB por imagen. Hoy el sitio completo pesa 57 KB — que las fotos no lo lleven a varios MB |
| Nombre | Descriptivo y sin acentos ni espacios: `home-profesionales.jpg`, `nosotros-equipo.jpg` |
| Ubicación | `sitio/assets/` |
| `alt` | Obligatorio y descriptivo. No "foto" ni "imagen": describe qué se ve |
| `loading` | `fetchpriority="high"` en la de `index.html` (es lo primero que se ve); `loading="lazy"` en las otras cuatro |

### Después de sustituirlas

```bash
python3 tools/aplicar-datos.py --estado   # ya no deben aparecer "foto pendiente"
```

Y revisa en el navegador a 1440 px y en un teléfono real: el recorte es lo único
que no se puede verificar sin ver la foto puesta.

---

## 4. Otros contenidos de muestra

| Qué | Dónde | Nota |
| --- | --- | --- |
| 7 vacantes | `bolsa.html` | Empresas, sueldos y ubicaciones inventados (Grupo Terra, Nexum Industrial, Alimentos Kai…). Cada vacante es un `div.job`; al añadir una, copia el bloque completo y actualiza `data-search` (texto en minúsculas que alimenta el buscador) y `data-state` (`new` / `open` / `applied` / `closed`) |
| Métricas del home | `index.html` | `+4,000`, `+100`, `+500`. Verifica que sean cifras defendibles antes de dejarlas |
| Dirección física | — | No hay ninguna en el sitio. Si AIUTO tiene oficina, va en `contacto.html` |

---

## 5. Formulario de contacto

**Este es el pendiente más urgente.** El formulario valida, muestra el panel de
éxito… y no envía nada: `main.js` simula el envío. Un mensaje escrito hoy desde
el sitio se pierde sin que nadie se entere.

Opciones, de menos a más trabajo:

| Opción | Cómo | Costo |
| --- | --- | --- |
| Servicio externo | Formspree, Basin o similar: se cambia el `<form>` por un `action` a su endpoint | Gratis hasta cierto volumen; los datos pasan por un tercero |
| PHP en el mismo hosting | Un `enviar.php` con `mail()` en `public_html/`. cPanel ya trae PHP y correo | Ninguno; hay que escribirlo y probar que no caiga en spam |
| CRM | Endpoint de HubSpot, Zoho o el CRM que usen | Depende del CRM |

Sea cual sea, hay que añadir **validación del lado del servidor**: la del
navegador se salta trivialmente. El honeypot (`_hp`) ya está puesto en el HTML;
el servidor debe descartar el envío si ese campo llega con contenido.

---

## 6. Analítica y Search Console

1. Dar de alta `https://aiuto.com.mx` en Google Search Console y enviar
   `https://aiuto.com.mx/sitemap.xml`.
2. Añadir el contenedor de analítica (GA4, Plausible, Umami) antes de `</head>`
   en las 9 páginas.
3. Si se usa analítica con cookies, el aviso de privacidad debe mencionarlo.

---

## 7. Orden sugerido

1. WhatsApp y correo reales — es lo que ya está a la vista del público.
2. Conectar el formulario — hoy se pierden los mensajes.
3. Aviso de privacidad — obligación legal desde que el formulario funciona.
4. Limpiar los enlaces `#` que no vayan a existir.
5. Fotografía.
6. Vacantes reales.
7. Analítica y Search Console.

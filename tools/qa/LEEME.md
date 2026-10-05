# Suites de QA

Pruebas de punta a punta contra una instancia en pie. No sustituyen a las
unitarias de `packages/core`: estas comprueban que las piezas armadas funcionan
donde de verdad corren.

## Cómo correrlas

Todas leen `BASE` del entorno. Sin ella apuntan a `http://localhost:3100`.

```sh
# Contra producción
BASE=https://aiuto-web-production.up.railway.app \
TAREAS_SECRET=<el secreto> \
node tools/qa/bolsa.mjs
```

Las que abren navegador necesitan Playwright y, en este WSL, las librerías
extraídas sin sudo (ver la nota de QA visual en la memoria del proyecto):

```sh
LD_LIBRARY_PATH=<dir>/usr/lib/x86_64-linux-gnu node tools/qa/panel.mjs
```

| Archivo | Qué cubre | Navegador |
| --- | --- | --- |
| `bolsa.mjs` | Listado, filtros, detalle, postulación, estado por liga | no |
| `formularios.mjs` | Asesoría, contacto, aviso de privacidad, cierre automático | no |
| `robustez.mjs` | Búsqueda, datos estructurados, sitemap, robots, 404, topes | no |
| `sueldos.mjs` | Rangos por categoría y páginas de empresa | no |
| `panel.mjs` | Entrar, capturar y publicar una vacante, permisos | sí |
| `candidato.mjs` | Registro, perfil, historial, postular sin cuenta | sí |
| `editar.mjs` | Editar vacante y el relleno de ejemplo de QA | sí |
| `perfil.mjs` | Lo que falta en el perfil y la barra de guardado | sí |
| `landing.mjs` | La landing estática escribiendo contra la API | sí |

## Dos cosas que hay que saber

**El pase del arnés.** Las rutas públicas que escriben tienen tope por IP.
Correr estas suites varias veces por hora desde la misma IP choca contra él, así
que mandan la cabecera `x-aiuto-pase` con el valor de `TAREAS_SECRET`. La
sección de `robustez.mjs` que comprueba el tope va SIN el pase a propósito: es la
única forma de verificar que el límite existe de verdad.

**Dejan rastro.** Crean postulaciones, solicitudes y alguna vacante. Hay que
retirarlas después; los correos de prueba usan `@ejemplo.mx`, `@qa.aiuto.test` o
prefijos como `nuevo.`, `lim.` y `pase.`, y la empresa de prueba del panel es
`aceros-del-pacifico`.

**La URL va en `BASE`, nunca escrita a mano.** Dos veces se me coló una suite con
`localhost` fijo que ignoraba el entorno, y reporté como verde contra producción
algo que estaba probando local. Si agregas una suite, que lea `process.env.BASE`.

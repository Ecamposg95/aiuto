# Plan de salida a producción — AIUTO

> **Para agentes:** SUB-SKILL REQUERIDA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**8 de octubre de 2026 · versión 1**

**Objetivo:** abrir la beta de AIUTO al público —bolsa, cuentas de candidato, panel del
equipo y landing— sin datos de prueba, con correo real, respaldos y una forma comprobada de
dar marcha atrás.

**Arquitectura:** no cambia nada de fondo. Una sola app Next.js 15 (`apps/web`), con la
lógica en `packages/core` y PostgreSQL 18 en Railway (proyecto **AIUTO**, workspace Atlas
Tech). La landing estática (`sitio/`) sigue en Hostinger. El plan cierra los huecos de
seguridad y operación que hoy impiden abrir, y define una puerta de salida automatizada
(`tools/qa/salida.mjs`) que tiene que pasar en verde antes de anunciar nada.

**Stack:** Next.js 15 · Auth.js 5 (credenciales, JWT) · Prisma 6 · PostgreSQL 18 · Vitest ·
Railway (despliegue con push a `main`, Dockerfile) · Resend · GitHub Actions · Hostinger
(landing y DNS).

**Spec:** `docs/mvp/2026-09-29-spec-fase1.md`. Guía de QA: `docs/mvp/QA.md`. Suites:
`tools/qa/LEEME.md`.

---

## Diagnóstico del 8 de octubre (lo que se encontró)

Revisado contra producción, la documentación y el código. Cada punto trae su evidencia.

| # | Hallazgo | Evidencia | Gravedad |
| --- | --- | --- | --- |
| H1 | **Cualquiera puede ver las postulaciones de otra persona.** `/mi` lista las postulaciones cuyo `correo` coincide con el de la cuenta, y el registro no verifica el correo. Basta con registrarse con el correo de la víctima. | `apps/web/app/mi/page.tsx:23` (`OR: [{ correo }, …]`); `registro/accion.ts` liga por correo sin verificar | **Bloqueante** (LFPDPPP) |
| H2 | No existe "olvidé mi contraseña". Un candidato que la pierde pierde su cuenta. | No hay ruta `/recuperar`; `VerificationToken` existe en el esquema pero no se usa | **Bloqueante** |
| H3 | `/entrar` y `/registro` no tienen tope: se puede probar contraseñas contra las cuentas del equipo sin límite. | `dentroDelLimite` solo se usa en `api/asesorias`, `api/postulaciones` y `api/solicitudes` | **Bloqueante** |
| H4 | Los datos de prueba están vivos en producción: la portada muestra vacantes `qa-*` y el `sitemap.xml` se las da a Google. | `curl …/sitemap.xml` → `/bolsa/qa-soldador-certificado`, etc. | **Bloqueante** |
| H5 | `--limpiar` del seed **no retira lo que dejan las suites**: correos `@ejemplo.mx`, `x@y.mx`, la empresa `aceros-del-pacifico`, ni postulaciones `@qa.aiuto.test` hechas a vacantes que no son `qa-`. | `seed-qa.ts:427-441` contra los correos de `tools/qa/*.mjs` | Alta |
| H6 | `MODO_QA=1` en producción. | `railway variables --service aiuto-web` | Alta |
| H7 | Sin proveedor de correo: ningún acuse ni cambio de estado sale. | Bitácora: `CORREO (sin proveedor configurado)`; falta `EMAIL_API_KEY` | **Bloqueante** |
| H8 | El aviso de privacidad tiene 14 marcas `[PENDIENTE]` y la leyenda de borrador. | `privacidad/page.tsx:14-86` | **Bloqueante** (legal) |
| H9 | Postgres **sin respaldos, sin PITR**, y el workspace **sin tope de gasto**. | `pitr status` → `"enabled": false`; `schedule list` → `[]`; `usageLimit: null` | **Bloqueante** |
| H10 | Hay un servicio huérfano `aiuto` (Railpack, mismo repo, rama `main`) en estado **Crashed**: se reconstruye y falla en cada push. | `railway service list`, `config pull --json` | Media |
| H11 | Railway despliega aunque CI falle (`checkSuites: false`). | `config pull --json` | Alta |
| H12 | El builder de `aiuto-web` en el panel es **RAILPACK**: lo que hoy fuerza el Dockerfile (y con él el `migrate deploy` del entrypoint) es `railway.json`, que **deja de funcionar el 1 de diciembre de 2026**. Si se migra mal, el siguiente despliegue se construye sin Dockerfile y sin migraciones. | `config pull --json` → `"builder": "RAILPACK"`; `config migrate` deja `builder` comentado | **Bloqueante antes del 1/dic** |
| H13 | Sin cabeceras de seguridad (HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`). Las ligas `/postulacion/<token>` pueden salir en el `Referer` hacia sitios externos. | `curl -sI` a la portada | Alta |
| H14 | La landing publicada es una versión vieja: `main.js` y `bolsa.html` no coinciden con el repo (el formulario sigue simulando). | `diff` contra `https://aiuto.com.mx/main.js` | **Bloqueante** |
| H15 | La landing tiene 18 pendientes de contenido (WhatsApp de muestra, 9 enlaces `#`, 5 fotos). | `python3 tools/aplicar-datos.py --estado` | Alta (WhatsApp/correo/aviso), Baja (fotos) |
| H16 | Nadie se entera si la app se cae: no hay monitoreo externo. | No existe | Media |

**Lo que sí está bien y no se toca:** `/api/salud` verifica la base; el cierre automático
corre a diario y en verde (`gh run list`); CI corre typecheck, pruebas y build; el
Dockerfile es portable; el CORS de las rutas públicas está acotado a `aiuto.com.mx`.

**No se pudo revisar:** el contenido real de la base de producción (conteos por tabla). El
modo automático bloqueó la consulta de solo lectura. La tarea 13 la hace con autorización
explícita.

---

## Global Constraints

- Idioma de la interfaz, los correos, los comentarios y los commits: **español de México**.
  Los commits van en tercera persona y en presente ("Agrega…", "Corrige…"), como el historial.
- Los campos de transparencia de la vacante **no se relajan** en ningún modo.
- **Enviar correo nunca rompe el flujo** (`apps/web/lib/correo.ts`): una falla del proveedor se
  registra, no se propaga.
- Toda suite de `tools/qa/` lee la URL de `process.env.BASE`. **Nunca** se escribe una URL a mano.
- Migraciones: `migrate dev` solo en local y `migrate deploy` fuera de local. Nunca al revés.
- Producción se despliega **solo con push a `main`**. `railway up` no es el camino.
- Una sola réplica de `aiuto-web` mientras el limitador viva en memoria (`lib/limite.ts`).
- Ninguna operación destructiva sobre la base de producción sin un respaldo manual tomado
  **en la misma sesión** y verificado en la lista de respaldos.
- Por debajo de 3 vacantes en una categoría, `/sueldos` no publica cifra.
- Contraseña mínima: 8 caracteres, sin reglas de composición (`lib/esquemas.ts:31-33`).
- Los secretos no se commitean ni se pegan en el chat: se capturan directo en Railway o en
  GitHub.

## Review Focus

Entradas y condiciones que la spec da por hechas y que ninguna prueba ejercita hoy. Cada línea
tiene su prueba en la tarea que es dueña del código.

1. **Alguien se registra con un correo que no es suyo** → no ve ni una postulación hecha con
   ese correo hasta verificarlo. *(Tarea 6, paso 1.)*
2. **Una liga de recuperación o verificación se usa dos veces, vencida o alterada** → la
   segunda vez falla con un mensaje claro y la contraseña no cambia. *(Tareas 4 y 5.)*
3. **Pedir recuperación de un correo que no existe** → misma respuesta, mismo tiempo de
   respuesta aproximado y ningún correo: no se revela quién tiene cuenta. *(Tarea 5.)*
4. **Ráfaga de intentos de entrar desde una IP** → a partir del intento 11 en 15 minutos, la
   respuesta es "demasiados intentos" incluso con la contraseña correcta. *(Tarea 3.)*
5. **Quedan restos de QA después de limpiar** (un correo `@ejemplo.mx`, una empresa de prueba
   sin el prefijo `qa-`) → `--revisar` los cuenta y la puerta de salida falla. *(Tareas 7 y 1.)*

---

## Fase 0 — Insumos que solo puede dar el equipo AIUTO

Sin estos datos no se puede abrir. No son código: se piden ya y en paralelo con la Fase A.
Cada uno indica qué tarea desbloquea.

| ID | Qué se necesita | Quién | Desbloquea |
| --- | --- | --- | --- |
| D1 | Domicilio del responsable de los datos personales (para el aviso) | Dirección (Damián Medina) | Tarea 8 |
| D2 | Correo para derechos ARCO y para contacto (confirmar `contacto@aiuto.com.mx`; el buzón está en Hostinger) | Dirección | Tareas 8 y 14 |
| D3 | Revisión legal del texto del aviso de privacidad | Quien tenga la responsabilidad legal | Tarea 8 |
| D4 | Número de WhatsApp real (formato `https://wa.me/521XXXXXXXXXX`) y horario | Dirección | Tarea 14 |
| D5 | Qué enlaces del footer existen (redes, blog, FAQ, casos). **Los que no existan se quitan, no se dejan en `#`.** | Dirección | Tarea 14 |
| D6 | Correo y nombre de las 3 personas del equipo y el rol de cada una (`admin`/`operador`) | Dirección | Tarea 13 |
| D7 | Tope de gasto mensual en Railway (aviso suave y límite duro, en dólares enteros) | Quien paga Atlas Tech | Tarea 11 |
| D8 | Acceso a la cuenta de Resend (o permiso para crearla con `contacto@aiuto.com.mx`) y al panel DNS de Hostinger | Dirección / Atlas Tech | Tarea 12 |
| D9 | Las primeras vacantes **reales** (mínimo 3 por categoría que quiera mostrar sueldo) | Operación | Tarea 16 |
| D10 | Acuerdo escrito de propiedad y mantenimiento del código con Atlas Tech (riesgo §13 de la spec) | Dirección + Atlas Tech | Recomendado antes de la Tarea 16 |

---

## Mapa de archivos

| Archivo | Responsabilidad | Tarea |
| --- | --- | --- |
| `tools/qa/salida.mjs` (nuevo) | Puerta de salida: comprueba que producción está lista para abrir | 1 |
| `apps/web/next.config.mjs` | Cabeceras de seguridad | 2 |
| `apps/web/lib/limite.ts` | `origenDeCabeceras()` para usar el tope desde acciones de servidor | 3 |
| `apps/web/app/(publico)/entrar/accion.ts`, `registro/accion.ts` | Tope por IP | 3 |
| `packages/core/src/fichas.ts` (nuevo) + `test/fichas.test.ts` | Fichas de un solo uso: generar, huella, vigencia | 4 |
| `packages/core/src/correos.ts` + `test/correos.test.ts` | Correos de recuperación y verificación | 4 |
| `apps/web/lib/fichas.ts` (nuevo) | Emitir y consumir fichas contra `VerificationToken` | 5 |
| `apps/web/app/(publico)/recuperar/**` (nuevo) | Pedir y usar la liga de recuperación | 5 |
| `apps/web/app/(publico)/verificar/[ficha]/page.tsx` (nuevo) | Verificar el correo y ligar postulaciones | 6 |
| `apps/web/app/mi/page.tsx`, `registro/accion.ts` | Solo mostrar postulaciones por correo si está verificado | 6 |
| `packages/db/prisma/seed-qa.ts` | `--revisar` y limpieza que cubre lo que dejan las suites | 7 |
| `apps/web/app/(publico)/privacidad/page.tsx` | Aviso sin pendientes | 8 |
| `.github/workflows/vigilar.yml` (nuevo) | Monitoreo externo de `/api/salud` | 9 |
| `.railway/railway.ts` (nuevo), `railway.json` (se retira) | Configuración de Railway como código | 10 |
| `docs/mvp/OPERACION.md` (nuevo) | Manual de operación: respaldos, reversa, secretos, contactos | 15 |

---

## Fase A — Código (repo)

Todas las tareas de código se hacen en una rama `salida-produccion` y se integran a `main` al
cerrar la Fase A, **con CI en verde** (después de la tarea 11, Railway esperará ese verde).

Para levantar local: `pnpm db:up && pnpm db:deploy && pnpm db:seed && pnpm db:seed:qa`, y
después `pnpm dev` (puerto 3000) o `PORT=3100 pnpm start` tras `pnpm build`, que es el puerto
por defecto de las suites.

### Tarea 1: Puerta de salida automatizada

Es la "prueba que falla" de todo el plan: hoy debe salir en rojo contra producción, y el día de
la salida tiene que salir en verde.

**Archivos:**
- Crear: `tools/qa/salida.mjs`
- Modificar: `tools/qa/LEEME.md` (agregar la fila de la tabla)

**Interfaces:**
- Consume: `BASE` (la app) y `LANDING` (por defecto `https://aiuto.com.mx`) del entorno.
- Produce: código de salida `0` si todo pasa y `1` si algo falla. Lo usan las tareas 16 y 9.

- [ ] **Paso 1: Escribir la suite**

```js
// Puerta de salida: lo que tiene que ser cierto antes de abrir la beta.
// No escribe nada. Se puede correr cuantas veces haga falta.
import { readFile } from 'node:fs/promises'

const B = process.env.BASE ?? 'http://localhost:3100'
const L = process.env.LANDING ?? 'https://aiuto.com.mx'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }
const txt = async (r) => (await r.text())

// --- la app responde y alcanza la base ---
const salud = await fetch(`${B}/api/salud`)
ok(salud.status === 200 && (await salud.json()).base === 'ok', 'salud: app y base arriba')

// --- sin datos de prueba a la vista ---
const portada = await txt(await fetch(`${B}/`))
ok(!/\/bolsa\/qa-/.test(portada), 'la portada no muestra vacantes de QA')
const bolsa = await txt(await fetch(`${B}/bolsa`))
ok(!/\/bolsa\/qa-/.test(bolsa), 'la bolsa no muestra vacantes de QA')
ok(!/aceros-del-pacifico/.test(bolsa), 'ni la empresa de prueba del panel')
const sm = await txt(await fetch(`${B}/sitemap.xml`))
ok(!/\/(bolsa|empresa)\/qa-/.test(sm), 'el sitemap no le da a Google nada de QA')
ok(!/aceros-del-pacifico/.test(sm), 'ni la empresa de prueba')
const qa = await fetch(`${B}/bolsa/qa-ingeniera-plataforma`)
ok(qa.status === 404, 'el detalle de una vacante de QA ya no existe', String(qa.status))

// --- aviso de privacidad completo ---
const aviso = await txt(await fetch(`${B}/privacidad`))
ok(!aviso.includes('[PENDIENTE]'), 'el aviso no tiene pendientes')
ok(!/Borrador pendiente de revisi/.test(aviso), 'ni la leyenda de borrador')

// --- cabeceras de seguridad ---
const h = (await fetch(`${B}/`)).headers
ok(/max-age=\d{7,}/.test(h.get('strict-transport-security') ?? ''), 'HSTS')
ok(h.get('x-content-type-options') === 'nosniff', 'nosniff')
ok(h.get('x-frame-options') === 'DENY', 'no se deja enmarcar')
ok(h.get('referrer-policy') === 'strict-origin-when-cross-origin', 'el Referer no saca ligas privadas')

// --- recuperación de contraseña existe ---
ok((await fetch(`${B}/recuperar`)).status === 200, 'hay página para recuperar la contraseña')

// --- la landing publicada es la del repo ---
for (const f of ['main.js', 'bolsa.html', 'contacto.html']) {
  const publicado = await txt(await fetch(`${L}/${f}`))
  const local = await readFile(new URL(`../../sitio/${f}`, import.meta.url), 'utf8')
  ok(publicado.trim() === local.trim(), `landing: ${f} es la versión del repo`)
}
const contacto = await txt(await fetch(`${L}/contacto.html`))
ok(!contacto.includes('525500000000'), 'landing: sin WhatsApp de muestra')
ok(!contacto.includes('contacto@aiuto.mx'), 'landing: sin correo de muestra')
ok(!/href="#"/.test(contacto), 'landing: ningún enlace del footer en #')

// --- la landing puede escribir contra la app ---
const pre = await fetch(`${B}/api/solicitudes`, {
  method: 'OPTIONS',
  headers: { Origin: L, 'Access-Control-Request-Method': 'POST' },
})
ok(pre.headers.get('access-control-allow-origin') === L, 'CORS abierto para la landing')

console.log(fallos ? `\n${fallos} falla(s): NO se abre.` : '\nTodo en verde: se puede abrir.')
process.exit(fallos ? 1 : 0)
```

- [ ] **Paso 2: Correrla contra producción y confirmar que falla**

Run: `BASE=https://aiuto-web-production.up.railway.app node tools/qa/salida.mjs`
Expected: `FALLA` en vacantes de QA, sitemap, aviso, cabeceras, `/recuperar` y landing.
Termina con `N falla(s): NO se abre.` y código de salida 1.

- [ ] **Paso 3: Agregar la fila a `tools/qa/LEEME.md`**

```markdown
| `salida.mjs` | Puerta de salida: sin QA a la vista, aviso completo, cabeceras, landing al día | no |
```

- [ ] **Paso 4: Commit**

```bash
git add tools/qa/salida.mjs tools/qa/LEEME.md
git commit -m "Agrega la puerta de salida a produccion"
```

### Tarea 2: Cabeceras de seguridad

**Archivos:**
- Modificar: `apps/web/next.config.mjs`

**Interfaces:**
- Produce: las cabeceras que revisa `salida.mjs` (tarea 1).

- [ ] **Paso 1: Confirmar que fallan en local**

Run: `pnpm build && PORT=3100 pnpm start` (en otra terminal) y después
`curl -sI http://localhost:3100/ | grep -iE "strict-transport|nosniff|x-frame|referrer"`
Expected: sin salida.

- [ ] **Paso 2: Agregar `headers()` a `nextConfig`**, debajo de `outputFileTracingIncludes`:

```js
  // Cabeceras para todas las respuestas. Referrer-Policy importa más de lo que
  // parece: las ligas /postulacion/<token> son secretas y, sin ella, viajarían
  // completas en el Referer hacia cualquier sitio externo que se enlace.
  // No se pone CSP todavía: Next mete scripts en línea y una CSP a medias rompe
  // la página sin proteger nada.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
```

- [ ] **Paso 3: Reconstruir y verificar**

Run: `pnpm build && PORT=3100 pnpm start`, y después el mismo `curl` del paso 1.
Expected: aparecen las cuatro cabeceras. Además, `BASE=http://localhost:3100 node tools/qa/robustez.mjs`
sigue en verde: el CORS de la landing no debe verse afectado.

- [ ] **Paso 4: Commit**

```bash
git add apps/web/next.config.mjs
git commit -m "Agrega cabeceras de seguridad a todas las respuestas"
```

### Tarea 3: Tope de intentos en entrar y registro

**Archivos:**
- Modificar: `apps/web/lib/limite.ts`
- Modificar: `apps/web/app/(publico)/entrar/accion.ts`
- Modificar: `apps/web/app/(publico)/registro/accion.ts`
- Modificar: `tools/qa/robustez.mjs` (sección nueva al final, antes del resumen)

**Interfaces:**
- Produce: `origenDeCabeceras(h: Headers): string` y `traeElPaseEn(h: Headers): boolean` en
  `lib/limite.ts`. La tarea 5 los usa con la misma firma.
- Produce: `dentroDelLimite(clave, opciones, peticion?)` se conserva. Se agrega el parámetro
  opcional `pase?: boolean` como cuarto argumento, para las acciones de servidor, que no tienen
  un `Request`.

- [ ] **Paso 1: Escribir la prueba que falla** (al final de `tools/qa/robustez.mjs`, **sin** el pase)

```js
// --- tope en entrar: once intentos seguidos desde la misma IP ---
// Va SIN el pase a propósito: es la única forma de saber que el tope existe.
{
  const { chromium } = await import('playwright')
  const nav = await chromium.launch()
  const p = await nav.newPage()
  let bloqueado = false
  for (let i = 0; i < 11; i++) {
    await p.goto(`${B}/entrar`)
    await p.fill('input[name=email]', `fuerza.${i}@qa.aiuto.test`)
    await p.fill('input[name=password]', 'equivocada123')
    await p.click('button[type=submit]')
    await p.waitForSelector('[role=alert]')
    if (/Demasiados intentos/.test(await p.textContent('[role=alert]'))) bloqueado = true
  }
  ok(bloqueado, 'entrar: a los once intentos se corta')
  await nav.close()
}
```

- [ ] **Paso 2: Correrla y verificar que falla**

Run: `BASE=http://localhost:3100 LD_LIBRARY_PATH=<libs> node tools/qa/robustez.mjs`
Expected: `FALLA entrar: a los once intentos se corta`.

- [ ] **Paso 3: Implementar en `lib/limite.ts`**

Reemplazar `traeElPase` y `origenDe` por versiones que trabajan sobre `Headers`, y conservar
los nombres que ya usan las rutas:

```ts
/** El pase del arnés, leído de cualquier conjunto de cabeceras. */
export function traeElPaseEn(h: Headers): boolean {
  const secreto = process.env.TAREAS_SECRET
  if (!secreto) return false
  return h.get('x-aiuto-pase') === secreto
}

function traeElPase(peticion: Request): boolean {
  return traeElPaseEn(peticion.headers)
}
```

En `dentroDelLimite`, agregar el cuarto parámetro y la condición:

```ts
export function dentroDelLimite(
  clave: string,
  opciones: { maximo: number; ventanaSegundos: number },
  peticion?: Request,
  pase = false,
): ResultadoLimite {
  if (pase || (peticion && traeElPase(peticion))) {
    return { permitido: true, restantes: opciones.maximo, esperaSegundos: 0 }
  }
```

Y separar el origen:

```ts
/** De dónde viene, a partir de las cabeceras. Las acciones de servidor no tienen Request. */
export function origenDeCabeceras(h: Headers): string {
  const reenviada = h.get('x-forwarded-for')
  return reenviada?.split(',')[0]?.trim() || h.get('x-real-ip') || 'desconocido'
}

export function origenDe(peticion: Request): string {
  return origenDeCabeceras(peticion.headers)
}
```

- [ ] **Paso 4: Aplicarlo en `entrar/accion.ts`**, al principio de `acceder`, después de calcular `intento`:

```ts
  // Diez intentos cada quince minutos por IP. Sin esto, las cuentas del equipo
  // —que abren el panel con todos los datos personales— se pueden atacar a fuerza
  // bruta sin que nada lo frene.
  const h = await headers()
  const tope = dentroDelLimite(
    `entrar:${origenDeCabeceras(h)}`,
    { maximo: 10, ventanaSegundos: 15 * 60 },
    undefined,
    traeElPaseEn(h),
  )
  if (!tope.permitido) {
    return { error: `Demasiados intentos. Espera ${Math.ceil(tope.esperaSegundos / 60)} minutos.`, intento }
  }
```

Con estos imports:

```ts
import { headers } from 'next/headers'
import { dentroDelLimite, origenDeCabeceras, traeElPaseEn } from '@/lib/limite'
```

- [ ] **Paso 5: Aplicarlo en `registro/accion.ts`**, igual pero con clave `registro:` y `{ maximo: 5, ventanaSegundos: 60 * 60 }`.
  Si no está permitido, devolver `{ valores, intento, error: 'Demasiados registros desde esta conexión. Inténtalo más tarde.' }`.

- [ ] **Paso 6: Reconstruir, correr la suite y verificar que pasa**

Run: `pnpm build && PORT=3100 pnpm start`; luego `BASE=http://localhost:3100 TAREAS_SECRET=<local> LD_LIBRARY_PATH=<libs> node tools/qa/robustez.mjs`
y `node tools/qa/panel.mjs`, `node tools/qa/candidato.mjs` (las dos llevan el pase).
Expected: `ok entrar: a los once intentos se corta`, y `panel` y `candidato` siguen en verde.
Si `panel`/`candidato` chocan con el tope, es que no mandan la cabecera `x-aiuto-pase` en
`page.setExtraHTTPHeaders`. Hay que agregarla ahí, no subir el tope.

- [ ] **Paso 7: `pnpm -r typecheck` en verde y commit**

```bash
git add apps/web/lib/limite.ts "apps/web/app/(publico)/entrar/accion.ts" "apps/web/app/(publico)/registro/accion.ts" tools/qa/robustez.mjs
git commit -m "Pone tope de intentos a entrar y registrarse"
```

### Tarea 4: Fichas de un solo uso y sus correos (core)

**Archivos:**
- Crear: `packages/core/src/fichas.ts`
- Crear: `packages/core/test/fichas.test.ts`
- Modificar: `packages/core/src/correos.ts`, `packages/core/test/correos.test.ts`
- Modificar: `packages/core/src/index.ts`, `packages/core/package.json` (agregar `@types/node` como devDependency, misma versión que `packages/db`: `^22.10.7`)

**Interfaces:**
- Produce (en `@aiuto/core`):
  - `type Proposito = 'restablecer' | 'verificar'`
  - `VIGENCIA_MINUTOS: Record<Proposito, number>` → `restablecer: 60` y `verificar: 4320` (3 días)
  - `identificador(proposito: Proposito, correo: string): string` → `"restablecer:ana@x.mx"`
  - `correoDe(proposito: Proposito, identifier: string): string | null`
  - `huellaDe(ficha: string): string` → sha256 en hex
  - `nuevaFicha(proposito: Proposito, ahora?: Date): { ficha: string; huella: string; expira: Date }`
  - `vigente(expira: Date, ahora?: Date): boolean`
  - `correoRestablecer(datos: { nombre?: string | null; liga: string }): Correo`
  - `correoVerificar(datos: { nombre: string; liga: string }): Correo`

En la base se guarda **la huella, nunca la ficha**: quien lea una copia de la base no puede
usar ligas pendientes.

- [ ] **Paso 1: Escribir las pruebas que fallan** — `packages/core/test/fichas.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { nuevaFicha, huellaDe, vigente, identificador, correoDe, VIGENCIA_MINUTOS } from '../src/fichas.js'

const AHORA = new Date('2026-10-08T12:00:00Z')

describe('fichas de un solo uso', () => {
  it('la huella es la del valor entregado, no el valor', () => {
    const f = nuevaFicha('restablecer', AHORA)
    expect(f.huella).toBe(huellaDe(f.ficha))
    expect(f.huella).not.toContain(f.ficha)
  })

  it('cada ficha es distinta y suficientemente larga para no adivinarse', () => {
    const a = nuevaFicha('verificar', AHORA)
    const b = nuevaFicha('verificar', AHORA)
    expect(a.ficha).not.toBe(b.ficha)
    expect(a.ficha.length).toBeGreaterThanOrEqual(43) // 32 bytes en base64url
  })

  it('restablecer vence en una hora; verificar, en tres días', () => {
    expect(nuevaFicha('restablecer', AHORA).expira.toISOString()).toBe('2026-10-08T13:00:00.000Z')
    expect(VIGENCIA_MINUTOS.verificar).toBe(4320)
  })

  it('vencida en el minuto exacto, no un minuto después', () => {
    const { expira } = nuevaFicha('restablecer', AHORA)
    expect(vigente(expira, new Date('2026-10-08T12:59:59Z'))).toBe(true)
    expect(vigente(expira, new Date('2026-10-08T13:00:00Z'))).toBe(false)
  })

  it('el identificador separa propósitos y normaliza el correo', () => {
    expect(identificador('restablecer', '  Ana@X.mx ')).toBe('restablecer:ana@x.mx')
    expect(correoDe('restablecer', 'restablecer:ana@x.mx')).toBe('ana@x.mx')
  })

  it('una ficha de verificar no sirve para restablecer', () => {
    expect(correoDe('restablecer', 'verificar:ana@x.mx')).toBeNull()
  })
})
```

Y al final de `packages/core/test/correos.test.ts`:

```ts
describe('recuperar la contraseña', () => {
  const liga = 'https://aiuto-web-production.up.railway.app/recuperar/abc'
  const c = correoRestablecer({ nombre: 'Ana', liga })

  it('trae la liga en las dos versiones', () => {
    expect(c.texto).toContain(liga)
    expect(c.html).toContain(liga)
  })

  it('dice cuánto dura y qué hacer si no lo pidió', () => {
    expect(c.texto).toContain('una hora')
    expect(c.texto).toMatch(/no lo pediste/i)
  })

  it('funciona sin nombre', () => {
    expect(correoRestablecer({ liga }).texto.startsWith('Hola,')).toBe(true)
  })
})

describe('verificar el correo', () => {
  const c = correoVerificar({ nombre: 'Ana', liga: 'https://x/verificar/abc' })

  it('explica para qué sirve verificar', () => {
    expect(c.texto).toMatch(/postulaciones/)
  })
})
```

(Agregar `correoRestablecer` y `correoVerificar` al `import` del archivo.)

- [ ] **Paso 2: Verificar que fallan**

Run: `pnpm --filter @aiuto/core test`
Expected: FAIL, con "Failed to resolve import ../src/fichas.js" y "correoRestablecer is not a function".

- [ ] **Paso 3: Implementar `packages/core/src/fichas.ts`**

```ts
import { createHash, randomBytes } from 'node:crypto'

/**
 * Fichas de un solo uso para las ligas que llegan por correo.
 *
 * En la base se guarda la huella, nunca la ficha. Quien consiga una copia de
 * la base —un respaldo filtrado, una consulta de más— no puede usar las ligas
 * que siguen pendientes, porque de la huella no se regresa a la ficha.
 */

export type Proposito = 'restablecer' | 'verificar'

export const VIGENCIA_MINUTOS: Record<Proposito, number> = {
  // Corta: quien pide recuperar está frente a la pantalla esperando el correo.
  restablecer: 60,
  // Larga: verificar no corre prisa y la gente revisa el correo cuando puede.
  verificar: 60 * 24 * 3,
}

export function identificador(proposito: Proposito, correo: string): string {
  return `${proposito}:${correo.trim().toLowerCase()}`
}

/** El correo detrás de un identificador, sólo si es del propósito pedido. */
export function correoDe(proposito: Proposito, identifier: string): string | null {
  const prefijo = `${proposito}:`
  return identifier.startsWith(prefijo) ? identifier.slice(prefijo.length) : null
}

export function huellaDe(ficha: string): string {
  return createHash('sha256').update(ficha).digest('hex')
}

export function nuevaFicha(proposito: Proposito, ahora: Date = new Date()) {
  const ficha = randomBytes(32).toString('base64url')
  return {
    ficha,
    huella: huellaDe(ficha),
    expira: new Date(ahora.getTime() + VIGENCIA_MINUTOS[proposito] * 60_000),
  }
}

export function vigente(expira: Date, ahora: Date = new Date()): boolean {
  return expira.getTime() > ahora.getTime()
}
```

Agregar `export * from './fichas.js'` a `packages/core/src/index.ts`, y
`"@types/node": "^22.10.7"` a `devDependencies` de `packages/core/package.json`, y luego
`pnpm install`.

- [ ] **Paso 4: Implementar los dos correos** en `packages/core/src/correos.ts`, después de `correoAcuseSolicitud`:

```ts
export function correoRestablecer(datos: { nombre?: string | null; liga: string }): Correo {
  return armar({
    asunto: 'Cambia tu contraseña · AIUTO',
    saludo: datos.nombre ? `Hola, ${datos.nombre}` : 'Hola',
    parrafos: [
      'Alguien pidió cambiar la contraseña de tu cuenta en AIUTO. Si fuiste tú, usa esta liga. Sirve una sola vez y dura una hora.',
    ],
    liga: { texto: 'Elegir una contraseña nueva', url: datos.liga },
    cierre: 'Si no lo pediste, ignora este correo: tu contraseña sigue igual.',
  })
}

export function correoVerificar(datos: { nombre: string; liga: string }): Correo {
  return armar({
    asunto: 'Confirma tu correo · AIUTO',
    saludo: `Hola, ${datos.nombre}`,
    parrafos: [
      'Confirma que este correo es tuyo. En cuanto lo hagas, verás en tu cuenta las postulaciones que hayas hecho con él, también las de antes de registrarte.',
    ],
    liga: { texto: 'Confirmar mi correo', url: datos.liga },
    cierre: 'Si no creaste una cuenta en AIUTO, ignora este correo.',
  })
}
```

Ojo: `armar` antepone `${saludo},` en el texto. Con `saludo: 'Hola'` el texto empieza
`Hola,`, que es lo que pide la prueba.

- [ ] **Paso 5: Verificar que pasan**

Run: `pnpm --filter @aiuto/core test && pnpm -r typecheck`
Expected: PASS, todas, incluidas las previas.

- [ ] **Paso 6: Commit**

```bash
git add packages/core pnpm-lock.yaml
git commit -m "Agrega fichas de un solo uso y los correos de recuperar y verificar"
```

### Tarea 5: Recuperar la contraseña

**Archivos:**
- Crear: `apps/web/lib/fichas.ts`
- Crear: `apps/web/app/(publico)/recuperar/page.tsx`, `recuperar/FormaPedir.tsx`, `recuperar/accion.ts`
- Crear: `apps/web/app/(publico)/recuperar/[ficha]/page.tsx`, `recuperar/[ficha]/FormaNueva.tsx`
- Modificar: `apps/web/app/(publico)/entrar/page.tsx` (liga "¿Olvidaste tu contraseña?")
- Modificar: `apps/web/app/robots.ts`: `Disallow: /recuperar` y `Disallow: /verificar`
- Crear: `tools/qa/recuperar.mjs`

**Interfaces:**
- Consume: todo lo de la tarea 4; `origenDeCabeceras` y `traeElPaseEn` de la tarea 3; `enviarCorreo` de `lib/correo.ts`.
- Produce (en `lib/fichas.ts`):
  - `emitirFicha(proposito: Proposito, correo: string): Promise<string>` → devuelve la ficha en claro (para la liga). Borra antes cualquier ficha previa del mismo identificador.
  - `consumirFicha(proposito: Proposito, ficha: string): Promise<string | null>` → devuelve el correo si la ficha existe, es del propósito y está vigente. **La borra siempre que la encuentra**, aunque esté vencida.

- [ ] **Paso 1: Escribir la suite que falla** — `tools/qa/recuperar.mjs`

La suite necesita leer la liga del correo. Sin proveedor configurado, el correo sale en la
bitácora; local se lee de la salida del servidor. Para no depender de eso, la suite arranca el
flujo, toma la ficha de la base con Prisma (solo contra local) y usa la página.

```js
// Recuperar la contraseña. Corre SOLO contra local: lee la base directamente.
import { PrismaClient } from '../../packages/db/generated/client/index.js'
import { chromium } from 'playwright'

const B = process.env.BASE ?? 'http://localhost:3100'
if (!/localhost|127\.0\.0\.1/.test(B)) { console.error('Esta suite sólo corre contra local.'); process.exit(1) }

const PASE = process.env.TAREAS_SECRET ?? ''
const db = new PrismaClient()
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }

const nav = await chromium.launch()
const p = await nav.newPage()
await p.setExtraHTTPHeaders({ 'x-aiuto-pase': PASE })

// 1. Un correo que no existe recibe la misma respuesta que uno que sí
await p.goto(`${B}/recuperar`)
await p.fill('input[name=correo]', 'nadie.aqui@qa.aiuto.test')
await p.click('button[type=submit]')
const inexistente = await p.textContent('[role=status]')
await p.goto(`${B}/recuperar`)
await p.fill('input[name=correo]', 'candidato@qa.aiuto.test')
await p.click('button[type=submit]')
const existente = await p.textContent('[role=status]')
ok(inexistente === existente, 'la respuesta no delata quién tiene cuenta')
ok((await db.verificationToken.count({ where: { identifier: 'restablecer:nadie.aqui@qa.aiuto.test' } })) === 0,
  'y al correo inexistente no se le emite ficha')

// 2. La huella está en la base; la ficha en claro, no
const fila = await db.verificationToken.findFirst({ where: { identifier: 'restablecer:candidato@qa.aiuto.test' } })
ok(Boolean(fila) && /^[0-9a-f]{64}$/.test(fila.token), 'en la base sólo queda la huella')

// 3. Una ficha alterada no sirve
await p.goto(`${B}/recuperar/estonoesunaficha`)
ok(/no sirve|venci/i.test(await p.textContent('main')), 'una liga inventada se rechaza')

// La ficha en claro no se puede leer de la base (es la idea). Se emite una nueva
// con la misma receta que packages/core/src/fichas.ts: 32 bytes en base64url y
// su sha256 en hex como huella. Si la receta cambia allá, esta línea cambia aquí.
const { randomBytes, createHash } = await import('node:crypto')
const ficha = randomBytes(32).toString('base64url')
const f = { ficha, huella: createHash('sha256').update(ficha).digest('hex'), expira: new Date(Date.now() + 3600_000) }
await db.verificationToken.deleteMany({ where: { identifier: 'restablecer:candidato@qa.aiuto.test' } })
await db.verificationToken.create({ data: { identifier: 'restablecer:candidato@qa.aiuto.test', token: f.huella, expires: f.expira } })

// 4. Con la liga buena se cambia, y la contraseña nueva entra
await p.goto(`${B}/recuperar/${f.ficha}`)
await p.fill('input[name=password]', 'nueva-clave-segura')
await p.click('button[type=submit]')
await p.waitForURL(/\/entrar/)
await p.fill('input[name=email]', 'candidato@qa.aiuto.test')
await p.fill('input[name=password]', 'nueva-clave-segura')
await p.click('button[type=submit]')
await p.waitForURL(/\/mi/)
ok(true, 'la contraseña nueva sirve para entrar')

// 5. La misma liga no sirve dos veces
const otra = await nav.newPage()
await otra.goto(`${B}/recuperar/${f.ficha}`)
ok(/no sirve|venci/i.test(await otra.textContent('main')), 'la liga no se puede usar dos veces')

await nav.close()
await db.$disconnect()
console.log(fallos ? `\n${fallos} falla(s)` : '\nTodo en verde')
process.exit(fallos ? 1 : 0)
```

Después de correrla hay que volver a sembrar (`pnpm db:seed:qa`) para que `candidato@` recupere
`aiuto123`.

- [ ] **Paso 2: Correrla y verificar que falla**

Run: `BASE=http://localhost:3100 TAREAS_SECRET=<local> DATABASE_URL=<local> LD_LIBRARY_PATH=<libs> node tools/qa/recuperar.mjs`
Expected: falla en el paso 1, porque `/recuperar` da 404.

- [ ] **Paso 3: Implementar `apps/web/lib/fichas.ts`**

```ts
import { prisma } from '@aiuto/db'
import { nuevaFicha, huellaDe, vigente, identificador, correoDe, type Proposito } from '@aiuto/core'

/** Emite una ficha nueva y anula las anteriores del mismo correo y propósito. */
export async function emitirFicha(proposito: Proposito, correo: string): Promise<string> {
  const id = identificador(proposito, correo)
  const f = nuevaFicha(proposito)
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: id } }),
    prisma.verificationToken.create({ data: { identifier: id, token: f.huella, expires: f.expira } }),
  ])
  return f.ficha
}

/**
 * Devuelve el correo si la ficha sirve. La borra siempre que la encuentra,
 * vencida o no: una liga se usa una vez, y una vencida no tiene por qué seguir
 * en la base.
 */
export async function consumirFicha(proposito: Proposito, ficha: string): Promise<string | null> {
  const fila = await prisma.verificationToken.findUnique({ where: { token: huellaDe(ficha) } })
  if (!fila) return null
  await prisma.verificationToken.delete({ where: { token: fila.token } })
  if (!vigente(fila.expires)) return null
  return correoDe(proposito, fila.identifier)
}

/** ¿Existe la ficha y sigue vigente? No la consume: sirve para pintar el formulario. */
export async function fichaValida(proposito: Proposito, ficha: string): Promise<boolean> {
  const fila = await prisma.verificationToken.findUnique({ where: { token: huellaDe(ficha) } })
  return Boolean(fila && vigente(fila.expires) && correoDe(proposito, fila.identifier))
}
```

- [ ] **Paso 4: Implementar `recuperar/accion.ts`**

```ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@aiuto/db'
import { correoRestablecer } from '@aiuto/core'
import { enviarCorreo } from '@/lib/correo'
import { emitirFicha, consumirFicha } from '@/lib/fichas'
import { dentroDelLimite, origenDeCabeceras, traeElPaseEn } from '@/lib/limite'
import { esquemaRegistro } from '@/lib/esquemas'

export type EstadoPedir = { enviado?: boolean; error?: string }

const MENSAJE = 'Si hay una cuenta con ese correo, te mandamos una liga para cambiar la contraseña. Revisa también el correo no deseado.'

export async function pedirLiga(_previo: EstadoPedir, datos: FormData): Promise<EstadoPedir> {
  const h = await headers()
  const tope = dentroDelLimite(`recuperar:${origenDeCabeceras(h)}`, { maximo: 5, ventanaSegundos: 15 * 60 }, undefined, traeElPaseEn(h))
  if (!tope.permitido) return { error: 'Demasiados intentos. Espera unos minutos.' }

  const correo = String(datos.get('correo') ?? '').trim().toLowerCase()
  const usuario = correo ? await prisma.user.findUnique({ where: { email: correo } }) : null

  // La respuesta es la misma exista o no la cuenta: quien prueba correos al
  // azar no debe poder saber quién está registrado.
  if (usuario?.passwordHash) {
    const ficha = await emitirFicha('restablecer', correo)
    const liga = `${process.env.APP_URL}/recuperar/${ficha}`
    await enviarCorreo(correoRestablecer({ nombre: usuario.nombre, liga }), { correo, nombre: usuario.nombre ?? undefined })
  }
  return { enviado: true }
}

export type EstadoNueva = { error?: string; intento?: number }

export async function ponerNueva(previo: EstadoNueva, datos: FormData): Promise<EstadoNueva> {
  const intento = (previo.intento ?? 0) + 1
  const leido = esquemaRegistro.shape.password.safeParse(datos.get('password'))
  if (!leido.success) return { error: leido.error.issues[0]?.message, intento }

  const correo = await consumirFicha('restablecer', String(datos.get('ficha') ?? ''))
  if (!correo) return { error: 'Esta liga ya no sirve. Pide una nueva.', intento }

  await prisma.user.update({
    where: { email: correo },
    // Quien recibe la liga en su correo demuestra que el correo es suyo.
    data: { passwordHash: await bcrypt.hash(leido.data, 12), emailVerified: new Date() },
  })
  redirect('/entrar?cambiada=1')
}

export { MENSAJE }
```

Nota: la sesión es JWT y no se puede revocar. Al cambiar la contraseña, las sesiones abiertas
siguen vivas hasta su vencimiento (8 h, `auth.ts`). Se acepta y queda documentado en
`OPERACION.md` (tarea 15).

- [ ] **Paso 5: Implementar las páginas**, con el mismo patrón de `entrar/`: página de servidor
  con `metadata` `robots: { index: false }` y `dynamic = 'force-dynamic'`, y formulario de
  cliente con `useActionState`.
  - `recuperar/page.tsx`: `h1` "Recuperar tu contraseña", `<FormaPedir />` y una liga de regreso a `/entrar`.
  - `FormaPedir.tsx`: input `name="correo"` `type="email"` `required` y botón "Mandarme la liga". Con `estado.enviado`, mostrar `<p role="status">{MENSAJE}</p>` en lugar del formulario; con `estado.error`, mostrar `role="alert"`.
  - `recuperar/[ficha]/page.tsx`: `const valida = await fichaValida('restablecer', ficha)`. Si no es válida, `<main>` dice "Esta liga no sirve o ya venció." con un botón a `/recuperar`. Si es válida, `<FormaNueva ficha={ficha} />`.
  - `FormaNueva.tsx`: `<input type="hidden" name="ficha">`, input `name="password"` `type="password"` `autoComplete="new-password"` `minLength={8}` y botón "Guardar la contraseña nueva".
  - `entrar/page.tsx`: debajo de `<FormaEntrar />`, la liga `¿Olvidaste tu contraseña?` hacia `/recuperar`; y si `searchParams.cambiada === '1'`, un aviso `role="status"` que diga "Listo. Entra con tu contraseña nueva."

- [ ] **Paso 6: Bloquear el rastreo**: agregar `/recuperar` y `/verificar` a los `Disallow` de `robots`.

- [ ] **Paso 7: Verificar que pasa**

Run: `pnpm build && PORT=3100 pnpm start`; después la suite del paso 2; después `pnpm db:seed:qa`
y `node tools/qa/candidato.mjs`.
Expected: `recuperar.mjs` todo en verde y `candidato.mjs` sin regresiones.

- [ ] **Paso 8: Commit**

```bash
git add apps/web/lib/fichas.ts "apps/web/app/(publico)/recuperar" "apps/web/app/(publico)/entrar/page.tsx" apps/web/app/robots.ts tools/qa/recuperar.mjs
git commit -m "Agrega recuperar la contrasena por correo"
```

### Tarea 6: Verificar el correo antes de mostrar postulaciones (corrige H1)

**Archivos:**
- Crear: `apps/web/app/(publico)/verificar/[ficha]/page.tsx`
- Modificar: `apps/web/app/(publico)/registro/accion.ts`
- Modificar: `apps/web/app/mi/page.tsx`
- Modificar: `tools/qa/candidato.mjs`

**Interfaces:**
- Consume: `emitirFicha`, `consumirFicha` (tarea 5); `correoVerificar` (tarea 4).
- Produce: la regla **"una postulación hecha sin cuenta solo aparece en `/mi` si `User.emailVerified` no es nulo"**.

- [ ] **Paso 1: Escribir la prueba que falla** (en `tools/qa/candidato.mjs`, sección nueva)

```js
// --- nadie ve postulaciones ajenas registrándose con un correo que no es suyo ---
{
  const ajeno = `ajeno.${Date.now()}@qa.aiuto.test`
  // Alguien postula sin cuenta…
  const r = await fetch(`${B}/api/postulaciones`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-aiuto-pase': PASE },
    body: JSON.stringify({ vacanteSlug: 'qa-ingeniera-plataforma', nombre: 'Víctima', correo: ajeno }),
  })
  ok(r.status === 201 || r.status === 200, 'postulación sin cuenta creada', String(r.status))
  // …y otra persona se registra con ese correo
  const p = await nav.newPage()
  await p.setExtraHTTPHeaders({ 'x-aiuto-pase': PASE })
  await p.goto(`${B}/registro`)
  await p.fill('input[name=nombre]', 'Impostor')
  await p.fill('input[name=correo]', ajeno)
  await p.fill('input[name=password]', 'impostor123')
  await p.click('button[type=submit]')
  await p.waitForURL(/\/mi/)
  await p.goto(`${B}/mi`)
  const html = await p.content()
  ok(!html.includes('Ingeniera de plataforma'), 'sin verificar el correo, no ve la postulación ajena')
  ok(/Confirma tu correo/i.test(html), 'y se le pide confirmar el correo')
  await p.close()
}
```

(Los campos son los de `esquemaPostulacion` en `lib/esquemas.ts:52`, los mismos que usa
`bolsa.mjs:60`. La API responde `201`.)

- [ ] **Paso 2: Verificar que falla**

Run: `node tools/qa/candidato.mjs` contra local.
Expected: `FALLA sin verificar el correo, no ve la postulación ajena`.

- [ ] **Paso 3: `registro/accion.ts`**: **quitar** el bloque que liga postulaciones por correo
  (el `updateMany` que hoy sigue a `prisma.user.create`) y en su lugar mandar la verificación:

```ts
  // Las postulaciones hechas sin cuenta se ligan al verificar el correo, no
  // aquí: registrarse con un correo no prueba que sea de uno.
  const ficha = await emitirFicha('verificar', correo)
  await enviarCorreo(
    correoVerificar({ nombre, liga: `${process.env.APP_URL}/verificar/${ficha}` }),
    { correo, nombre },
  )
```

- [ ] **Paso 4: `mi/page.tsx`**: leer `emailVerified` y condicionar el `OR`:

```ts
  const { email: correo } = await exigirCandidato()
  const usuario = await prisma.user.findUnique({ where: { email: correo }, select: { emailVerified: true } })
  const verificado = Boolean(usuario?.emailVerified)

  const postulaciones = await prisma.postulacion.findMany({
    // Por correo, sólo si el correo está verificado: si no, cualquiera podría
    // registrarse con el correo de otra persona y ver a dónde se postuló.
    where: verificado
      ? { OR: [{ correo }, { candidato: { user: { email: correo } } }] }
      : { candidato: { user: { email: correo } } },
```

Y, si `!verificado`, pintar arriba del contenido un aviso con `<p className="text-h3">Confirma tu correo</p>`,
el texto "Te mandamos una liga a {correo}. Al confirmarlo verás aquí las postulaciones que hayas
hecho con él." y un botón que reenvíe la liga (una acción de servidor que llama a
`emitirFicha('verificar', correo)` y a `enviarCorreo`, con tope de 3 por hora usando la clave
`reenviar:${correo}`).

- [ ] **Paso 5: `verificar/[ficha]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { consumirFicha } from '@/lib/fichas'

export const metadata: Metadata = { title: 'Confirmar correo', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Verificar({ params }: { params: Promise<{ ficha: string }> }) {
  const { ficha } = await params
  const correo = await consumirFicha('verificar', ficha)

  if (correo) {
    const usuario = await prisma.user.update({
      where: { email: correo },
      data: { emailVerified: new Date() },
      include: { perfil: true },
    })
    // Ahora sí: el correo es suyo, y lo que postuló con él antes de tener cuenta es suyo.
    if (usuario.perfil) {
      await prisma.postulacion.updateMany({
        where: { correo, candidateProfileId: null },
        data: { candidateProfileId: usuario.perfil.id },
      })
    }
  }

  return (
    <main className="wrap py-8">
      <h1 className="text-h1">{correo ? 'Correo confirmado' : 'Esta liga no sirve o ya venció'}</h1>
      <p className="mt-3 text-ink-2">
        {correo
          ? 'Ya puedes ver en tu cuenta todas tus postulaciones.'
          : 'Entra a tu cuenta y pide una liga nueva desde ahí.'}
      </p>
      <Link href="/mi" className="btn mt-5">Ir a mi cuenta</Link>
    </main>
  )
}
```

Ojo: si la página se renderiza dos veces (por ejemplo, por un prefetch), la segunda vez la
ficha ya se consumió y diría "no sirve". Para evitarlo: la página **no** consume en el GET.
Muestra un botón "Confirmar mi correo" que dispara una acción de servidor, y la acción consume
la ficha y hace lo de arriba. Los clientes de correo que abren ligas por adelantado
(prefetchers de Outlook y Gmail) quemarían la ficha si se consumiera en el GET. Implementarlo
así desde el principio.

- [ ] **Paso 6: Las cuentas existentes.** Las del seed de QA nacen con `emailVerified`; las de
  staff que cree `crear-staff` también deben nacer verificadas. Revisar `scripts/crear-staff.ts`
  y agregar `emailVerified: new Date()` en el `create` y el `update` del `upsert` si no lo
  tiene. Las cuentas de candidatos reales que ya existan en producción (hoy no debería haber;
  la tarea 13 lo confirma) quedan sin verificar y verán el aviso.

- [ ] **Paso 7: Verificar**

Run: `pnpm build && PORT=3100 pnpm start`; `node tools/qa/candidato.mjs`; `node tools/qa/perfil.mjs`.
Expected: verde, incluida la sección nueva. Además, a mano: registrarse, copiar la liga de la
bitácora del servidor (`--- CORREO …`), abrirla, pulsar "Confirmar" y ver aparecer las
postulaciones previas en `/mi`.

- [ ] **Paso 8: Commit**

```bash
git add "apps/web/app/(publico)/verificar" "apps/web/app/(publico)/registro/accion.ts" apps/web/app/mi packages/db/scripts/crear-staff.ts tools/qa/candidato.mjs
git commit -m "Pide confirmar el correo antes de mostrar postulaciones hechas sin cuenta"
```

### Tarea 7: Limpieza completa de datos de prueba

**Archivos:**
- Modificar: `packages/db/prisma/seed-qa.ts` (función `limpiar` y entrada `main`)
- Modificar: `docs/mvp/QA.md` (sección "Antes de abrir")

**Interfaces:**
- Produce: `pnpm db:seed:qa --revisar` (solo cuenta y no borra; sale con código 1 si encuentra
  algo) y `pnpm db:seed:qa --limpiar` (borra lo mismo que cuenta `--revisar`). La tarea 13 los
  usa contra producción.

Lo que es "de prueba", en un solo lugar:

```ts
// Todo lo que siembra este archivo o dejan las suites de tools/qa. Si una suite
// nueva usa otro dominio u otra empresa, se agrega AQUÍ o la limpieza no la ve.
const DOMINIOS_QA = ['@qa.aiuto.test', '@ejemplo.mx']
const CORREOS_QA = ['x@y.mx']
const EMPRESAS_QA = { prefijo: 'qa-', exactas: ['aceros-del-pacifico'] }

const esCorreoQA = {
  OR: [...DOMINIOS_QA.map((d) => ({ correo: { endsWith: d } })), { correo: { in: CORREOS_QA } }],
}
const esUsuarioQA = {
  OR: [...DOMINIOS_QA.map((d) => ({ email: { endsWith: d } })), { email: { in: CORREOS_QA } }],
}
const esEmpresaQA = {
  OR: [{ slug: { startsWith: EMPRESAS_QA.prefijo } }, { slug: { in: EMPRESAS_QA.exactas } }],
}
```

- [ ] **Paso 1: Prueba que falla (local).** Sembrar, correr una suite que deje rastro y comprobar
  que `--limpiar` lo deja:

Run:
```bash
pnpm db:seed:qa && BASE=http://localhost:3100 TAREAS_SECRET=<local> node tools/qa/bolsa.mjs
pnpm db:seed:qa --limpiar
docker compose exec postgres psql -U aiuto -d aiuto -c \
  "select count(*) from \"Postulacion\" where correo like '%@ejemplo.mx' or correo like '%@qa.aiuto.test';"
```
Expected: un conteo **mayor que 0**. Esa es la falla.

- [ ] **Paso 2: Implementar `revisar()` y reescribir `limpiar()`**

```ts
async function contar() {
  return {
    empresas: await prisma.company.count({ where: esEmpresaQA }),
    vacantesDeEmpresasQA: await prisma.vacante.count({ where: { company: esEmpresaQA } }),
    postulaciones: await prisma.postulacion.count({ where: esCorreoQA }),
    usuarios: await prisma.user.count({ where: esUsuarioQA }),
    solicitudes: await prisma.solicitud.count({ where: esCorreoQA }),
    asesorias: await prisma.solicitudAsesoria.count({ where: esCorreoQA }),
  }
}

async function revisar() {
  const c = await contar()
  console.table(c)
  const total = Object.values(c).reduce((a, b) => a + b, 0)
  console.log(total ? `Quedan ${total} registros de prueba.` : 'Limpio: no queda nada de prueba.')
  process.exitCode = total ? 1 : 0
}

async function limpiar() {
  console.log('Antes:'); console.table(await contar())
  await prisma.$transaction([
    // Primero las postulaciones por correo: las hay de QA en vacantes reales.
    prisma.postulacion.deleteMany({ where: esCorreoQA }),
    // Vacantes y sus postulaciones caen en cascada con la empresa.
    prisma.company.deleteMany({ where: esEmpresaQA }),
    prisma.solicitud.deleteMany({ where: esCorreoQA }),
    prisma.solicitudAsesoria.deleteMany({ where: esCorreoQA }),
    prisma.user.deleteMany({ where: esUsuarioQA }),
  ])
  console.log('Después:'); await revisar()
}

const main = process.argv.includes('--revisar')
  ? revisar
  : process.argv.includes('--limpiar') ? limpiar : sembrar
```

La relación de `Vacante` con su empresa se llama `company` (`schema.prisma:247`, con
`onDelete: Cascade`). Si `user.deleteMany` choca con una
llave foránea de `AuditLog` (actor), hay que revisar el `onDelete` de esa relación: **no** se
borra la bitácora. Se pone `actorId` a nulo con `updateMany` antes del `deleteMany` de usuarios,
dentro de la misma transacción.

- [ ] **Paso 3: Verificar**

Run: el paso 1 completo, y después `pnpm db:seed:qa --revisar`.
Expected: el conteo de `psql` da 0 y `--revisar` imprime `Limpio` con código de salida 0.
Después, `pnpm db:seed:qa` vuelve a sembrar sin error (es idempotente).

- [ ] **Paso 4: Documentar en `docs/mvp/QA.md`**, al principio:

```markdown
> **Antes de abrir:** `pnpm db:seed:qa --revisar` tiene que decir `Limpio`. Si una suite
> nueva deja rastro con otro dominio o empresa, se agrega a `DOMINIOS_QA` / `EMPRESAS_QA`
> en `seed-qa.ts` en el mismo commit que la suite.
```

- [ ] **Paso 5: Commit**

```bash
git add packages/db/prisma/seed-qa.ts docs/mvp/QA.md
git commit -m "Hace que la limpieza de QA retire tambien lo que dejan las suites"
```

### Tarea 8: Aviso de privacidad sin pendientes

**Bloqueada por:** D1, D2 y D3.

**Archivos:**
- Modificar: `apps/web/app/(publico)/privacidad/page.tsx`

- [ ] **Paso 1: Confirmar que falla**: `curl -s localhost:3100/privacidad | grep -c PENDIENTE` → `14`.

- [ ] **Paso 2: Sustituir la constante por los datos reales**, en un solo bloque arriba del archivo:

```ts
/** Datos del responsable. Revisados por <quien firmó D3> el <fecha>. */
const RESPONSABLE = {
  domicilio: '<D1, tal cual lo entregó Dirección>',
  correoArco: '<D2>',
}
const PROVEEDORES =
  'Railway Corporation (alojamiento de la aplicación y la base de datos, en Estados Unidos), ' +
  'Resend, Inc. (envío de correo, en Estados Unidos) y Hostinger (alojamiento del sitio y del correo de contacto)'
```

Y reemplazar cada `${PENDIENTE}` por `RESPONSABLE.domicilio`, `RESPONSABLE.correoArco` o
`PROVEEDORES`, según el párrafo. Borrar `const PENDIENTE`, el comentario `BORRADOR` y el bloque
`<strong>Borrador pendiente de revisión legal.</strong>…`. Mencionar que hay transferencia
internacional (EE. UU.) es parte de lo que debe validar D3.

- [ ] **Paso 3: Agregar al aviso los datos nuevos** que introducen las tareas 5 y 6: el correo se
  usa también para recuperar la contraseña y confirmar la cuenta. Va un párrafo en la sección de
  finalidades.

- [ ] **Paso 4: Verificar** con el mismo `curl` (→ `0`), y que la fecha de "última actualización"
  de la página sea la del día.

- [ ] **Paso 5: Commit**: `git commit -m "Completa el aviso de privacidad con los datos del responsable"`

### Tarea 9: Monitoreo externo

**Archivos:**
- Crear: `.github/workflows/vigilar.yml`

Usa la misma variable `APP_URL` que ya existe en GitHub. Si falla, GitHub le manda correo a quien
tiene notificaciones de Actions activas en el repo. Hay que activarlas en
*Settings → Notifications → Actions → "Send notifications for failed workflows only"*.

- [ ] **Paso 1: Escribir el workflow**

```yaml
name: Vigilar produccion

# Cada 10 minutos. Si /api/salud no responde 200 con la base arriba, el job
# falla y GitHub avisa por correo. Es el monitoreo mas barato que hay: no
# cuesta nada y no depende de Railway para avisar que Railway se cayo.
on:
  schedule:
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  salud:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - name: Consultar /api/salud
        run: |
          for intento in 1 2 3; do
            cuerpo=$(curl -sS -m 20 "${{ vars.APP_URL }}/api/salud" || true)
            echo "intento $intento: $cuerpo"
            echo "$cuerpo" | grep -q '"base":"ok"' && exit 0
            sleep 20
          done
          echo "La aplicacion no esta sana despues de 3 intentos"
          exit 1
```

- [ ] **Paso 2: Probarlo** después del merge: `gh workflow run vigilar.yml && gh run watch`.
  Expected: verde. Prueba de que avisa: cambiar temporalmente la variable `APP_URL` a una URL
  inexistente con `gh variable set APP_URL --body https://no-existe.aiuto.invalid`, lanzar el
  workflow, ver el rojo y el correo, y **regresar el valor**
  (`gh variable set APP_URL --body https://aiuto-web-production.up.railway.app`). Ojo: esa
  variable también la usa `cerrar-vencidas.yml`, así que se hace cuando no esté por correr
  (no cerca de las 09:00 UTC).

- [ ] **Paso 3: Commit**: `git commit -m "Vigila la salud de produccion cada diez minutos"`

### Tarea 10: Migrar `railway.json` a IaC sin perder el Dockerfile (corrige H12)

**Fecha límite dura: antes del 1 de diciembre de 2026.** Se hace **después** de la tarea 11
(cuando ya existe respaldo) y **no** el mismo día de la salida.

**Archivos:**
- Crear: `.railway/railway.ts` (y `.railway/README.md`, que genera la CLI)
- Eliminar: `railway.json`

El riesgo es concreto: la migración automática deja `builder` y `dockerfilePath` comentados y
pierde la política de reinicio. El panel dice `RAILPACK`, así que, en cuanto `railway.json` deje
de mandar, el siguiente despliegue se construiría **sin el Dockerfile y sin el `migrate deploy`
del entrypoint**. La estrategia es dejar primero el panel correcto y después importar de ahí,
en vez de adivinar los nombres del DSL.

- [ ] **Paso 1: Respaldo previo**: `railway postgres pitr backup create --service Postgres --name pre-iac`.

- [ ] **Paso 2: Corregir el panel de `aiuto-web`** (Railway → aiuto-web → Settings):
  - Build → Builder: **Dockerfile**; Dockerfile path: `Dockerfile`
  - Deploy → Healthcheck path `/api/salud`, timeout `30`
  - Deploy → Restart policy: **On failure**, max retries `3`
  - Source → **Wait for CI**: activado (corrige H11)
  - Deploy → Replicas: `1`

- [ ] **Paso 3: Leer de vuelta**: `railway config pull --json`
  Expected: en `service.aiuto-web`, `"builder": "DOCKERFILE"`, `"checkSuites": true`, y el
  healthcheck y el restart presentes con los valores de arriba.

- [ ] **Paso 4: Generar el IaC desde el estado real**: `railway config pull` (escribe
  `.railway/railway.ts`). Editar a mano para que el archivo declare **solo** `aiuto-web`, con el
  mismo `partial = "aiuto-web"` que propone `config migrate --service aiuto-web`, y **no**
  el servicio huérfano ni la base, que no se gestionan desde aquí. Ningún dominio
  `*.up.railway.app` ni UUID queda en el archivo. Las variables se quedan como `preserve()`.

- [ ] **Paso 5: Desligar `railway.json`**: `railway config migrate --service aiuto-web --apply --delete-files`
  (limpia el ajuste de "Config File" del servicio y borra `railway.json`). Si escribe un
  `.railway/railway.ts` encima, conservar el del paso 4 y descartar el generado.

- [ ] **Paso 6: Plan sin sorpresas**: `railway config plan --detailed-exit-code`
  Expected: sin cambios, o solo cosméticos. **Cualquier** cambio en builder, healthcheck,
  réplicas o variables detiene la tarea hasta entenderlo. No se corre `config apply` sin que
  el usuario apruebe ese plan exacto.

- [ ] **Paso 7: Desplegar y comprobar**: commit y push a `main` (con CI en verde). En los logs de
  build: `railway logs --service aiuto-web --build` debe mostrar que usa el **Dockerfile**, y en
  los de ejecución debe aparecer `==> Aplicando migraciones`. Después, `/api/salud` en verde y
  `railway deployment list --service aiuto-web` con el nuevo despliegue en `SUCCESS`. Ya no
  debe salir el aviso `Config as Code … is deprecated`.

- [ ] **Paso 8: Commit** (antes del paso 7):

```bash
git add .railway railway.json
git commit -m "Migra la configuracion de Railway a infraestructura como codigo"
```

**Reversa:** si el despliegue sale mal, `git revert` del commit restaura `railway.json`, y en el
panel se vuelve a poner el ajuste de Config File en `railway.json`. Mientras tanto, *Redeploy*
del despliegue anterior en el panel.

---

## Fase B — Infraestructura en Railway

### Tarea 11: Respaldos, tope de gasto, servicio huérfano y variables

Operaciones sobre producción: cada paso se **lee de vuelta** después de hacerlo.

- [ ] **Paso 1: Respaldos diarios y semanales**

```bash
railway postgres pitr schedule set --daily --weekly --service Postgres
railway postgres pitr schedule list --service Postgres --json    # → no vacío
```

- [ ] **Paso 2: PITR**

```bash
railway postgres pitr enable --service Postgres
railway postgres pitr progress --service Postgres --watch
railway postgres pitr status --service Postgres --json           # → "enabled": true
```

- [ ] **Paso 3: Primer respaldo manual, bloqueado** (es el punto de partida de todo lo demás):

```bash
railway postgres pitr backup create --service Postgres --name pre-salida
railway postgres pitr backup list --service Postgres --json      # anotar el id
railway postgres pitr backup lock <id> --service Postgres
```

- [ ] **Paso 4: Tope de gasto** con los montos de D7 (whole dollars; ejemplo: aviso 25 y límite 60).
  Recordatorio: **el límite duro apaga el servicio entero**, así que va con holgura real (más del
  doble del gasto mensual normal; hoy van $9.21 USD en el periodo).

```bash
railway usage limit set --workspace "Atlas Tech" --target workspace --soft <D7-aviso> --hard <D7-limite> --json
railway usage limit status --workspace "Atlas Tech" --target workspace --json   # leer de vuelta
```

- [ ] **Paso 5: Retirar el servicio huérfano `aiuto`** (H10). Antes, confirmar que no tiene
  dominio, volumen ni variables que alguien use: `railway variables --service aiuto --kv` y
  `railway domain list --service aiuto --json`. Pedir confirmación explícita al usuario y luego
  borrarlo desde el panel (Settings → Danger → Delete service). Leer de vuelta con
  `railway service list` (solo `aiuto-web` y `Postgres`).

- [ ] **Paso 6: Variables**

```bash
railway variables --service aiuto-web --remove MODO_QA      # o en el panel; leer de vuelta
```
Rotar `AUTH_SECRET` (`openssl rand -base64 32`, capturado directo en el panel): invalida todas
las sesiones abiertas, incluidas las de QA. Rotar `TAREAS_SECRET`, que circuló en shells
locales y es también el pase del limitador: el nuevo valor va en Railway **y** en el secreto de
GitHub (`gh secret set TAREAS_SECRET`). El día después, confirmar que `cerrar-vencidas` corrió
en verde (`gh run list --workflow cerrar-vencidas.yml --limit 1`).

- [ ] **Paso 7: Acceso público a la base.** Postgres tiene proxy TCP público (`tcpProxies: 5432`).
  Se conserva, porque `crear-staff` y las tareas de datos se corren desde fuera, pero la
  contraseña de la base debe ser la generada por Railway (larga) y no compartirse. Se anota en
  `OPERACION.md` como algo a cerrar después de la mudanza a IONOS.

---

## Fase C — Correo

### Tarea 12: Resend con dominio verificado (corrige H7)

**Bloqueada por:** D8.

El correo de `aiuto.com.mx` vive en Hostinger (MX `mx1/mx2.hostinger.com`, SPF
`include:_spf.mail.hostinger.com`, DMARC `p=none`). Para no tocar eso, Resend se verifica en un
**subdominio de envío**, y el remitente sigue siendo `no-reply@aiuto.com.mx` solo si Resend
verifica el dominio raíz. Si no, se usa `no-reply@notificaciones.aiuto.com.mx`.

- [ ] **Paso 1: En Resend → Domains → Add domain**: `aiuto.com.mx`, región `us-east-1`. Resend da
  tres registros: DKIM `resend._domainkey` (TXT), MX `send` y SPF `send` (TXT). **No** se toca el
  SPF raíz: el de Resend vive en `send.aiuto.com.mx`, sin conflicto.

- [ ] **Paso 2: Capturarlos en el DNS de Hostinger** (hPanel → Dominios → DNS). Verificar
  propagación:

```bash
for n in resend._domainkey send; do curl -s "https://dns.google/resolve?name=$n.aiuto.com.mx&type=TXT"; echo; done
curl -s "https://dns.google/resolve?name=send.aiuto.com.mx&type=MX"
```
Después, en Resend, *Verify* debe quedar en verde.

- [ ] **Paso 3: Llave con permiso solo de envío** (Resend → API Keys → *Sending access*,
  dominio `aiuto.com.mx`). Se captura **directo** en Railway como `EMAIL_API_KEY`. Railway
  redespliega.

- [ ] **Paso 4: Prueba real**: postular sin cuenta a una vacante (cuando ya no haya QA, a una
  de prueba en borrador publicada solo para esto) con un correo propio de Gmail **y** uno de
  Outlook. Verificar que llega el acuse, que no cae en spam y que en los encabezados aparece
  `dkim=pass` y `spf=pass`. Revisar la bitácora: no debe aparecer `CORREO (sin proveedor
  configurado)`, ni `No se pudo enviar el correo`.

- [ ] **Paso 5: Recorrer los correos que importan**: verificación de cuenta (tarea 6), recuperar
  contraseña (tarea 5), cambio de estado de postulación (desde el panel) y aviso al equipo
  (llega a `EQUIPO_EMAIL=contacto@aiuto.com.mx`; confirmar que ese buzón existe y alguien lo lee).

- [ ] **Paso 6: Subir DMARC** a `p=quarantine; rua=mailto:<D2>` **una semana después**, si los
  reportes no muestran fallas. No el mismo día.

---

## Fase D — Datos

### Tarea 13: Base limpia y cuentas reales

**Requiere:** tarea 7 desplegada, tarea 11 paso 3 (respaldo) y D6.
Se necesita `DATABASE_URL` de producción en el entorno local. Es una operación sobre datos
reales: **la autoriza el usuario explícitamente en ese momento** y la corre él o la corre el
agente con su permiso.

- [ ] **Paso 1: Respaldo inmediato** (además del bloqueado): `railway postgres pitr backup create --service Postgres --name pre-limpieza`.

- [ ] **Paso 2: Revisar**: `DATABASE_URL=<prod> pnpm db:seed:qa --revisar`. Guardar la tabla en el
  registro de la salida.

- [ ] **Paso 3: Auditoría de lo que NO es QA** (solo lectura). Lo que salga aquí son datos que
  alguien metió a mano y que hay que revisar uno por uno con el equipo:

```sql
select rol, count(*) from "User" group by rol;
select email, rol, "creadoEn" from "User" where email not like '%@qa.aiuto.test' and email not like '%@ejemplo.mx';
select slug, nombre from "Company" where slug not like 'qa-%';
select count(*), estado from "Vacante" group by estado;
select split_part(correo,'@',2) dominio, count(*) from "Solicitud" group by 1 order by 2 desc;
select split_part(correo,'@',2) dominio, count(*) from "Postulacion" group by 1 order by 2 desc;
select migration_name, finished_at is not null as aplicada from _prisma_migrations order by started_at;
```

Las **solicitudes reales** que hayan llegado desde la landing (desde el 2 de octubre la landing
del repo escribe contra la API, aunque la publicada no) **no se borran**: se atienden.

- [ ] **Paso 4: Limpiar**: `DATABASE_URL=<prod> pnpm db:seed:qa --limpiar` y luego `--revisar` → `Limpio`.

- [ ] **Paso 5: Cuentas del equipo** (D6), una por persona:

```bash
DATABASE_URL=<prod> pnpm crear-staff <correo> "<Nombre Apellido>" admin
```
La contraseña se imprime una vez. Se entrega por un canal privado y se guarda en el gestor de
contraseñas de cada quien, nunca por chat ni correo. Cada persona entra, comprueba que cae en
`/panel` y, si quiere otra contraseña, la cambia con `/recuperar` (tarea 5).

- [ ] **Paso 6: Verificar desde fuera**: `BASE=<prod> node tools/qa/salida.mjs`. Las secciones de
  QA y sitemap deben salir en verde.

---

## Fase E — Landing

### Tarea 14: Contenido real y subida a Hostinger (corrige H14 y H15)

**Bloqueada por:** D2, D4 y D5.

- [ ] **Paso 1: Datos**: llenar `tools/datos.json` con D2 y D4. Para cada enlace del footer de D5:
  si existe, su URL. El **Aviso de privacidad** va a
  `https://aiuto-web-production.up.railway.app/privacidad`. Los que no existan se **quitan del
  HTML** (no se dejan en `#`): editar el footer en las 10 páginas o, mejor, agregar a
  `aplicar-datos.py` la opción de borrar el `<li>` cuando el valor sea `"QUITAR"`, con su prueba.

- [ ] **Paso 2: Simulacro y aplicación**

```bash
python3 tools/aplicar-datos.py            # simulacro
python3 tools/aplicar-datos.py --aplicar
python3 tools/aplicar-datos.py --estado   # solo deben quedar las 5 fotos
git diff sitio/
```

- [ ] **Paso 3: Probar la landing local contra producción**: `ORIGENES_CORS` en Railway debe
  incluir temporalmente `http://localhost:8080`; con `cd sitio && python3 -m http.server 8080`,
  `BASE=<prod> LANDING=http://localhost:8080 node tools/qa/landing.mjs`. Al terminar, **quitar**
  `localhost` de `ORIGENES_CORS`.

- [ ] **Paso 4: Commit y paquete**

```bash
git add sitio tools
git commit -m "Pone los datos reales de contacto en la landing"
cd sitio && zip -r ../aiuto-sitio.zip . -x '.DS_Store' && cd ..
```

- [ ] **Paso 5: Subir por cPanel** siguiendo `docs/DESPLIEGUE.md` §2 (incluido `.htaccess`).
  `main.js` tiene caché de 24 h: agregar `?v=<fecha>` al `<script src="main.js">` de las 10
  páginas **antes** del zip, para que nadie se quede con el `main.js` que simula el envío.

- [ ] **Paso 6: Verificar**: `LANDING=https://aiuto.com.mx BASE=<prod> node tools/qa/salida.mjs`.
  La sección de landing debe salir en verde. A mano: enviar el formulario de contacto real y
  verlo llegar a la bandeja del panel y al correo del equipo.

- [ ] **Paso 7: HSTS en la landing**: descomentar `Strict-Transport-Security` del `.htaccess`
  (lleva más de un mes estable en HTTPS) y volver a subir solo ese archivo.

Las 5 fotos y el logo monocromático **no bloquean** la salida: los marcadores están diseñados
para verse intencionales.

---

## Fase F — Ensayo de lo que puede salir mal

### Tarea 15: Restauración ensayada y manual de operación

- [ ] **Paso 1: Ensayar la restauración** sin tocar producción:

```bash
railway postgres pitr restore --service Postgres --at <UTC de hace 1 hora> --new-service-name postgres-ensayo
```
Esperar el despliegue de `postgres-ensayo`; conectarse por su proxy y comparar
`select count(*) from "Vacante"` (y las demás tablas) contra producción. Anotar cuánto tardó.
**Borrar** `postgres-ensayo` al terminar (cuesta mientras exista).

- [ ] **Paso 2: Ensayar la reversa de un despliegue**: en el panel, *Redeploy* del despliegue
  anterior de `aiuto-web` y confirmar `/api/salud` en verde. Después, *Redeploy* del actual. Las
  migraciones son solo hacia adelante: una reversa de código con una migración ya aplicada solo
  es segura si la migración fue **aditiva**. Queda como regla en el manual.

- [ ] **Paso 3: Escribir `docs/mvp/OPERACION.md`** con estas secciones, con los comandos reales
  de este plan, no resúmenes:
  1. **Dónde vive cada cosa** (Railway, Hostinger, Resend, GitHub) y quién tiene acceso.
  2. **Secretos**: qué variables hay, dónde se rotan y qué rompe rotar cada una (`AUTH_SECRET`
     cierra sesiones; `TAREAS_SECRET` va en Railway **y** GitHub).
  3. **Respaldos**: horario, cómo crear uno manual y cómo restaurar (los comandos del paso 1,
     con el tiempo medido).
  4. **Reversa de un despliegue** (paso 2) y la regla de migraciones aditivas.
  5. **Si `vigilar` se pone rojo**: `railway logs --service aiuto-web --lines 200`, `railway
     deployment list`, `/api/salud`, y qué revisar primero (base, memoria, despliegue reciente).
  6. **Altas de equipo** (`crear-staff`) y **bajas** (borrar el usuario; sus acciones en
     `AuditLog` quedan).
  7. **Peticiones ARCO**: cómo encontrar y borrar los datos de una persona por correo
     (`Postulacion`, `Solicitud`, `SolicitudAsesoria`, `User`), con plazo de 20 días hábiles.
  8. **Límites conocidos**: sesiones JWT no revocables (8 h), limitador en memoria (una
     réplica) y proxy público de la base.
  9. **Fecha límite**: 1 de diciembre de 2026 para Config as Code (tarea 10).

- [ ] **Paso 4: Commit**: `git commit -m "Agrega el manual de operacion de produccion"`

---

## Fase G — Día de salida

### Tarea 16: Go / no-go y primeras 72 horas

**Requiere:** tareas 1 a 15 cerradas (la 10 puede quedar después, pero antes del 1 de
diciembre), D9 cargado y D10 recomendado.

- [ ] **Paso 1: Lista de go / no-go.** Todo en sí o no se abre:

| Comprobación | Cómo | Esperado |
| --- | --- | --- |
| Puerta de salida | `BASE=<prod> node tools/qa/salida.mjs` | `Todo en verde`, código 0 |
| Sin QA en la base | `pnpm db:seed:qa --revisar` contra prod | `Limpio` |
| Vacantes reales | `/bolsa` | ≥ 3 en al menos una categoría, para que `/sueldos` tenga cifra |
| CI | `gh run list --workflow ci.yml --limit 1` | `success` en el commit desplegado |
| Despliegue | `railway deployment list --service aiuto-web` | El último, `SUCCESS` y de ese commit |
| Respaldos | `pitr status` y `schedule list` | PITR activo; diario y semanal |
| Tope de gasto | `usage limit status` | Aviso y límite puestos |
| Correo | Postulación real a Gmail y Outlook | Llega, sin spam, DKIM pasa |
| Monitoreo | `gh run list --workflow vigilar.yml --limit 3` | Verde |
| Equipo | Las 3 cuentas entran a `/panel` | Sí |
| Aviso legal | D3 firmado | Sí |
| Recorridos de `QA.md` | Los 5, a mano, con datos reales y en móvil | Sin errores |

- [ ] **Paso 2: Ventana de salida.** Un día entre semana por la mañana (hora del centro), con
  quien opera el panel disponible. Nada de viernes.

- [ ] **Paso 3: Anuncio.** Solo después del paso 1 en verde.

- [ ] **Paso 4: Primeras 72 horas.** Dos veces al día:
  - `railway logs --service aiuto-web --lines 300 | grep -iE "error|No se pudo enviar"` → vacío
  - Resend → Logs: rebotes y quejas
  - `railway usage` del periodo
  - La bandeja del panel: que cada solicitud tenga responsable

- [ ] **Paso 5: Disparadores de reversa** (cualquiera de estos → *Redeploy* del anterior o, si es
  de datos, restauración según `OPERACION.md`):
  - `/api/salud` en rojo por más de 10 minutos después de un despliegue
  - Una postulación o solicitud que no se guarda
  - Una persona ve datos de otra
  - Correos que rebotan en más del 5 % de los envíos

- [ ] **Paso 6: Actualizar la documentación**: `README.md` (hoy describe solo la landing; agregar
  el MVP y ligar a `OPERACION.md`), `docs/DESPLIEGUE.md` §7, `docs/HANDOFF.md` §6 y la memoria del
  proyecto. Commit: `git commit -m "Actualiza la documentacion tras abrir la beta"`.

---

## Fuera del alcance de la salida (decisiones explícitas)

Aparecen en la spec y **no** bloquean la apertura. Se dejan anotados para no confundirlos con
olvidos:

- **Entrar con Google** (spec §5). Hoy solo hay correo y contraseña. Agregarlo requiere un
  proyecto en Google Cloud, una pantalla de consentimiento verificada y revisar la estrategia
  JWT. Se recomienda para después de la apertura.
- **CV en PDF** (`cvUrl` existe en el esquema y no se usa). Requiere almacenamiento de archivos
  (un bucket de Railway) y entra al aviso de privacidad como dato nuevo.
- **Dominio propio para la app** (`app.aiuto.com.mx`). Se retiró a propósito. Cuando vuelva,
  cambian `APP_URL`, la variable de GitHub y los enlaces de la landing.
- **Mudanza a IONOS** (spec §14.1): falta definir qué la dispara.
- **CSP**: necesita nonces en Next; va después, con su propia prueba.
- **Los tres números que dicen si la beta salió bien** (spec §14.5): conviene definirlos antes
  del anuncio, aunque no bloquean.

## Orden y dependencias

```
Fase 0 (pedir D1–D10) ──────────────────────────────────────────────┐
                                                                     │
T1 → T2 → T3 → T4 → T5 → T6 → T7 ─┬→ merge a main (CI verde)        │
                     T9 ──────────┘          │                       │
                                             ▼                       │
            T11 (respaldos, tope, huérfano, variables) ◄────────── D7 │
                     │                                               │
     ┌───────────────┼─────────────────┬───────────────┐             │
     ▼               ▼                 ▼               ▼             │
 T12 (correo)   T13 (datos)       T8 (aviso)      T14 (landing) ◄─── D1–D6, D8
     └───────────────┴────────┬────────┴───────────────┘
                              ▼
                    T15 (ensayo + manual)
                              ▼
                    T16 (go / no-go)  ◄── D9
       T10 (IaC): después de T11, en otro día, antes del 1/dic/2026
```

Estimación con una persona: Fase A, 3 a 4 días; Fases B a F, 2 días de trabajo más la espera
de DNS y de los insumos D; Fase G, medio día. **El camino crítico no es el código: son D1–D3
(aviso legal) y D9 (vacantes reales).** Por eso la Fase 0 se pide hoy.

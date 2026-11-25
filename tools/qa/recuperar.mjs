// Recuperar la contraseña y confirmar el correo. Corre SOLO contra local: lee
// la base directamente, porque en la base sólo queda la huella de cada ficha y
// la ficha en claro únicamente viaja en el correo.
//
// Después de correrla hay que volver a sembrar (pnpm db:seed:qa) para que
// candidato@ recupere su contraseña de siempre.
import { createRequire } from 'node:module'
import { randomBytes, createHash } from 'node:crypto'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../../packages/db/generated/client/index.js')

const B = process.env.BASE ?? 'http://localhost:3100'
if (!/localhost|127\.0\.0\.1/.test(B)) {
  console.error('Esta suite sólo corre contra local.')
  process.exit(1)
}

const PASE = process.env.TAREAS_SECRET ?? ''
const db = new PrismaClient()
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }

/**
 * Emite una ficha con la misma receta que packages/core/src/fichas.ts: 32 bytes
 * en base64url y su sha256 en hex como huella. Si la receta cambia allá, cambia aquí.
 */
async function fichaDirecta(identifier, minutos = 60) {
  const ficha = randomBytes(32).toString('base64url')
  const huella = createHash('sha256').update(ficha).digest('hex')
  await db.verificationToken.deleteMany({ where: { identifier } })
  await db.verificationToken.create({ data: { identifier, token: huella, expires: new Date(Date.now() + minutos * 60_000) } })
  return ficha
}

const nav = await chromium.launch()
const nueva = () => nav.newContext({ extraHTTPHeaders: { 'x-aiuto-pase': PASE } }).then((c) => c.newPage())
const p = await nueva()

// ---------- Recuperar ----------

// 1. Un correo que no existe recibe la misma respuesta que uno que sí
await p.goto(`${B}/recuperar`)
await p.fill('input[name=correo]', 'nadie.aqui@qa.aiuto.test')
await p.click('button[type=submit]')
await p.waitForSelector('[role=status]')
const inexistente = await p.textContent('[role=status]')
await p.goto(`${B}/recuperar`)
await p.fill('input[name=correo]', 'candidato@qa.aiuto.test')
await p.click('button[type=submit]')
await p.waitForSelector('[role=status]')
const existente = await p.textContent('[role=status]')
ok(inexistente === existente, 'la respuesta no delata quién tiene cuenta')
ok(
  (await db.verificationToken.count({ where: { identifier: 'restablecer:nadie.aqui@qa.aiuto.test' } })) === 0,
  'y al correo inexistente no se le emite ficha',
)

// 2. La huella está en la base; la ficha en claro, no
const fila = await db.verificationToken.findFirst({ where: { identifier: 'restablecer:candidato@qa.aiuto.test' } })
ok(Boolean(fila) && /^[0-9a-f]{64}$/.test(fila.token), 'en la base sólo queda la huella')

// 3. Una ficha alterada no sirve
await p.goto(`${B}/recuperar/estonoesunaficha`)
ok(/no sirve|venci/i.test(await p.textContent('main')), 'una liga inventada se rechaza')

// 4. Una vencida tampoco
const vencida = await fichaDirecta('restablecer:candidato@qa.aiuto.test', -1)
await p.goto(`${B}/recuperar/${vencida}`)
ok(/no sirve|venci/i.test(await p.textContent('main')), 'una liga vencida se rechaza')

// 5. Con la liga buena se cambia, y la contraseña nueva entra
const buena = await fichaDirecta('restablecer:candidato@qa.aiuto.test')
await p.goto(`${B}/recuperar/${buena}`)
await p.fill('input[name=password]', 'nueva-clave-segura')
await p.click('button[type=submit]')
await p.waitForURL(/\/entrar/)
ok(/contraseña nueva/i.test(await p.textContent('main')), 'avisa que ya puede entrar')
await p.fill('input[name=email]', 'candidato@qa.aiuto.test')
await p.fill('input[name=password]', 'nueva-clave-segura')
await p.click('button[type=submit]')
ok(await p.waitForURL(/\/mi/).then(() => true).catch(() => false), 'la contraseña nueva sirve para entrar')

// 6. La misma liga no sirve dos veces
const otra = await nueva()
await otra.goto(`${B}/recuperar/${buena}`)
ok(/no sirve|venci/i.test(await otra.textContent('main')), 'la liga no se puede usar dos veces')

// ---------- Confirmar el correo ----------

const correo = `confirma.${Date.now()}@qa.aiuto.test`
const c = await nueva()

// Se postula sin cuenta…
await c.goto(`${B}/bolsa/qa-soldador-certificado`)
await c.fill('input[name=nombre]', 'Persona Que Confirma')
await c.fill('input[name=correo]', correo)
await c.click('button:has-text("Enviar postulación")')
await c.waitForFunction(() => /ya quedó tu postulación/i.test(document.body.innerText), null, { timeout: 30000 })

// …se registra, y el registro emite la ficha de verificar
await c.goto(`${B}/registro`)
await c.fill('input[name=nombre]', 'Persona Que Confirma')
await c.fill('input[name=correo]', correo)
await c.fill('input[name=password]', 'unaClaveLarga123')
await c.click('button:has-text("Crear mi cuenta")')
await c.waitForURL('**/mi/perfil', { timeout: 60000 })
ok((await db.verificationToken.count({ where: { identifier: `verificar:${correo}` } })) === 1, 'registrarse emite la liga de confirmar')

await c.goto(`${B}/mi`)
ok(!(await c.content()).includes('Soldador certificado'), 'antes de confirmar no ve lo postulado sin cuenta')

// Abrir la liga NO la consume: los clientes de correo la abren por adelantado
const fv = await fichaDirecta(`verificar:${correo}`)
await c.goto(`${B}/verificar/${fv}`)
await c.goto(`${B}/verificar/${fv}`)
ok(/Confirma tu correo/.test(await c.textContent('main')), 'abrir la liga dos veces no la quema')
await c.click('button:has-text("Confirmar mi correo")')
await c.waitForSelector('[role=status]')
ok(/Correo confirmado/.test(await c.textContent('[role=status]')), 'al pulsar confirmar, confirma')

await c.goto(`${B}/mi`)
ok((await c.content()).includes('Soldador certificado'), 'y ya ve lo que postuló sin cuenta')
ok(!(await c.content()).includes('Confirma tu correo'), 'y el aviso desaparece')

await nav.close()
await db.$disconnect()
console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
process.exit(fallos === 0 ? 0 : 1)

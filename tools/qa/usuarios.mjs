// Gestión de usuarios desde /panel/usuarios: cambiar el rol dentro del equipo y
// desactivar o reactivar cuentas. Comprueba que surte efecto en la sesión que
// ya estaba abierta, sin esperar a que venza el token.
//
// Corre SOLO contra local: lee y repara la base. Necesita la semilla de QA.
import { createRequire } from 'node:module'
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

const OPERADOR = 'operador@qa.aiuto.test'
const ADMIN = 'admin@qa.aiuto.test'
// Si una corrida anterior se quedó a medias, se empieza de cero.
await db.user.update({ where: { email: OPERADOR }, data: { rol: 'STAFF_OPERADOR', desactivadoEn: null } })
await db.user.update({ where: { email: ADMIN }, data: { rol: 'STAFF_ADMIN', desactivadoEn: null } })
const operador = await db.user.findUniqueOrThrow({ where: { email: OPERADOR } })

const nav = await chromium.launch()
const pagina = () => nav.newContext({ extraHTTPHeaders: { 'x-aiuto-pase': PASE } }).then((c) => c.newPage())
async function intentarEntrar(correo) {
  const p = await pagina()
  await p.goto(`${B}/entrar`)
  await p.fill('input[name=email]', correo)
  await p.fill('input[name=password]', 'aiuto123')
  await p.click('button[type=submit]')
  const entro = await p.waitForURL('**/panel', { timeout: 30000 }).then(() => true).catch(() => false)
  return { p, entro }
}
const fila = (p, correo) => p.locator('tr', { hasText: correo })

try {
  const { p: admin } = await intentarEntrar(ADMIN)
  const { p: op, entro } = await intentarEntrar(OPERADOR)
  ok(entro, 'el operador entra al panel')

  // --- permisos: solo el administrador ve /panel/usuarios ---
  await op.goto(`${B}/panel/usuarios`)
  ok(!op.url().endsWith('/panel/usuarios'), 'el operador no ve la gestión de usuarios', op.url())

  await admin.goto(`${B}/panel/usuarios`)
  ok((await fila(admin, ADMIN).innerText()).includes('Tu cuenta'), 'sobre su propia cuenta no hay botones')

  // --- cambio de rol: surte efecto en la sesión abierta ---
  await fila(admin, OPERADOR).locator('button:has-text("Hacer administrador")').click()
  await admin.waitForFunction(
    (c) => [...document.querySelectorAll('tr')].some((t) => t.innerText.includes(c) && t.innerText.includes('Pasar a operación')),
    OPERADOR,
    { timeout: 30000 },
  )
  ok((await db.user.findUniqueOrThrow({ where: { id: operador.id } })).rol === 'STAFF_ADMIN', 'el operador pasa a administrador')
  await op.goto(`${B}/panel/usuarios`)
  ok(op.url().endsWith('/panel/usuarios'), 'y sin volver a entrar ya ve la gestión de usuarios', op.url())

  await fila(admin, OPERADOR).locator('button:has-text("Pasar a operación")').click()
  await admin.waitForFunction(
    (c) => [...document.querySelectorAll('tr')].some((t) => t.innerText.includes(c) && t.innerText.includes('Hacer administrador')),
    OPERADOR,
    { timeout: 30000 },
  )
  ok((await db.user.findUniqueOrThrow({ where: { id: operador.id } })).rol === 'STAFF_OPERADOR', 'y regresa a operación')

  // --- desactivar: corta la sesión abierta y no deja entrar ---
  await fila(admin, OPERADOR).locator('button:has-text("Desactivar")').click()
  await admin.waitForFunction(
    (c) => [...document.querySelectorAll('tr')].some((t) => t.innerText.includes(c) && t.innerText.includes('Reactivar')),
    OPERADOR,
    { timeout: 30000 },
  )
  ok((await db.user.findUniqueOrThrow({ where: { id: operador.id } })).desactivadoEn !== null, 'la cuenta queda desactivada')
  await op.goto(`${B}/panel`)
  ok(op.url().includes('/entrar'), 'la sesión que tenía abierta se corta', op.url())
  const otraVez = await intentarEntrar(OPERADOR)
  ok(!otraVez.entro, 'con la contraseña correcta ya no entra')
  ok(/incorrect|no coincide|inválid/i.test(await otraVez.p.locator('form').innerText()), 'y el mensaje es el de credenciales, no revela que existe')
  const bitacora = await db.auditLog.findFirst({ where: { entidad: 'User', entidadId: operador.id, accion: 'cuenta desactivada' } })
  ok(Boolean(bitacora), 'queda en la bitácora')

  // --- reactivar ---
  await fila(admin, OPERADOR).locator('button:has-text("Reactivar")').click()
  await admin.waitForFunction(
    (c) => [...document.querySelectorAll('tr')].some((t) => t.innerText.includes(c) && t.innerText.includes('Desactivar')),
    OPERADOR,
    { timeout: 30000 },
  )
  ok((await intentarEntrar(OPERADOR)).entro, 'reactivada, vuelve a entrar')
} finally {
  await db.user.update({ where: { email: OPERADOR }, data: { rol: 'STAFF_OPERADOR', desactivadoEn: null } })
  await nav.close()
  await db.$disconnect()
}
console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
process.exit(fallos === 0 ? 0 : 1)

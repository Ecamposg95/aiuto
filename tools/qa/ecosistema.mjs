// El ecosistema del máster prompt: empresas con cuenta, mensajería, alertas de
// inactividad, alta de empresas y dónde aparece WhatsApp.
//
// Corre SOLO contra local: lee la base para tomar ids y comprobar efectos.
// Necesita la semilla de QA recién corrida (pnpm db:seed:qa) y el servidor con
// WHATSAPP_NUMERO definido (cualquier número de prueba) y TAREAS_SECRET.
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

const nav = await chromium.launch()
const pagina = () => nav.newContext({ extraHTTPHeaders: { 'x-aiuto-pase': PASE } }).then((c) => c.newPage())
async function entrar(correo, destino) {
  const p = await pagina()
  await p.goto(`${B}/entrar`)
  await p.fill('input[name=email]', correo)
  await p.fill('input[name=password]', 'aiuto123')
  await p.click('button[type=submit]')
  await p.waitForURL(destino, { timeout: 60000 })
  return p
}
const tarea = (ruta) =>
  fetch(`${B}/api/tareas/${ruta}`, { method: 'POST', headers: { authorization: `Bearer ${PASE}` } }).then((r) => r.json())

// ---------------------------------------------------------------- WhatsApp

{
  const p = await pagina()
  const hay = async (ruta) => {
    await p.goto(`${B}${ruta}`)
    return (await p.locator('a[href^="https://wa.me/"]').count()) > 0
  }
  for (const ruta of ['/', '/soluciones', '/soluciones/finanzas', '/empleabilidad']) {
    ok(await hay(ruta), `WhatsApp visible en ${ruta}`)
  }
  for (const ruta of ['/bolsa', '/bolsa/qa-soldador-certificado', '/entrar', '/registro', '/empresas/registro']) {
    ok(!(await hay(ruta)), `WhatsApp oculto en ${ruta}`)
  }
  await p.goto(`${B}/soluciones/finanzas`)
  const liga = await p.locator('a[href^="https://wa.me/"]').first().getAttribute('href')
  ok(decodeURIComponent(liga).includes('cómo AIUTO puede ayudar a mi empresa'), 'en Soluciones, con el mensaje para empresas')
  await p.goto(`${B}/empleabilidad`)
  const liga2 = await p.locator('a[href^="https://wa.me/"]').first().getAttribute('href')
  ok(decodeURIComponent(liga2).includes('programa de empleabilidad'), 'en Empleabilidad, con su propio mensaje')
}

// ---------------------------------------------------------------- alerta antes del contacto

const ingeniera = await db.vacante.findUniqueOrThrow({ where: { slug: 'qa-ingeniera-plataforma' } })
const soldador = await db.vacante.findUniqueOrThrow({ where: { slug: 'qa-soldador-certificado' } })
await db.alerta.deleteMany({ where: { vacanteId: { in: [ingeniera.id, soldador.id] } } })
await db.postulacion.updateMany({ where: { vacanteId: ingeniera.id }, data: { contactadaEn: null } })

let r = await tarea('alertas')
ok(r.ok === true, 'la tarea de alertas responde', JSON.stringify(r))
const alerta = await db.alerta.findFirst({ where: { vacanteId: ingeniera.id } })
ok(alerta?.estado === 'ABIERTA', 'una vacante con postulaciones de hace días y nadie contactado genera alerta')
ok(alerta?.postulados === (await db.postulacion.count({ where: { vacanteId: ingeniera.id } })), 'con el número de postulados')
r = await tarea('alertas')
ok((await db.alerta.count({ where: { vacanteId: ingeniera.id } })) === 1, 'correrla dos veces no la duplica')

const sinAuth = await fetch(`${B}/api/tareas/alertas`, { method: 'POST' })
ok(sinAuth.status === 401, 'sin el secreto, la tarea no corre')

// ---------------------------------------------------------------- la empresa en su panel

const empresa = await entrar('reclutador@qa.aiuto.test', '**/reclutamiento')
ok(empresa.url().endsWith('/reclutamiento'), 'el reclutador cae en su panel')
await empresa.goto(`${B}/reclutamiento/postulaciones`)
const lista = await empresa.content()
ok(lista.includes('Rosa Nueva'), 've las postulaciones de sus vacantes')
ok(!lista.includes('Ignacio Soldador'), 'no ve las de otra empresa')

// Una vacante y una postulación de otra empresa responden como si no existieran
const ajena = await db.postulacion.findFirstOrThrow({ where: { vacanteId: soldador.id } })
let resp = await empresa.goto(`${B}/reclutamiento/postulaciones/${ajena.id}`)
ok(resp.status() === 404, 'la postulación de otra empresa da 404', String(resp.status()))
resp = await empresa.goto(`${B}/reclutamiento/vacantes/${soldador.id}/editar`)
ok(resp.status() === 404, 'editar la vacante de otra empresa da 404', String(resp.status()))

// Al panel del equipo no entra
await empresa.goto(`${B}/panel`)
ok(!empresa.url().includes('/panel'), 'el panel del equipo le queda cerrado', empresa.url())

// Ficha de Carla: autorizó, así que ve su perfil
const deCarla = await db.postulacion.findFirstOrThrow({ where: { vacanteId: ingeniera.id, correo: 'candidato@qa.aiuto.test' } })
// Sin mensajes de corridas anteriores: si no, la espera de abajo encontraría el texto viejo.
await db.mensaje.deleteMany({ where: { postulacionId: deCarla.id } })
await db.notificacion.deleteMany({ where: { user: { email: 'candidato@qa.aiuto.test' } } })
await empresa.goto(`${B}/reclutamiento/postulaciones/${deCarla.id}`)
ok(/Desarrolladora backend/.test(await empresa.content()), 've el perfil de quien autorizó mostrarlo')

// Le escribe: cuenta como contacto efectivo
await empresa.fill('textarea[name=texto]', 'Hola Carla, ¿puedes el jueves a las 10 para la entrevista?')
await empresa.click('button:has-text("Enviar")')
await empresa.waitForFunction(() => document.body.innerText.includes('jueves a las 10'), null, { timeout: 30000 })
const tras = await db.postulacion.findUniqueOrThrow({ where: { id: deCarla.id } })
ok(tras.contactadaEn !== null, 'el primer mensaje de la empresa registra el contacto')
ok((await db.notificacion.count({ where: { user: { email: 'candidato@qa.aiuto.test' }, leidaEn: null } })) > 0, 'y a Carla le llega un aviso dentro de AIUTO')

// ---------------------------------------------------------------- la candidata contesta

const carla = await entrar('candidato@qa.aiuto.test', '**/mi')
ok(/mensaje nuevo/i.test(await carla.content()), 'en /mi ve que tiene un mensaje nuevo')
await carla.goto(`${B}/mi/postulaciones/${deCarla.id}`)
ok((await carla.content()).includes('jueves a las 10'), 'lee el mensaje de la empresa')
await carla.fill('textarea[name=texto]', 'Sí, ahí estaré. Gracias.')
await carla.click('button:has-text("Enviar")')
await carla.waitForFunction(() => document.body.innerText.includes('ahí estaré'), null, { timeout: 30000 })
await empresa.reload()
ok((await empresa.content()).includes('ahí estaré'), 'la empresa ve la respuesta')

// Otra candidata no puede leer esa conversación
const gina = await entrar('gerente@qa.aiuto.test', '**/mi')
resp = await gina.goto(`${B}/mi/postulaciones/${deCarla.id}`)
ok(resp.status() === 404, 'una conversación ajena da 404 a otra candidata', String(resp.status()))

// ---------------------------------------------------------------- la alerta se resuelve sola

r = await tarea('alertas')
const resuelta = await db.alerta.findFirst({ where: { vacanteId: ingeniera.id } })
ok(resuelta?.estado === 'ATENDIDA', 'con un contacto, la alerta se cierra sola', resuelta?.estado)

// ---------------------------------------------------------------- alta de empresa y aprobación

// El nombre empieza con «QA» para que su slug lleve el prefijo qa- y la
// limpieza de la semilla la retire.
const sello = Date.now().toString(36)
const nombreNueva = `QA Empresa ${sello}`
const correoNueva = `alta.${sello}@qa.aiuto.test`
const nueva = await pagina()
await nueva.goto(`${B}/empresas/registro`)
await nueva.fill('input[name=empresa]', nombreNueva)
await nueva.fill('input[name=ubicacion]', 'Puebla, Puebla')
await nueva.fill('input[name=nombre]', 'Nadia Nueva')
await nueva.fill('input[name=correo]', correoNueva)
await nueva.fill('input[name=password]', 'unaClaveLarga123')
await nueva.click('button[type=submit]')
await nueva.waitForURL('**/reclutamiento', { timeout: 60000 })
ok(/revisando tu empresa/i.test(await nueva.content()), 'la empresa nueva queda en revisión')
resp = await nueva.goto(`${B}/reclutamiento/vacantes/nueva`)
ok(nueva.url().endsWith('/reclutamiento'), 'sin aprobar, no puede publicar', nueva.url())

const admin = await entrar('admin@qa.aiuto.test', '**/panel')
await admin.goto(`${B}/panel/empresas`)
const fila = admin.locator('li', { hasText: nombreNueva })
await fila.locator('button:has-text("Aprobar")').click()
// Las esperas van sobre la fila de esta empresa: otras filas pueden decir lo mismo.
const filaAprobada = admin.locator('li', { hasText: nombreNueva })
await filaAprobada.locator('button:has-text("Asignar licencia")').waitFor({ timeout: 30000 })
await filaAprobada.locator('input[name=vacantesActivas]').fill('1')
await filaAprobada.locator('button:has-text("Asignar licencia")').click()
await filaAprobada.getByText('de 1 vacantes abiertas').waitFor({ timeout: 30000 })
const compania = await db.company.findFirstOrThrow({ where: { nombre: nombreNueva } })
ok(compania.estado === 'APROBADA', 'el administrador la aprueba')
ok((await db.licencia.count({ where: { companyId: compania.id, estado: 'ACTIVA' } })) === 1, 'y le asigna licencia')

// Ya aprobada, publica una; la segunda choca con la licencia de 1
await nueva.goto(`${B}/reclutamiento/vacantes/nueva`)
async function capturar(puesto) {
  await nueva.selectOption('select[name=categoryId]', { index: 1 })
  await nueva.fill('input[name=puesto]', puesto)
  await nueva.fill('input[name=ubicacion]', 'Puebla, Puebla')
  await nueva.fill('textarea[name=descripcion]', 'Atender clientes y cerrar ventas en la región.')
  await nueva.fill('textarea[name=resultadosEsperados]', 'Llegar a la cuota trimestral.')
  await nueva.fill('input[name=sueldoMin]', '20000')
  await nueva.fill('input[name=sueldoMax]', '25000')
  await nueva.fill('textarea[name=prestaciones]', 'Ley y vales.')
  await nueva.fill('input[name=horario]', 'Lunes a viernes de 9 a 18.')
  await nueva.fill('input[name=conocimientos]', 'Ventas, CRM')
  await nueva.fill('input[name=numEntrevistas]', '2')
  await nueva.fill('input[name=diasCierreEsperado]', '20')
  await nueva.click('button:has-text("Publicar ahora")')
}
await capturar('Ejecutivo de ventas (QA)')
await nueva.waitForURL('**/reclutamiento/vacantes', { timeout: 60000 })
const publicada = await db.vacante.findFirst({ where: { companyId: compania.id, estado: 'ABIERTA' } })
ok(Boolean(publicada), 'publica a su nombre')
ok(publicada && Math.round((publicada.expiraEn - publicada.publicadaEn) / 86400000) === 30, 'con vigencia de 30 días')

await nueva.goto(`${B}/reclutamiento/vacantes/nueva`)
await capturar('Segundo ejecutivo (QA)')
const choca = await nueva
  .waitForFunction(() => /licencia permite 1/i.test(document.body.innerText), null, { timeout: 30000 })
  .then(() => true)
  .catch(() => false)
ok(choca, 'la segunda choca con la licencia')
ok((await db.vacante.count({ where: { companyId: compania.id, estado: 'ABIERTA' } })) === 1, 'y no se publica')

await nav.close()
await db.$disconnect()
console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
process.exit(fallos === 0 ? 0 : 1)

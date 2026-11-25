import { chromium } from 'playwright'
const B = process.env.BASE ?? 'http://localhost:3100'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }

const nav = await chromium.launch()

// El pase del arnés en todas las páginas: entrar y registrarse tienen tope por
// IP y esta suite entra varias veces. Sin TAREAS_SECRET la cabecera va vacía y
// el servidor la ignora.
const conPase = (o = {}) => ({ ...o, extraHTTPHeaders: { ...(o.extraHTTPHeaders ?? {}), 'x-aiuto-pase': process.env.TAREAS_SECRET ?? '' } })
const _nuevoContexto = nav.newContext.bind(nav)
const _nuevaPagina = nav.newPage.bind(nav)
nav.newContext = (o) => _nuevoContexto(conPase(o))
nav.newPage = (o) => _nuevaPagina(conPase(o))
const p = await nav.newPage({ viewport: { width: 1280, height: 800 } })
await p.goto(`${B}/entrar`, { waitUntil: 'load' })
await p.fill('input[name=email]', 'egresado@qa.aiuto.test')
await p.fill('input[name=password]', 'aiuto123')
await p.click('button[type=submit]')
await p.waitForURL('**/mi', { timeout: 40000 })
await p.goto(`${B}/mi/perfil`, { waitUntil: 'load' })
await p.waitForTimeout(400)

ok((await p.locator('body').innerText()).includes('Faltan'), 'dice qué le falta al perfil')
ok(await p.locator('text=Cuando hay prisa por agendar').count() > 0, 'y explica por qué importa cada cosa')

// Que un campo pase por detrás de una barra fija al desplazar es normal. Lo que
// importa es que SIEMPRE se pueda ver: al llegar abajo, el último campo tiene
// que quedar completo por encima de la barra.
// Hasta el final del formulario principal, no de la página: debajo vienen la
// trayectoria y las evidencias.
await p.evaluate(() => {
  const forma = document.querySelector('form[aria-label="Mi perfil"]')
  window.scrollTo(0, forma.getBoundingClientRect().bottom + window.scrollY - window.innerHeight)
})
await p.waitForTimeout(500)
const abajo = await p.evaluate(() => {
  const forma = document.querySelector('form[aria-label="Mi perfil"]')
  const barra = forma.querySelector('.sticky').getBoundingClientRect()
  const campos = [...forma.querySelectorAll('input:not([type=hidden]), textarea, select')]
  const ultimo = campos.at(-1).getBoundingClientRect()
  return { libre: ultimo.bottom <= barra.top, hueco: Math.round(barra.top - ultimo.bottom) }
})
ok(abajo.libre, 'al llegar abajo, el último campo queda por encima de la barra', `${abajo.hueco}px de holgura`)

// Y la barra tiene que estar siempre al alcance
const visible = await p.evaluate(() => {
  const b = document.querySelector('form .sticky').getBoundingClientRect()
  return b.bottom <= innerHeight + 1 && b.top >= 0
})
ok(visible, 'la barra de guardar está siempre a la vista')

// Guardar de verdad, desde media página
await p.evaluate(() => window.scrollTo(0, 400))
await p.fill('input[name=telefono]', '4491234567')
await p.click('button:has-text("Guardar cambios")')
await p.waitForFunction(() => document.body.innerText.includes('Guardado'), null, { timeout: 30000 }).catch(() => {})
ok((await p.locator('body').innerText()).includes('Guardado'), 'se guarda sin bajar al final')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
await nav.close()
process.exit(fallos === 0 ? 0 : 1)

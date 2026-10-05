import { chromium } from 'playwright'

const LANDING = 'http://localhost:8080'
const API = 'http://localhost:3100'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }

// Chrome bloquea peticiones a red local desde una pagina, y en headless deniega
// el permiso solo. Se relaja SOLO eso: CORS sigue vigente, y lo comprueba el
// control negativo del final. En produccion ambos son sitios publicos y la
// restriccion no aplica.
const nav = await chromium.launch({
  args: ['--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests'],
})
const ctx = await nav.newContext({ viewport: { width: 1440, height: 1100 } })

// La landing publicada apunta a app.aiuto.com.mx; para probar contra el local
// se le inyecta el <meta name="aiuto-api">, que es justo para lo que existe.
await ctx.route('**/*.html', async (ruta) => {
  const r = await ruta.fetch()
  let html = await r.text()
  html = html.replace('<link rel="stylesheet" href="styles.css">',
    `<meta name="aiuto-api" content="${API}"><link rel="stylesheet" href="styles.css">`)
  await ruta.fulfill({ response: r, body: html })
})

const p = await ctx.newPage()
const sello = Date.now()
const correo = `landing.${sello}@qa.aiuto.test`

// --- 1. El formulario de contacto escribe de verdad ---
await p.goto(`${LANDING}/contacto.html`, { waitUntil: 'load' })
await p.fill('input[name=nombre]', 'Landing Prueba')
await p.fill('input[name=email]', correo)
await p.fill('input[name=telefono]', '3312345678')
await p.fill('input[name=empresa]', 'Empresa Landing')
await p.selectOption('select[name=tipo]', 'Publicar una vacante')
await p.selectOption('select[name=categoria]', 'Capital Humano')
await p.fill('textarea[name=necesidad]', 'Queremos publicar dos vacantes de planta.')
await p.click('button[type=submit]')
await p.waitForTimeout(4000)

const texto = await p.locator('body').innerText()
ok(!texto.includes('No pudimos enviar'), 'el envío no reporta error')
ok(texto.includes('Solicitud enviada') || texto.includes('Gracias'), 'muestra el acuse en pantalla')

// --- 2. Validación en cliente sigue funcionando ---
const p2 = await ctx.newPage()
await p2.goto(`${LANDING}/contacto.html`, { waitUntil: 'load' })
await p2.fill('input[name=nombre]', 'Sin Correo')
await p2.fill('textarea[name=necesidad]', 'algo')
await p2.click('button[type=submit]')
await p2.waitForTimeout(1200)
ok((await p2.locator('.error').count()) > 0, 'sin correo, marca el campo y no envía')

// --- 3. bolsa.html apunta a la bolsa real ---
// No se sigue la redireccion: app.aiuto.com.mx todavia no resuelve. Se comprueba
// que la pagina ya no tiene vacantes inventadas y que apunta al destino correcto.
const p3 = await ctx.newPage()
await ctx.unroute('**/*.html')
const cuerpo = await (await fetch(`${LANDING}/bolsa.html`)).text()
ok(cuerpo.includes('https://app.aiuto.com.mx/bolsa'), 'bolsa.html apunta a la bolsa real')
ok(cuerpo.includes('rel="canonical" href="https://app.aiuto.com.mx/bolsa"'), 'con el canonico al destino')
ok(!/Desarrollador Senior|data-job-count/.test(cuerpo), 'y ya no tiene vacantes inventadas')

// --- 4. Control negativo: un origen ajeno SIGUE bloqueado ---
const ajena = await nav.newContext()
const p4 = await ajena.newPage()
await p4.goto('data:text/html,<p>origen ajeno</p>')
const bloqueado = await p4.evaluate(async (api) => {
  try {
    await fetch(api + '/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'CONTACTO', nombre: 'Intruso', correo: 'x@y.mx', mensaje: 'hola', origen: 'ajeno' }),
    })
    return false
  } catch (_) { return true }
}, API)
ok(bloqueado, 'un origen ajeno sigue bloqueado por CORS')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
console.log(`correo usado: ${correo}`)
await nav.close()
process.exit(fallos === 0 ? 0 : 1)

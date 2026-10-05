import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:3100'
const PASS = 'aiuto123'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }
const txt = (p, t, ms = 40000) =>
  p.waitForFunction((x) => document.body.innerText.toLowerCase().includes(x.toLowerCase()), t, { timeout: ms })
   .then(() => true).catch(() => false)

const nav = await chromium.launch()

// ---------- 1. Candidato de QA entra y ve su historial ----------
let ctx = await nav.newContext({ viewport: { width: 1440, height: 1100 } })
let p = await ctx.newPage()

await p.goto(`${BASE}/mi`, { waitUntil: 'load' })
ok(p.url().includes('/entrar'), 'sin sesion /mi manda a /entrar')

await p.fill('input[name=email]', 'candidato@qa.aiuto.test')
await p.fill('input[name=password]', PASS)
await p.click('button[type=submit]')
await p.waitForURL('**/mi', { timeout: 60000 })
ok(p.url().endsWith('/mi'), 'el candidato cae en /mi, no en /panel')
ok(await txt(p, 'Carla Candidata'), 'lo saluda por nombre')
ok(await txt(p, 'Ingeniera de plataforma'), 've la vacante a la que aplico')
ok(await txt(p, 'Entrevista'), 'el avance marca el paso donde va')
ok(await txt(p, 'poner en contacto contigo para agendarla'), 'y lo explica en palabras')
await p.screenshot({ path: `${process.env.SALIDA}/mi-postulaciones.png`, fullPage: true })

// El panel del equipo le queda cerrado
await p.goto(`${BASE}/panel`, { waitUntil: 'load' })
ok(!p.url().includes('/panel') || p.url().includes('/entrar'), 'el panel del equipo le queda cerrado', p.url())

// ---------- 2. Perfil ----------
await p.goto(`${BASE}/mi/perfil`, { waitUntil: 'load' })
ok(await txt(p, 'roster preferencial'), 've su distintivo de roster')
await p.fill('input[name=titular]', 'Desarrolladora backend senior')
await p.fill('input[name=codigoPostal]', '123')   // invalido
await p.click('button:has-text("Guardar cambios")')
ok(await txt(p, 'código postal son 5'), 'rechaza un CP invalido')
ok(
  (await p.inputValue('input[name=titular]')) === 'Desarrolladora backend senior',
  'y NO pierde lo que ya habia escrito',
)

await p.fill('input[name=codigoPostal]', '44190')
await p.click('button:has-text("Guardar cambios")')
ok(await txt(p, 'Guardado'), 'guarda el perfil corregido')
await p.reload({ waitUntil: 'load' })
ok((await p.inputValue('input[name=titular]')) === 'Desarrolladora backend senior', 'el cambio persiste')
await p.screenshot({ path: `${process.env.SALIDA}/mi-perfil.png`, fullPage: true })

// ---------- 3. Registro nuevo que hereda su historial ----------
const nuevo = `nuevo.${Date.now()}@qa.aiuto.test`
const anon = await nav.newContext()
const pa = await anon.newPage()

// Primero se postula SIN cuenta
await pa.goto(`${BASE}/bolsa/qa-soldador-certificado`, { waitUntil: 'load' })
await pa.fill('input[name=nombre]', 'Persona Sin Cuenta')
await pa.fill('input[name=correo]', nuevo)
await pa.click('button:has-text("Enviar postulación")')
ok(await txt(pa, 'ya quedó tu postulación'), 'se postula sin cuenta')

// Ahora se registra con el mismo correo
await pa.goto(`${BASE}/registro`, { waitUntil: 'load' })
await pa.fill('input[name=nombre]', 'Persona Sin Cuenta')
await pa.fill('input[name=correo]', nuevo)
await pa.fill('input[name=password]', 'corta')
await pa.click('button:has-text("Crear mi cuenta")')
ok(await txt(pa, 'al menos 8 caracteres'), 'rechaza contrasena corta')
ok((await pa.inputValue('input[name=correo]')) === nuevo, 'y conserva el correo capturado')
ok(!(await pa.content()).includes('corta'), 'la contrasena no aparece en el HTML de la respuesta')

// El formulario se remonta al rechazar. Hay que esperar a que ese remontaje
// termine antes de volver a escribir, o lo tecleado se pierde.
await pa.waitForFunction(
  () => document.querySelector('input[name=password]')?.value === '',
  null,
  { timeout: 15000 },
).catch(() => {})

await pa.fill('input[name=nombre]', 'Persona Sin Cuenta')
await pa.fill('input[name=correo]', nuevo)
await pa.fill('input[name=password]', 'unaClaveLarga123')
await pa.click('button:has-text("Crear mi cuenta")')
const llego = await pa.waitForURL('**/mi/perfil', { timeout: 60000 }).then(() => true).catch(() => false)
if (!llego) {
  console.log('    [diag] url:', pa.url())
  console.log('    [diag] alertas:', (await pa.locator('[role=alert]').allTextContents()).join(' | ').slice(0, 200))
  console.log('    [diag] correo:', await pa.inputValue('input[name=correo]').catch(() => 'sin campo'))
}
ok(llego, 'tras registrarse cae en su perfil')
await pa.goto(`${BASE}/mi`, { waitUntil: 'load' })
ok(await txt(pa, 'Soldador certificado'), 'encuentra la postulacion que hizo SIN cuenta')

// Correo repetido
const otro = await nav.newContext().then(c => c.newPage())
await otro.goto(`${BASE}/registro`, { waitUntil: 'load' })
await otro.fill('input[name=nombre]', 'Otra Persona')
await otro.fill('input[name=correo]', nuevo)
await otro.fill('input[name=password]', 'unaClaveLarga123')
await otro.click('button:has-text("Crear mi cuenta")')
ok(await txt(otro, 'Ya hay una cuenta'), 'no deja registrar un correo repetido')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
await nav.close()
process.exit(fallos === 0 ? 0 : 1)

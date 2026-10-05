import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:3100'
const CORREO = 'admin@qa.aiuto.test'
const PASS = process.env.PASS ?? 'aiuto123'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }

/** Espera un texto en la pagina. Las acciones de servidor no navegan, asi que
 *  esperar el evento de carga no sirve: ya ocurrio. */
// Sin distinguir mayusculas: innerText aplica text-transform, y las etiquetas
// del sistema van en versalitas.
const esperaTexto = (p, texto, ms = 40000) =>
  p.waitForFunction(
    (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
    texto,
    { timeout: ms },
  ).then(() => true).catch(() => false)

const nav = await chromium.launch()
const p = await nav.newContext({ viewport: { width: 1440, height: 1000 } }).then(c => c.newPage())

// 1. Sin sesion, el panel esta cerrado
await p.goto(`${BASE}/panel`, { waitUntil: 'load' })
ok(p.url().includes('/entrar'), 'sin sesion /panel manda a /entrar')

// 2. Contrasena incorrecta
await p.fill('input[name=email]', CORREO)
await p.fill('input[name=password]', 'incorrecta')
await p.click('button[type=submit]')
ok(await esperaTexto(p, 'Correo o contraseña incorrectos'), 'contrasena mala muestra el error')
ok(p.url().includes('/entrar'), 'y no deja entrar')

// 3. Login correcto (se llenan los dos campos: el re-render vacio el formulario)
await p.fill('input[name=email]', CORREO)
await p.fill('input[name=password]', PASS)
await p.click('button[type=submit]')
await p.waitForURL('**/panel', { timeout: 60000 })
ok(p.url().endsWith('/panel'), 'entra al panel')
ok(await esperaTexto(p, 'Ana Admin'), 'saluda por nombre')
await p.screenshot({ path: `${process.env.SALIDA}/panel-bandeja.png`, fullPage: true })

// Cuantas hay antes de publicar, para comparar despues sin fijar un numero.
const previa = await nav.newContext().then(c => c.newPage())
await previa.goto(`${BASE}/bolsa`, { waitUntil: 'load' })
const cuentaAntes = Number((await previa.content()).match(/<h1[^>]*>(\d+) vacantes?/)?.[1] ?? 0)
await previa.close()

// 4. El formulario rechaza un sueldo maximo menor que el minimo
await p.goto(`${BASE}/panel/vacantes/nueva`, { waitUntil: 'load' })
await p.screenshot({ path: `${process.env.SALIDA}/panel-nueva-vacante.png`, fullPage: true })

const llenar = async (sueldoMax) => {
  await p.fill('input[name=empresa]', 'Aceros del Pacifico')
  await p.selectOption('select[name=categoryId]', { index: 1 })
  await p.fill('input[name=puesto]', 'Jefe de Producción')
  await p.fill('input[name=ubicacion]', 'Manzanillo, Colima')
  await p.selectOption('select[name=modalidad]', 'HIBRIDO')
  await p.fill('textarea[name=descripcion]', 'Dirigir la planta y el equipo de turno.')
  await p.fill('input[name=sueldoMin]', '50000')
  await p.fill('input[name=sueldoMax]', sueldoMax)
  await p.selectOption('select[name=seguroSocial]', 'COMPLETO')
  await p.fill('textarea[name=prestaciones]', 'Ley, fondo de ahorro, comedor.')
  await p.fill('input[name=horario]', 'Turno matutino, lunes a sábado.')
  await p.fill('input[name=conocimientos]', 'Lean, SMED, Seguridad industrial')
  await p.fill('input[name=numEntrevistas]', '2')
  await p.fill('input[name=diasCierreEsperado]', '30')
}

await llenar('40000')
await p.click('button[name=publicar][value=si]')
ok(await esperaTexto(p, 'Faltan'), 'rechaza sueldo maximo menor que el minimo')
ok(p.url().includes('/nueva'), 'y se queda en el formulario')

// 5. Al rechazar, lo capturado sigue ahi: se corrige solo el campo malo.
ok((await p.inputValue('input[name=puesto]')) === 'Jefe de Producción', 'conserva el puesto capturado')
ok((await p.inputValue('input[name=empresa]')) === 'Aceros del Pacifico', 'conserva la empresa')
ok((await p.inputValue('textarea[name=prestaciones]')).includes('fondo de ahorro'), 'conserva las prestaciones')
ok((await p.inputValue('input[name=conocimientos]')).includes('SMED'), 'conserva los conocimientos')
ok((await p.inputValue('select[name=categoryId]')) !== '', 'conserva la categoria elegida')
ok((await p.inputValue('select[name=modalidad]')) === 'HIBRIDO', 'conserva la modalidad')

await p.fill('input[name=sueldoMax]', '62000')
await p.click('button[name=publicar][value=si]')
await p.waitForURL('**/panel/vacantes', { timeout: 60000 })
ok(await esperaTexto(p, 'Jefe de Producción'), 'la vacante aparece en el panel')
ok(await esperaTexto(p, '$50,000 – $62,000 MXN mensuales'), 'con su sueldo')
ok(await esperaTexto(p, 'Abierta'), 'publicada como abierta')
await p.screenshot({ path: `${process.env.SALIDA}/panel-vacantes.png`, fullPage: true })

// 6. Ya se ve en la bolsa publica, sin sesion
const anon = await nav.newContext()
const pa = await anon.newPage()
await pa.goto(`${BASE}/bolsa`, { waitUntil: 'load' })
const cuentaDespues = Number(
  (await pa.content()).match(/<h1[^>]*>(\d+) vacantes?/)?.[1] ?? 0,
)
ok(await esperaTexto(pa, 'Jefe de Producción'), 'sale en la bolsa publica')
ok(cuentaDespues === cuentaAntes + 1, 'el conteo sube en uno al publicar', `${cuentaAntes} → ${cuentaDespues}`)

// 7. El panel sigue cerrado para quien no tiene sesion
await pa.goto(`${BASE}/panel/vacantes`, { waitUntil: 'load' })
ok(pa.url().includes('/entrar'), 'el panel sigue cerrado sin sesion')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
await nav.close()
process.exit(fallos === 0 ? 0 : 1)

import { chromium } from 'playwright'
const B = process.env.BASE ?? 'http://localhost:3100'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }
const txt = (p, t, ms = 20000) => p.waitForFunction(
  (x) => document.body.innerText.toLowerCase().includes(x.toLowerCase()), t, { timeout: ms }
).then(() => true).catch(() => false)

const nav = await chromium.launch()
const p = await nav.newPage({ viewport: { width: 1440, height: 1200 } })
await p.goto(`${B}/entrar`, { waitUntil: 'load' })
await p.fill('input[name=email]', 'admin@qa.aiuto.test')
await p.fill('input[name=password]', 'aiuto123')
await p.click('button[type=submit]')
await p.waitForURL('**/panel', { timeout: 30000 })
ok(true, 'entra con la contraseña corta aiuto123')

// --- relleno de ejemplo ---
await p.goto(`${B}/panel/vacantes/nueva`, { waitUntil: 'load' })
ok(await p.locator('button:has-text("datos de ejemplo")').count() > 0, 'el botón de ejemplo aparece en modo QA')
await p.click('button:has-text("datos de ejemplo")')
await p.waitForTimeout(500)
ok((await p.inputValue('input[name=puesto]')) === 'Jefe de producción', 'llena el puesto')
ok((await p.inputValue('input[name=sueldoMin]')) === '48000', 'llena el sueldo')
ok((await p.inputValue('select[name=categoryId]')) !== '', 'elige categoría')
await p.screenshot({ path: `${process.env.SALIDA}/panel-ejemplo.png`, fullPage: true })

await p.click('button[name=publicar][value=si]')
await p.waitForURL('**/panel/vacantes', { timeout: 30000 })
ok(await txt(p, 'Jefe de producción'), 'se publica de un clic')

// --- editar ---
const fila = p.locator('li', { hasText: 'Jefe de producción' }).first()
await fila.locator('a:has-text("Editar")').click()
await p.waitForURL('**/editar', { timeout: 20000 })
ok((await p.inputValue('input[name=puesto]')) === 'Jefe de producción', 'el formulario llega precargado')
ok((await p.inputValue('input[name=sueldoMax]')) === '62000', 'con el sueldo actual')
ok((await p.inputValue('select[name=modalidad]')) === 'HIBRIDO', 'y con la modalidad actual')
await p.screenshot({ path: `${process.env.SALIDA}/panel-editar.png`, fullPage: true })

await p.fill('input[name=puesto]', 'Jefe de producción corregido')
await p.fill('input[name=sueldoMin]', '52000')
await p.click('button:has-text("Guardar cambios")')
await p.waitForURL('**/panel/vacantes', { timeout: 30000 })
ok(await txt(p, 'Jefe de producción corregido'), 'el cambio se guarda')
ok(await txt(p, '$52,000'), 'con el sueldo nuevo')

// La edicion tambien respeta las reglas
await fila.locator('a:has-text("Editar")').first().click().catch(async () => {
  await p.locator('a:has-text("Editar")').first().click()
})
await p.waitForURL('**/editar', { timeout: 20000 })
await p.fill('input[name=sueldoMax]', '100')
await p.click('button:has-text("Guardar cambios")')
ok(await txt(p, 'Faltan'), 'editar no deja saltarse la validación del sueldo')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
await nav.close()
process.exit(fallos === 0 ? 0 : 1)

const BASE = process.env.BASE ?? 'http://localhost:3100'
// Pase del arnes: evita chocar con el tope de peticiones al repetir suites.
const PASE = process.env.TAREAS_SECRET ?? ''
let fallos = 0

const ok = (cond, etiqueta, detalle = '') => {
  console.log(`${cond ? '  ok  ' : ' FALLA'} ${etiqueta}${detalle ? ' — ' + detalle : ''}`)
  if (!cond) fallos++
}

const correo = `prueba.${Date.now()}@ejemplo.mx`
const SLUG = 'qa-ingeniera-plataforma'

// 1. Listado
let r = await fetch(`${BASE}/bolsa`)
let html = await r.text()
ok(r.status === 200, 'GET /bolsa responde 200')
const cuenta = Number(html.match(/<h1[^>]*>(\d+) vacantes?/)?.[1] ?? 0)
ok(cuenta >= 15, 'el listado trae las vacantes abiertas', `${cuenta} en la bolsa`)
ok(html.includes('$70,000 – $95,000 MXN mensuales'), 'el sueldo se muestra en el listado')
ok(html.includes('IMSS sobre el 40 % del sueldo'), 'el seguro social parcial se declara')

// 2. Filtro por categoría
r = await fetch(`${BASE}/bolsa?categoria=tecnologia`)
html = await r.text()
ok(html.includes('3 vacantes'), 'el filtro por categoría acota a las de tecnología')

// 2b. Lo que NO debe verse: borrador, cubierta y expirada
r = await fetch(`${BASE}/bolsa`)
html = await r.text()
ok(!html.includes('Analista de nómina'), 'un borrador no se publica')
ok(!html.includes('Supervisor de corte'), 'una cerrada tampoco')
ok(!html.includes('Contador general'), 'una vacante cubierta desaparece')
ok(!html.includes('Coordinador de marketing'), 'una vacante expirada desaparece')

for (const [slug, que] of [
  ['qa-analista-nomina', 'borrador'],
  ['qa-contador-general', 'cubierta'],
  ['qa-coordinador-marketing', 'expirada'],
]) {
  const rr = await fetch(`${BASE}/bolsa/${slug}`)
  ok(rr.status === 404, `el detalle de una vacante ${que} da 404`)
}

// 3. Detalle
r = await fetch(`${BASE}/bolsa/${SLUG}`)
html = await r.text()
ok(r.status === 200, 'GET detalle responde 200')
ok(html.includes('4 entrevistas en el proceso'), 'el detalle declara las entrevistas')
ok(html.includes('espera cerrar en 50 días'), 'el detalle declara el plazo de cierre')

// 4. Vacante inexistente
r = await fetch(`${BASE}/bolsa/no-existe-esta`)
ok(r.status === 404, 'una vacante inexistente da 404')

// 5. Postulación válida
r = await fetch(`${BASE}/api/postulaciones`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-aiuto-pase': PASE },
  body: JSON.stringify({ vacanteSlug: SLUG, nombre: 'Ana Ruiz', correo, telefono: '5551234567' }),
})
let cuerpo = await r.json()
ok(r.status === 201, 'POST postulación responde 201', `status ${r.status}`)
ok(typeof cuerpo.token === 'string' && cuerpo.token.length > 10, 'devuelve token de consulta')
const token = cuerpo.token

// 6. Estado de la postulación
r = await fetch(`${BASE}/postulacion/${token}`)
html = await r.text()
ok(r.status === 200, 'GET estado responde 200')
ok(html.includes('Recibimos tu postulación'), 'el estado inicial se explica en palabras')
ok(html.includes('Ingeniera de plataforma'), 'el estado nombra la vacante')

// 7. Postulación duplicada
r = await fetch(`${BASE}/api/postulaciones`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-aiuto-pase': PASE },
  body: JSON.stringify({ vacanteSlug: SLUG, nombre: 'Ana Ruiz', correo }),
})
ok(r.status === 409, 'una segunda postulación con el mismo correo da 409')

// 8. Validación
r = await fetch(`${BASE}/api/postulaciones`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-aiuto-pase': PASE },
  body: JSON.stringify({ vacanteSlug: SLUG, nombre: 'x', correo: 'no-es-correo' }),
})
cuerpo = await r.json()
ok(r.status === 422, 'datos inválidos dan 422')
ok(cuerpo.fallas?.some((f) => f.campo === 'correo'), 'señala el campo correo')

// 9. Honeypot: el robot recibe 201 y no se guarda nada
const correoBot = `bot.${Date.now()}@ejemplo.mx`
r = await fetch(`${BASE}/api/postulaciones`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-aiuto-pase': PASE },
  body: JSON.stringify({ vacanteSlug: SLUG, nombre: 'Robot', correo: correoBot, sitioWeb: 'spam.example' }),
})
cuerpo = await r.json()
ok(r.status === 201 && !cuerpo.token, 'el honeypot responde 201 sin guardar')

// 10. Token inexistente
r = await fetch(`${BASE}/postulacion/token-que-no-existe`)
ok(r.status === 404, 'un token inválido da 404')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
process.exit(fallos === 0 ? 0 : 1)

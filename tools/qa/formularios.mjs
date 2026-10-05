const BASE = process.env.BASE ?? 'http://localhost:3100'
// Pase del arnes: evita chocar con el tope de peticiones al repetir suites.
const PASE = process.env.TAREAS_SECRET ?? ''
const SECRET = process.env.TAREAS_SECRET ?? 'prueba-local'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }
const post = (ruta, cuerpo, extra = {}) =>
  fetch(BASE + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-aiuto-pase': PASE, ...extra }, body: JSON.stringify(cuerpo) })

const sello = Date.now()

// --- Asesoría ---
let r = await fetch(`${BASE}/asesoria`)
let html = await r.text()
ok(r.status === 200, 'GET /asesoria responde 200')
ok(html.includes('$2,500') && html.includes('$3,500') && html.includes('$5,000'), 'muestra los tres precios')
ok(html.includes('Roster preferencial'), 'menciona el roster preferencial')

r = await post('/api/asesorias', { nombre: 'Luz Pérez', correo: `ase.${sello}@ejemplo.mx`, nivel: 'GERENCIA' })
ok(r.status === 201, 'POST asesoría responde 201', `status ${r.status}`)

r = await post('/api/asesorias', { nombre: 'X', correo: 'malo', nivel: 'GERENCIA' })
ok(r.status === 422, 'asesoría con correo inválido da 422')

r = await post('/api/asesorias', { nombre: 'Robot', correo: `bot.${sello}@ejemplo.mx`, nivel: 'ESTUDIANTE', sitioWeb: 'spam' })
ok(r.status === 201 && (await r.json()).ok, 'honeypot de asesoría responde 201')

r = await post('/api/asesorias', { nombre: 'Y Z', correo: `n.${sello}@ejemplo.mx`, nivel: 'INVENTADO' })
ok(r.status === 422, 'nivel inexistente da 422')

// --- Contacto ---
r = await fetch(`${BASE}/contacto`)
ok(r.status === 200, 'GET /contacto responde 200')

r = await post('/api/solicitudes', {
  tipo: 'CATEGORIA', categoriaSlug: 'tecnologia', nombre: 'Marco Díaz',
  correo: `sol.${sello}@ejemplo.mx`, mensaje: 'Necesitamos ayuda con un ERP.', origen: 'contacto',
})
ok(r.status === 201, 'POST solicitud responde 201', `status ${r.status}`)

r = await post('/api/solicitudes', { tipo: 'CONTACTO', nombre: 'A B', correo: `v.${sello}@ejemplo.mx`, mensaje: '', origen: 'contacto' })
ok(r.status === 422, 'solicitud sin mensaje da 422')

// --- Aviso de privacidad ---
r = await fetch(`${BASE}/privacidad`)
html = await r.text()
ok(r.status === 200, 'GET /privacidad responde 200')
ok(html.includes('ARCO'), 'explica los derechos ARCO')
ok(html.includes('Borrador pendiente de revisión legal'), 'se marca como borrador')

// --- Cierre automático ---
r = await post('/api/tareas/cerrar-vencidas', {})
ok(r.status === 401, 'la tarea sin credencial da 401')

r = await post('/api/tareas/cerrar-vencidas', {}, { authorization: 'Bearer equivocado' })
ok(r.status === 401, 'la tarea con credencial mala da 401')

r = await post('/api/tareas/cerrar-vencidas', {}, { authorization: `Bearer ${SECRET}` })
let cuerpo = await r.json()
ok(r.status === 200 && cuerpo.ok, 'la tarea con credencial corre', JSON.stringify(cuerpo))
ok(typeof cuerpo.cerradas === 'number', 'reporta cuántas cerró')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
process.exit(fallos === 0 ? 0 : 1)

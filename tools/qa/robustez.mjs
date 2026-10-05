const B = process.env.BASE ?? 'http://localhost:3100'
// Pase del arnes: evita chocar con el tope al repetir suites.
const PASE = process.env.TAREAS_SECRET ?? ''
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }
const txt = async (r) => (await r.text())

// --- búsqueda ---
let html = await txt(await fetch(`${B}/bolsa?q=soldador`))
ok(html.includes('Soldador certificado'), 'busca por puesto')
ok(!html.includes('Contador general'), 'y no trae lo que no empata')

html = await txt(await fetch(`${B}/bolsa?q=Kubernetes`))
ok(html.includes('Ingeniera de plataforma'), 'busca dentro de los conocimientos')

html = await txt(await fetch(`${B}/bolsa?q=Nube Verde`))
ok(html.includes('Ingeniera de plataforma'), 'busca por nombre de empresa')

html = await txt(await fetch(`${B}/bolsa?q=Sinaloa`))
ok(/Agroexporta|Culiac/.test(html), 'busca por ubicación')

html = await txt(await fetch(`${B}/bolsa?modalidad=REMOTO`))
ok(!html.includes('Soldador certificado'), 'el filtro de modalidad excluye lo presencial')

html = await txt(await fetch(`${B}/bolsa?desde=100000`))
ok(html.includes('Director de planeación'), 'el piso de sueldo trae los altos')
ok(!html.includes('Auxiliar contable'), 'y deja fuera los bajos')

html = await txt(await fetch(`${B}/bolsa?q=noexistenadaasi`))
ok(html.includes('Nada que empate'), 'sin resultados lo dice claro')

// La búsqueda NO debe resucitar vacantes vencidas ni borradores
html = await txt(await fetch(`${B}/bolsa?q=marketing`))
ok(!html.includes('Coordinador de marketing'), 'una vacante expirada no reaparece al buscar')
html = await txt(await fetch(`${B}/bolsa?q=nómina`))
ok(!html.includes('Analista de nómina'), 'un borrador tampoco')

// --- datos estructurados ---
html = await txt(await fetch(`${B}/bolsa/qa-ingeniera-plataforma`))
const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1]
ok(Boolean(ld), 'el detalle trae JSON-LD')
if (ld) {
  const j = JSON.parse(ld)
  ok(j['@type'] === 'JobPosting', 'declarado como JobPosting')
  ok(j.baseSalary?.value?.minValue === 70000, 'con el sueldo dentro')
  ok(j.jobLocationType === 'TELECOMMUTE', 'y el remoto declarado')
  ok(Boolean(j.validThrough), 'con fecha de vigencia')
}

// --- sitemap y robots ---
const sm = await fetch(`${B}/sitemap.xml`)
const xml = await txt(sm)
ok(sm.status === 200, 'hay sitemap')
ok(xml.includes('/bolsa/qa-ingeniera-plataforma'), 'incluye las vacantes')
ok(xml.includes('/empresa/'), 'e incluye las empresas')
ok(!xml.includes('/panel'), 'y NO incluye el panel')

const rb = await txt(await fetch(`${B}/robots.txt`))
ok(rb.includes('Disallow: /panel'), 'robots bloquea el panel')
ok(rb.includes('Disallow: /postulacion'), 'y las ligas de postulación')
ok(rb.includes('Sitemap:'), 'y apunta al sitemap')

// --- 404 ---
const r404 = await fetch(`${B}/una-ruta-que-no-existe`)
ok(r404.status === 404, 'una ruta inexistente da 404')
ok((await txt(r404)).includes('Aquí no hay nada'), 'con la página propia, no la genérica')

// --- el pase del arnés funciona ---
const conPase = await fetch(`${B}/api/asesorias`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-aiuto-pase': PASE },
  body: JSON.stringify({ nombre: 'Con Pase', correo: `pase.${Date.now()}@qa.aiuto.test`, nivel: 'ESTUDIANTE' }),
})
ok(conPase.status === 201, 'con el pase del arnés el endpoint responde', `status ${conPase.status}`)

// --- límite de peticiones ---
// Sin el pase, a proposito. No se comprueba "cuantos pasan" porque eso exigiria
// cuota fresca y esta suite se corre varias veces por hora desde la misma IP:
// lo que importa es que el tope exista y que diga cuanto esperar.
const correo = () => `lim.${Math.random().toString(36).slice(2)}@qa.aiuto.test`
let bloqueada = null
for (let i = 0; i < 13 && !bloqueada; i++) {
  const r = await fetch(`${B}/api/asesorias`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Insistente Prueba', correo: correo(), nivel: 'ESTUDIANTE' }),
  })
  if (r.status === 429) bloqueada = r
}
ok(bloqueada !== null, 'quien insiste sin pase acaba recibiendo 429')
ok(bloqueada?.headers.get('retry-after') !== null, 'y se le dice cuántos segundos esperar')
const cuerpo429 = bloqueada ? await bloqueada.json() : {}
ok(/espera|inténtalo/i.test(cuerpo429.error ?? ''), 'con un mensaje entendible, no un código pelón')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
process.exit(fallos === 0 ? 0 : 1)

// Puerta de salida: lo que tiene que ser cierto antes de abrir la beta.
// No escribe nada. Se puede correr cuantas veces haga falta, también contra producción.
//
//   BASE=https://aiuto-web-production.up.railway.app node tools/qa/salida.mjs
//   DOMINIO=https://aiuto.com.mx  (opcional) además revisa que el dominio ya sirva la app
//
// Lo que no se ve desde afuera y hay que revisar a mano (docs/mvp/OPERACION.md):
// MODO_QA apagado en Railway, respaldos activos, proveedor de correo y `--revisar` limpio.

const B = process.env.BASE ?? 'http://localhost:3100'
const D = process.env.DOMINIO
let fallos = 0
const ok = (c, e, d = '') => {
  console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`)
  if (!c) fallos++
}
const pedir = (ruta, init) => fetch(`${B}${ruta}`, { redirect: 'manual', ...init })
const texto = async (ruta) => (await pedir(ruta)).text()
// Lo que ve una persona: sin los scripts de hidratación de Next.
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '')

// --- la app responde y alcanza la base ---
const salud = await pedir('/api/salud')
const cuerpoSalud = await salud.json().catch(() => ({}))
ok(salud.status === 200 && cuerpoSalud.base === 'ok', 'salud: app y base arriba', `${salud.status}`)

// --- sin datos de prueba a la vista ---
const MARCAS_QA = /\/(bolsa|empresa)\/(qa|dev)-|aceros-del-pacifico|\(QA\)|qa\.aiuto\.test/
for (const ruta of ['/', '/bolsa', '/sueldos', '/sitemap.xml']) {
  ok(!MARCAS_QA.test(await texto(ruta)), `${ruta} no muestra nada de QA ni de dev`)
}
const qa = await pedir('/bolsa/qa-ingeniera-plataforma')
ok(qa.status === 404, 'el detalle de una vacante de QA ya no existe', String(qa.status))
const cuentaQA = await pedir('/empresa/qa-nube-verde')
ok(cuentaQA.status === 404, 'ni la página de una empresa de QA', String(cuentaQA.status))

// --- aviso de privacidad completo ---
const aviso = await texto('/privacidad')
ok(!aviso.includes('[PENDIENTE]'), 'el aviso no tiene pendientes')
ok(!/Borrador pendiente de revisi/.test(aviso), 'ni la leyenda de borrador')

// --- cabeceras de seguridad ---
const h = (await pedir('/')).headers
ok(/max-age=\d{7,}/.test(h.get('strict-transport-security') ?? ''), 'HSTS')
ok(h.get('x-content-type-options') === 'nosniff', 'nosniff')
ok(h.get('x-frame-options') === 'DENY', 'no se deja enmarcar')
ok(h.get('referrer-policy') === 'strict-origin-when-cross-origin', 'el Referer no saca ligas privadas')

// --- cuentas: se puede recuperar la contraseña y registrar una empresa ---
ok((await pedir('/recuperar')).status === 200, 'hay página para recuperar la contraseña')
ok((await pedir('/empresas/registro')).status === 200, 'hay registro de empresas')

// --- WhatsApp: con número real, y solo donde lo permite el §13 del máster prompt ---
const ligaWA = /https:\/\/wa\.me\/(\d+)/
for (const ruta of ['/', '/soluciones', '/empleabilidad']) {
  const m = (await texto(ruta)).match(ligaWA)
  ok(Boolean(m), `${ruta} tiene botón de WhatsApp`, m ? '' : 'falta WHATSAPP_NUMERO en Railway')
  if (m) ok(!/^52?1?0+$/.test(m[1]) && m[1].length >= 12, `${ruta}: el número no es de muestra`, m[1])
}
for (const ruta of ['/bolsa', '/entrar', '/registro', '/empresas/registro', '/nosotros']) {
  ok(!ligaWA.test(await texto(ruta)), `${ruta} no tiene WhatsApp (el reclutamiento va por la plataforma)`)
}

// --- nada de enlaces de relleno ni precios inventados en el sitio público ---
for (const ruta of ['/', '/nosotros', '/soluciones', '/empleabilidad', '/contacto']) {
  const html = visible(await texto(ruta))
  ok(!/href="#"/.test(html), `${ruta}: ningún enlace en #`)
  ok(!/\$\s?\d/.test(html), `${ruta}: no publica precios (§7.1)`)
}

// --- el dominio ya sirve la app, no la landing vieja de Hostinger ---
if (D) {
  const r = await fetch(`${D}/api/salud`).catch(() => null)
  const j = r ? await r.json().catch(() => ({})) : {}
  ok(r?.status === 200 && j.base === 'ok', `${D} apunta a la app`, r ? String(r.status) : 'no responde')
} else {
  console.log('  ··   DOMINIO no está definido: no se revisa a dónde apunta aiuto.com.mx')
}

console.log(fallos ? `\n${fallos} falla(s): NO se abre.` : '\nTodo en verde: se puede abrir.')
process.exit(fallos ? 1 : 0)

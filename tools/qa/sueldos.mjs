const B = process.env.BASE ?? 'http://localhost:3100'
let fallos = 0
const ok = (c, e, d = '') => { console.log(`${c ? '  ok  ' : ' FALLA'} ${e}${d ? ' — ' + d : ''}`); if (!c) fallos++ }

let html = await (await fetch(`${B}/sueldos`)).text()
ok(html.includes('Cuánto se paga'), 'GET /sueldos responde')
ok(html.includes('Todavía sin cifra') || html.includes('sin cifra'), 'declara las categorías sin muestra suficiente')
ok(html.includes('menos de 3'), 'dice cuál es el mínimo de muestra')
ok(html.includes('jornada máxima de ley'), 'explica cómo normaliza las periodicidades')
ok(!/\$0\b/.test(html.replace(/\\u0024/g, '$')), 'no publica un sueldo en cero')

const r = await fetch(`${B}/empresa/qa-nube-verde`)
html = await r.text()
ok(r.status === 200, 'GET de una empresa responde')
ok(html.includes('Nube Verde'), 'la nombra')
ok(html.includes('Lo que paga esta empresa'), 'muestra su resumen de sueldo')
ok(html.includes('se comprometió a pagar'), 'aclara de dónde salen las cifras')

const r404 = await fetch(`${B}/empresa/no-existe-esta-empresa`)
ok(r404.status === 404, 'una empresa inexistente da 404')

// Una empresa con pocas vacantes NO debe mostrar mediana
const pocas = await (await fetch(`${B}/empresa/qa-metalurgica-bajio`)).text()
ok(pocas.includes('no alcanza para hablar'), 'con pocas vacantes no inventa un sueldo típico')

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLAS'}`)
process.exit(fallos === 0 ? 0 : 1)

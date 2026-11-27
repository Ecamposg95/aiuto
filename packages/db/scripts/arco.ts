/**
 * Peticiones ARCO: qué datos tiene AIUTO de una persona y, si lo pide, borrarlos.
 * El plazo para contestar es de 20 días hábiles desde que llega la petición.
 *
 *   pnpm arco <correo>                              Acceso: lista lo que hay. No cambia nada.
 *   pnpm arco <correo> --borrar --confirmo <correo>  Cancelación: borra todo lo de ese correo.
 *
 * El correo va dos veces al borrar a propósito: que no se pueda borrar a otra
 * persona por un error al pegar. Antes de borrar en producción, toma un respaldo
 * manual (docs/mvp/OPERACION.md, "Respaldos").
 *
 * Qué NO se borra: los mensajes que la persona escribió como reclutadora de una
 * empresa (son de la empresa; quedan sin autor) y la bitácora del panel, que
 * guarda quién hizo qué y queda sin actor.
 */
import { PrismaClient } from '../generated/client/index.js'

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const correo = (args[0] ?? '').trim().toLowerCase()
const borrar = args.includes('--borrar')
const confirmado = (args[args.indexOf('--confirmo') + 1] ?? '').trim().toLowerCase()

if (!correo || !correo.includes('@')) {
  console.error('Uso: pnpm arco <correo> [--borrar --confirmo <correo>]')
  process.exit(1)
}
if (borrar && (!args.includes('--confirmo') || confirmado !== correo)) {
  console.error('Para borrar, repite el correo: --borrar --confirmo <el mismo correo>')
  process.exit(1)
}

// Lo que se busca: por el correo capturado en cada formulario, o por la cuenta.
const porCorreo = { correo: { equals: correo, mode: 'insensitive' as const } }

async function reunir() {
  const usuario = await prisma.user.findUnique({
    where: { email: correo },
    include: {
      perfil: { include: { experiencias: true, formaciones: true, evidencias: true, guardadas: true } },
      membresia: { include: { company: { select: { nombre: true } } } },
      _count: { select: { notificaciones: true, mensajes: true } },
    },
  })
  const postulaciones = await prisma.postulacion.findMany({
    where: { OR: [porCorreo, ...(usuario?.perfil ? [{ candidateProfileId: usuario.perfil.id }] : [])] },
    include: { vacante: { select: { puesto: true } }, _count: { select: { mensajes: true } } },
  })
  const solicitudes = await prisma.solicitud.findMany({ where: porCorreo })
  const asesorias = await prisma.solicitudAsesoria.findMany({ where: porCorreo })
  const fichas = await prisma.verificationToken.count({ where: { identifier: { endsWith: `:${correo}` } } })
  return { usuario, postulaciones, solicitudes, asesorias, fichas }
}

function mostrar(d: Awaited<ReturnType<typeof reunir>>) {
  const fecha = (x: Date) => x.toISOString().slice(0, 10)
  console.log(`\nDatos de ${correo}\n`)
  if (d.usuario) {
    const u = d.usuario
    console.log(`Cuenta: ${u.nombre ?? '(sin nombre)'} · ${u.rol} · alta ${fecha(u.creadoEn)}`)
    if (u.membresia) console.log(`  Recluta en: ${u.membresia.company.nombre}`)
    if (u.perfil) {
      const p = u.perfil
      console.log(`  Perfil: ${p.titular ?? '—'} · tel ${p.telefono ?? '—'}`)
      console.log(`  Ligas: CV ${p.cvUrl ?? '—'} · video ${p.ligaVideo ?? '—'} · LinkedIn ${p.linkedin ?? '—'}`)
      console.log(`  Trayectoria ${p.experiencias.length}, formación ${p.formaciones.length}, evidencias ${p.evidencias.length}, guardadas ${p.guardadas.length}`)
      console.log(`  Autorizó a las empresas: ${p.consentimientoEmpresasEn ? fecha(p.consentimientoEmpresasEn) : 'no'}`)
    }
    console.log(`  Avisos ${u._count.notificaciones}, mensajes escritos ${u._count.mensajes}`)
  } else {
    console.log('Cuenta: no tiene')
  }
  console.log(`Postulaciones: ${d.postulaciones.length}`)
  for (const p of d.postulaciones) {
    console.log(`  ${fecha(p.creadoEn)} ${p.vacante.puesto} · ${p.estado} · ${p._count.mensajes} mensajes`)
  }
  console.log(`Solicitudes de contacto: ${d.solicitudes.length}`)
  console.log(`Solicitudes de asesoría: ${d.asesorias.length}`)
  console.log(`Ligas de un solo uso pendientes: ${d.fichas}`)
}

async function main() {
  const datos = await reunir()
  mostrar(datos)
  if (!borrar) {
    console.log('\nNo se cambió nada. Para borrar: --borrar --confirmo <correo>')
    return
  }
  await prisma.$transaction([
    // Los mensajes de cada postulación caen en cascada con ella.
    prisma.postulacion.deleteMany({ where: { id: { in: datos.postulaciones.map((p) => p.id) } } }),
    prisma.solicitud.deleteMany({ where: porCorreo }),
    prisma.solicitudAsesoria.deleteMany({ where: porCorreo }),
    prisma.verificationToken.deleteMany({ where: { identifier: { endsWith: `:${correo}` } } }),
    // Perfil, trayectoria, formación, evidencias, guardadas, avisos y membresía caen en cascada.
    ...(datos.usuario ? [prisma.user.delete({ where: { id: datos.usuario.id } })] : []),
  ])
  console.log('\nBorrado. Así queda:')
  mostrar(await reunir())
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

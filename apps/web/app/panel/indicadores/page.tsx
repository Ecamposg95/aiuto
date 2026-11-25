import { prisma } from '@aiuto/db'
import { exigirStaff } from '@/lib/sesion'

export const dynamic = 'force-dynamic'

/**
 * Indicadores del máster prompt §16. Sólo datos reales: si algo no se ha
 * registrado, se dice "sin datos" en vez de inventar una cifra.
 */
export default async function PanelIndicadores() {
  await exigirStaff()
  const ahora = new Date()

  const [
    empresasActivas,
    publicadas,
    vigentes,
    vencidas,
    cerradas,
    candidatos,
    postulaciones,
    contratadas,
    sinContacto,
    solicitudes,
    solicitudesPorEstado,
    solicitudesPorCategoria,
    solicitudesPorOrigen,
    asesorias,
    asesoriasPorEstado,
  ] = await Promise.all([
    prisma.company.count({ where: { vacantes: { some: { estado: 'ABIERTA' } } } }),
    prisma.vacante.count({ where: { publicadaEn: { not: null } } }),
    prisma.vacante.count({ where: { estado: 'ABIERTA', OR: [{ expiraEn: null }, { expiraEn: { gt: ahora } }] } }),
    prisma.vacante.count({ where: { estado: 'EXPIRADA' } }),
    prisma.vacante.count({ where: { estado: { in: ['CUBIERTA', 'CERRADA'] } } }),
    prisma.user.count({ where: { rol: 'CANDIDATO' } }),
    prisma.postulacion.count(),
    prisma.postulacion.count({ where: { estado: 'CONTRATADA' } }),
    prisma.alerta.count({ where: { estado: 'ABIERTA' } }),
    prisma.solicitud.count(),
    prisma.solicitud.groupBy({ by: ['estado'], _count: true }),
    prisma.solicitud.groupBy({ by: ['categoryId'], _count: true, where: { categoryId: { not: null } } }),
    prisma.solicitud.groupBy({ by: ['origen'], _count: true, orderBy: { _count: { origen: 'desc' } }, take: 8 }),
    prisma.solicitudAsesoria.count(),
    prisma.solicitudAsesoria.groupBy({ by: ['estado'], _count: true }),
  ])

  const categorias = await prisma.category.findMany({ select: { id: true, nombre: true } })
  const nombreCat = new Map(categorias.map((c) => [c.id, c.nombre]))
  const porVacante = publicadas > 0 ? (postulaciones / publicadas).toFixed(1) : null
  const asesoria = (e: string) => asesoriasPorEstado.find((a) => a.estado === e)?._count ?? 0
  const solicitud = (e: string) => solicitudesPorEstado.find((a) => a.estado === e)?._count ?? 0

  return (
    <>
      <h1 className="text-h2">Indicadores</h1>
      <p className="mt-3 max-w-[64ch] text-ink-2">Todo sale de la base, en este momento. Nada es estimado.</p>

      <Seccion titulo="Bolsa de trabajo">
        <Cifra valor={empresasActivas} texto="empresas con vacantes abiertas" />
        <Cifra valor={publicadas} texto="vacantes publicadas en total" />
        <Cifra valor={vigentes} texto="vacantes vigentes" />
        <Cifra valor={vencidas} texto="vacantes vencidas" />
        <Cifra valor={candidatos} texto="candidatos registrados" />
        <Cifra valor={porVacante} texto="postulaciones por vacante publicada, en promedio" />
        <Cifra valor={sinContacto} texto="vacantes sin contacto de la empresa (alertas abiertas)" />
        <Cifra valor={cerradas} texto="procesos cerrados (cubiertos o cerrados a mano)" />
        <Cifra valor={contratadas || null} texto="posiciones cubiertas registradas" />
      </Seccion>

      <Seccion titulo="Soluciones empresariales">
        <Cifra valor={solicitudes} texto="solicitudes de contacto" />
        <Cifra valor={solicitud('NUEVA') + solicitud('EN_PROCESO')} texto="en seguimiento" />
        <Cifra valor={solicitud('ATENDIDA')} texto="atendidas" />
      </Seccion>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <Tabla
          titulo="Categorías con más demanda"
          filas={solicitudesPorCategoria
            .sort((a, b) => b._count - a._count)
            .map((s) => [nombreCat.get(s.categoryId ?? '') ?? 'Sin categoría', s._count])}
        />
        <Tabla titulo="Páginas que más solicitudes generan" filas={solicitudesPorOrigen.map((s) => [s.origen, s._count])} />
      </div>

      <Seccion titulo="Empleabilidad">
        <Cifra valor={asesorias} texto="solicitudes de asesoría" />
        <Cifra valor={asesoria('CONTACTADA') + asesoria('VENDIDA') + asesoria('EN_CURSO') + asesoria('COLOCADO')} texto="profesionales atendidos" />
        <Cifra valor={asesoria('VENDIDA') + asesoria('EN_CURSO') + asesoria('COLOCADO') || null} texto="servicios contratados" />
        <Cifra valor={asesoria('COLOCADO') || null} texto="colocaciones reportadas" />
      </Seccion>
    </>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-h3 border-b-rule border-ink pb-2">{titulo}</h2>
      <dl className="mt-4 grid gap-5 sm:grid-cols-3">{children}</dl>
    </section>
  )
}

function Cifra({ valor, texto }: { valor: number | string | null; texto: string }) {
  return (
    <div className="border-t-px border-line pt-3">
      <dd className="cifra">{valor === null ? <span className="text-h4 text-neutral">Sin datos</span> : valor}</dd>
      <dt className="mt-1 text-sm text-ink-2">{texto}</dt>
    </div>
  )
}

function Tabla({ titulo, filas }: { titulo: string; filas: (string | number)[][] }) {
  return (
    <div>
      <p className="label">{titulo}</p>
      {filas.length === 0 ? (
        <p className="mt-2 text-sm text-neutral">Sin datos</p>
      ) : (
        <table className="tabla mt-2 w-full text-sm">
          <tbody>
            {filas.map(([a, b]) => (
              <tr key={String(a)}>
                <td>{a}</td>
                <td className="cifras text-right">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

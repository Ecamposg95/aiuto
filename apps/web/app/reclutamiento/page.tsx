import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { exigirEmpresa } from '@/lib/sesion'
import { licenciaVigente } from '@/lib/licencias'

export const dynamic = 'force-dynamic'

export default async function EmpresaResumen() {
  const { empresa } = await exigirEmpresa()

  if (empresa.estado !== 'APROBADA') {
    const textos = {
      PENDIENTE: {
        titulo: 'Estamos revisando tu empresa',
        cuerpo:
          'En cuanto el equipo AIUTO apruebe la cuenta te avisamos por correo y podrás publicar vacantes. Si necesitas algo antes, escríbenos desde la página de contacto.',
      },
      SUSPENDIDA: {
        titulo: 'La cuenta de tu empresa está suspendida',
        cuerpo: 'Tus vacantes no reciben postulaciones por ahora. Escríbenos para revisarlo.',
      },
      RECHAZADA: {
        titulo: 'No pudimos aprobar la cuenta de tu empresa',
        cuerpo: 'Si crees que es un error, escríbenos desde la página de contacto.',
      },
    } as const
    const t = textos[empresa.estado]
    return (
      <>
        <h1 className="text-h2">{t.titulo}</h1>
        <p className="mt-3 max-w-[58ch] text-ink-2">{t.cuerpo}</p>
        <Link href="/contacto" className="btn-secundario mt-6">Contactar a AIUTO</Link>
      </>
    )
  }

  const [licencia, abiertas, sinRevisar, sinContacto] = await Promise.all([
    licenciaVigente(empresa.id),
    prisma.vacante.count({ where: { companyId: empresa.id, estado: 'ABIERTA' } }),
    prisma.postulacion.count({ where: { estado: 'RECIBIDA', vacante: { companyId: empresa.id } } }),
    prisma.vacante.count({
      where: {
        companyId: empresa.id,
        estado: 'ABIERTA',
        postulaciones: { some: {} },
        NOT: { postulaciones: { some: { contactadaEn: { not: null } } } },
      },
    }),
  ])
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

  return (
    <>
      <h1 className="text-h2">{empresa.nombre}</h1>
      <p className="mt-3 max-w-[60ch] text-ink-2">
        Tú revisas a quienes se postulan y les escribes directo desde aquí. AIUTO no se mete en
        medio de cada mensaje.
      </p>

      <dl className="mt-7 grid gap-6 sm:grid-cols-3">
        <div className="border-t-rule border-ink pt-4">
          <dd className="cifra">{abiertas}</dd>
          <dt className="mt-1 text-ink-2">
            {licencia ? `de ${licencia.vacantesActivas} vacantes abiertas que permite tu licencia` : 'vacantes abiertas'}
          </dt>
        </div>
        <div className="border-t-rule border-ink pt-4">
          <dd className="cifra">{sinRevisar}</dd>
          <dt className="mt-1 text-ink-2">postulaciones sin revisar</dt>
        </div>
        <div className="border-t-rule border-ink pt-4">
          <dd className="cifra">{sinContacto}</dd>
          <dt className="mt-1 text-ink-2">vacantes con candidatos a los que nadie ha escrito</dt>
        </div>
      </dl>

      {licencia ? (
        <p className="mt-6 text-sm text-ink-2">
          Licencia activa{licencia.terminaEn ? ` hasta el ${fecha.format(licencia.terminaEn)}` : ''}.
        </p>
      ) : (
        <p className="mt-6 border-rule border-operaciones bg-operaciones-tint p-4">
          Tu empresa no tiene una licencia vigente: puedes preparar vacantes como borrador, pero no
          publicarlas. Escríbenos para activarla.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/reclutamiento/vacantes/nueva" className="btn">Publicar una vacante</Link>
        <Link href="/reclutamiento/postulaciones" className="btn-secundario">Ver postulaciones</Link>
      </div>
    </>
  )
}

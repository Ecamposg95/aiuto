import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@aiuto/db'
import { FormaVacante } from '../../nueva/FormaVacante'

export const dynamic = 'force-dynamic'

export default async function EditarVacante({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [vacante, categorias] = await Promise.all([
    prisma.vacante.findUnique({ where: { id }, include: { company: true } }),
    prisma.category.findMany({ orderBy: { orden: 'asc' }, select: { id: true, nombre: true } }),
  ])
  if (!vacante) notFound()

  return (
    <>
      <Link href="/panel/vacantes" className="text-sm text-ink-2 hover:text-purple">
        ← Vacantes
      </Link>
      <h1 className="mt-3 text-h2">Editar vacante</h1>
      <p className="mt-2 text-sm text-ink-2">
        {vacante.puesto} · {vacante.company.nombre}
      </p>

      <FormaVacante
        categorias={categorias}
        vacanteId={vacante.id}
        modoQA={process.env.MODO_QA === '1'}
        valoresIniciales={{
          empresa: vacante.company.nombre,
          categoryId: vacante.categoryId,
          puesto: vacante.puesto,
          ubicacion: vacante.ubicacion,
          modalidad: vacante.modalidad,
          descripcion: vacante.descripcion,
          sueldoMin: String(vacante.sueldoMin),
          sueldoMax: String(vacante.sueldoMax),
          periodicidad: vacante.periodicidad,
          seguroSocial: vacante.seguroSocial,
          seguroSocialPct: String(vacante.seguroSocialPct),
          prestaciones: vacante.prestaciones,
          horario: vacante.horario,
          conocimientos: vacante.conocimientos.join(', '),
          numEntrevistas: String(vacante.numEntrevistas),
          diasCierreEsperado: String(vacante.diasCierreEsperado),
        }}
      />
    </>
  )
}

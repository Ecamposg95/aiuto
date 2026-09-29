import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { FormaVacante } from './FormaVacante'

export const dynamic = 'force-dynamic'

export default async function NuevaVacante() {
  const categorias = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true },
  })

  return (
    <>
      <Link href="/panel/vacantes" className="text-sm text-ink-2 hover:text-purple">
        ← Vacantes
      </Link>
      <h1 className="mt-3 text-h2">Nueva vacante</h1>
      <FormaVacante categorias={categorias} />
    </>
  )
}

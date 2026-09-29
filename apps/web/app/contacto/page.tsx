import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@aiuto/db'
import { FormaContacto } from './FormaContacto'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbenos: consultoría en siete categorías, o publica una vacante.',
}

export const dynamic = 'force-dynamic'

export default async function Contacto({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const categorias = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
    select: { slug: true, nombre: true },
  })

  return (
    <div className="wrap max-w-[75ch] py-7">
      <p className="label">Contacto</p>
      <h1 className="mt-3 text-h1">Escríbenos</h1>
      <p className="mt-4 text-lead text-ink-2">
        Consultoría en siete categorías, o publicar una vacante en la bolsa. Lo que llegue aquí
        queda registrado con responsable y seguimiento.
      </p>

      <div className="mt-7">
        <FormaContacto categorias={categorias} categoriaInicial={categoria} />
      </div>

      <p className="mt-5 text-sm text-ink-2">
        Al enviar aceptas nuestro{' '}
        <Link href="/privacidad" className="text-purple underline">
          aviso de privacidad
        </Link>
        .
      </p>
    </div>
  )
}

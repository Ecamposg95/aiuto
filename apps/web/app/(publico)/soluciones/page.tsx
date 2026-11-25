import Link from 'next/link'
import type { Metadata } from 'next'
import { VERTICALES } from '@aiuto/core'
import { BotonWhatsApp, MENSAJES_WHATSAPP } from '@/components/BotonWhatsApp'
import { IconoVertical } from '@/components/IconoVertical'

export const metadata: Metadata = {
  title: 'Soluciones Empresariales',
  description: 'Siete áreas de especialistas para resolver los desafíos de tu negocio, con acompañamiento de principio a fin.',
}

export default function Soluciones() {
  return (
    <>
      <div className="wrap py-7">
        <p className="label">Soluciones Empresariales</p>
        <h1 className="mt-3 max-w-[22ch] text-h1">Encuentra soluciones profesionales para los desafíos de tu negocio</h1>
        <p className="mt-4 max-w-[62ch] text-lead text-ink-2">
          Elige el área que más se parece a lo que te pasa. Si no sabes cuál es, escríbenos: entender
          el problema es la primera parte de nuestro trabajo.
        </p>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VERTICALES.map((v) => (
            <li key={v.slug}>
              <Link href={`/soluciones/${v.slug}`} className="tarjeta block h-full border-t-4 transition hover:shadow-md" style={{ borderTopColor: v.color }}>
                <IconoVertical trazo={v.icono} color={v.color} />
                <h2 className="mt-3 text-h3">{v.nombre}</h2>
                <p className="mt-2 text-ink-2">{v.lema}</p>
                <p className="mt-3 text-sm" style={{ color: v.colorDark }}>{v.servicios.length} soluciones →</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BotonWhatsApp mensaje={MENSAJES_WHATSAPP.soluciones} />
    </>
  )
}

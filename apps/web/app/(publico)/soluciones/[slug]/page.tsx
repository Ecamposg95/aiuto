import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@aiuto/db'
import { VERTICALES, verticalPorSlug } from '@aiuto/core'
import { BotonWhatsApp, MENSAJES_WHATSAPP, ligaWhatsApp } from '@/components/BotonWhatsApp'
import { IconoVertical } from '@/components/IconoVertical'
import { FormaContacto } from '../../contacto/FormaContacto'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return VERTICALES.map((v) => ({ slug: v.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = verticalPorSlug((await params).slug)
  return v ? { title: v.nombre, description: v.explicacion } : {}
}

/**
 * Una vertical: primero el problema, luego las soluciones, y los términos
 * técnicos explicados (máster prompt §5).
 */
export default async function Vertical({ params }: { params: Promise<{ slug: string }> }) {
  const v = verticalPorSlug((await params).slug)
  if (!v) notFound()
  const categorias = await prisma.category.findMany({ orderBy: { orden: 'asc' }, select: { slug: true, nombre: true } })
  const whatsapp = ligaWhatsApp(MENSAJES_WHATSAPP.soluciones)

  return (
    <>
      <section style={{ backgroundColor: v.colorTint }}>
        <div className="wrap py-7">
          <Link href="/soluciones" className="text-sm text-ink-2 hover:text-purple">← Soluciones Empresariales</Link>
          <div className="mt-4 flex items-center gap-4">
            <IconoVertical trazo={v.icono} color={v.color} tam={56} />
            <p className="label" style={{ color: v.colorDark }}>{v.lema}</p>
          </div>
          <h1 className="mt-3 max-w-[20ch] text-h1">{v.nombre}</h1>
          <p className="mt-4 max-w-[62ch] text-lead text-ink-2">{v.explicacion}</p>
        </div>
      </section>

      <div className="wrap py-7">
        <section>
          <h2 className="text-h2">¿Te suena alguno de estos problemas?</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {v.problemas.map((p) => (
              <li key={p} className="tarjeta border-l-4" style={{ borderLeftColor: v.color }}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="mt-7">
          <h2 className="text-h2">Cómo te podemos ayudar</h2>
          <p className="mt-2 max-w-[62ch] text-ink-2">
            Te conectamos con especialistas de nuestra red en cada una de estas soluciones y
            acompañamos el proyecto hasta el resultado.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {v.servicios.map((s) => (
              <li key={s.nombre} className="tarjeta">
                <h3 className="text-h4">{s.nombre}</h3>
                <p className="mt-2 text-sm text-ink-2">{s.resuelve}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-h3">Lo que puedes esperar</h2>
            <ul className="mt-4 grid gap-2">
              {v.beneficios.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: v.color }} aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-neutral">
              Los resultados dependen de cada caso; te los planteamos con claridad en la propuesta.
            </p>
          </div>
          <div>
            <h2 className="text-h3">Términos que vas a escuchar</h2>
            <dl className="mt-4 grid gap-3">
              {v.glosario.map((t) => (
                <div key={t.termino}>
                  <dt className="font-semibold">{t.termino}</dt>
                  <dd className="text-sm text-ink-2">{t.significa}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="contacto" className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-h2">Hablemos de tu caso</h2>
            <p className="mt-3 max-w-[48ch] text-ink-2">
              Cuéntanos qué está pasando. Una persona de AIUTO te contesta, entiende la necesidad y
              te propone el camino. Sin compromiso.
            </p>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-secundario mt-5">
                Escribir por WhatsApp
              </a>
            )}
          </div>
          <FormaContacto categorias={categorias} categoriaInicial={v.slug} origen={`soluciones/${v.slug}`} />
        </section>
      </div>
      <BotonWhatsApp mensaje={MENSAJES_WHATSAPP.soluciones} />
    </>
  )
}

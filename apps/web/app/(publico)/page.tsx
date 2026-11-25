import Link from 'next/link'
import { VERTICALES } from '@aiuto/core'
import { BotonWhatsApp, MENSAJES_WHATSAPP } from '@/components/BotonWhatsApp'
import { IconoVertical } from '@/components/IconoVertical'

/**
 * La portada distribuye a las tres vertientes con el mismo peso (máster
 * prompt §4). No es la portada de la bolsa ni la de una consultora.
 */
const VERTIENTES = [
  {
    titulo: 'Soluciones para empresas',
    texto: 'Encuentra soluciones profesionales para los desafíos de tu negocio.',
    accion: 'Explorar soluciones',
    ruta: '/soluciones',
    color: '#66a2ba',
  },
  {
    titulo: 'Bolsa de trabajo',
    texto: 'Conecta tu experiencia y talento con nuevas oportunidades profesionales.',
    accion: 'Explorar vacantes',
    ruta: '/bolsa',
    color: '#7cb39a',
  },
  {
    titulo: 'Empleabilidad',
    texto: 'Transforma tu perfil profesional y mejora tus oportunidades laborales.',
    accion: 'Mejorar mi empleabilidad',
    ruta: '/empleabilidad',
    color: '#cd5d22',
  },
] as const

const PASOS = [
  ['Necesidad', 'Nos cuentas qué quieres resolver, con tus palabras.'],
  ['Contacto', 'Una persona de AIUTO te escucha; no un formulario automático.'],
  ['Diagnóstico', 'Entendemos el problema de fondo antes de proponer nada.'],
  ['Especialista', 'Identificamos a quien sabe resolverlo dentro de nuestra red.'],
  ['Propuesta', 'Recibes una propuesta clara, con alcance y condiciones.'],
  ['Ejecución y seguimiento', 'Acompañamos hasta que el resultado se nota.'],
] as const

export default function Inicio() {
  return (
    <>
      <section className="wrap py-7 sm:py-8">
        <p className="label">Ecosistema AIUTO</p>
        <h1 className="mt-3 max-w-[18ch] text-h1">El ecosistema que conecta necesidades con soluciones</h1>
        <p className="mt-4 max-w-[60ch] text-lead text-ink-2">
          Empresas que necesitan resolver un reto, personas que buscan una oportunidad y
          profesionales que quieren competir mejor. La tecnología facilita; el criterio humano
          resuelve.
        </p>

        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {VERTIENTES.map((v) => (
            <li key={v.ruta} className="tarjeta flex flex-col border-t-4" style={{ borderTopColor: v.color }}>
              <h2 className="text-h3">{v.titulo}</h2>
              <p className="mt-2 flex-1 text-ink-2">{v.texto}</p>
              <Link href={v.ruta} className="btn mt-5">{v.accion}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-off py-7">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label">Soluciones empresariales</p>
              <h2 className="mt-2 text-h2">¿Qué necesita resolver tu empresa?</h2>
            </div>
            <Link href="/soluciones" className="text-purple underline">Ver todas</Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VERTICALES.map((v) => (
              <li key={v.slug}>
                <Link href={`/soluciones/${v.slug}`} className="tarjeta block h-full transition hover:shadow-md">
                  <IconoVertical trazo={v.icono} color={v.color} />
                  <p className="mt-3 text-h4">{v.nombre}</p>
                  <p className="mt-1 text-sm text-ink-2">{v.lema}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap py-7">
        <p className="label">Cómo trabajamos con empresas</p>
        <h2 className="mt-2 max-w-[30ch] text-h2">No necesitas saber qué servicio pedir. Cuéntanos qué pasa.</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PASOS.map(([titulo, texto], i) => (
            <li key={titulo} className="tarjeta">
              <p className="cifras text-purple">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-1 text-h4">{titulo}</p>
              <p className="mt-1 text-sm text-ink-2">{texto}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/contacto" className="btn">Contarnos tu necesidad</Link>
          <Link href="/empresas/registro" className="btn-secundario">Publicar vacantes</Link>
        </div>
      </section>

      <BotonWhatsApp mensaje={MENSAJES_WHATSAPP.inicio} />
    </>
  )
}

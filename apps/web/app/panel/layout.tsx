import { prisma } from '@aiuto/db'
import { exigirStaff } from '@/lib/sesion'
import { Riel } from './Riel'
import { SalirBoton } from './SalirBoton'

export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirStaff()

  // Los pendientes van en el riel: es lo primero que alguien quiere saber al
  // entrar, y obligarlo a abrir cada sección para averiguarlo es trabajo extra.
  const [solicitudes, postulaciones, asesorias] = await Promise.all([
    prisma.solicitud.count({ where: { estado: { in: ['NUEVA', 'EN_PROCESO'] } } }),
    prisma.postulacion.count({ where: { estado: 'RECIBIDA' } }),
    prisma.solicitudAsesoria.count({ where: { estado: 'NUEVA' } }),
  ])

  const secciones = [
    { ruta: '/panel', etiqueta: 'Bandeja', pendientes: solicitudes },
    { ruta: '/panel/vacantes', etiqueta: 'Vacantes' },
    { ruta: '/panel/postulaciones', etiqueta: 'Postulaciones', pendientes: postulaciones },
    { ruta: '/panel/asesorias', etiqueta: 'Asesorías', pendientes: asesorias },
  ]

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[232px_1fr]">
      <aside className="lg:sticky lg:top-0 lg:h-screen">
        <Riel secciones={secciones} usuario={usuario.nombre ?? usuario.email} />
      </aside>

      <main className="min-w-0">
        <div className="flex items-center justify-end border-b-rule border-ink px-5 py-3 lg:px-7">
          <SalirBoton />
        </div>
        <div className="px-5 py-6 lg:px-7">{children}</div>
      </main>
    </div>
  )
}

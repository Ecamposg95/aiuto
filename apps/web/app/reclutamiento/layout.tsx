import { prisma } from '@aiuto/db'
import { exigirEmpresa } from '@/lib/sesion'
import { sinLeer } from '@/lib/notificaciones'
import { Riel } from '../panel/Riel'
import { SalirBoton } from '../panel/SalirBoton'

export const dynamic = 'force-dynamic'

/** El panel de reclutamiento de una empresa: sus vacantes, sus candidatos, sus mensajes. */
export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const { usuario, empresa } = await exigirEmpresa()

  const [sinRevisar, avisos] = await Promise.all([
    prisma.postulacion.count({ where: { estado: 'RECIBIDA', vacante: { companyId: empresa.id } } }),
    sinLeer(usuario.id),
  ])

  const secciones =
    empresa.estado === 'APROBADA'
      ? [
          { ruta: '/reclutamiento', etiqueta: 'Resumen' },
          { ruta: '/reclutamiento/vacantes', etiqueta: 'Vacantes' },
          { ruta: '/reclutamiento/postulaciones', etiqueta: 'Postulaciones', pendientes: sinRevisar },
          { ruta: '/reclutamiento/avisos', etiqueta: 'Avisos', pendientes: avisos },
        ]
      : [{ ruta: '/reclutamiento', etiqueta: 'Resumen' }]

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[232px_1fr]">
      <aside className="lg:sticky lg:top-0 lg:h-screen">
        <Riel secciones={secciones} usuario={usuario.nombre ?? usuario.email} inicio="/reclutamiento" subtitulo={empresa.nombre} />
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

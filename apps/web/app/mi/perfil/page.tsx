import { exigirCandidato } from '@/lib/sesion'
import { prisma } from '@aiuto/db'
import { FormaPerfil } from './FormaPerfil'

export const dynamic = 'force-dynamic'

export default async function MiPerfil() {
  const { id: userId } = await exigirCandidato()

  const perfil =
    (await prisma.candidateProfile.findUnique({ where: { userId } })) ??
    (await prisma.candidateProfile.create({ data: { userId, nivel: 'EXPERIMENTADO' } }))

  return (
    <>
      <h1 className="text-h2">Mi perfil</h1>
      <p className="mt-3 max-w-[62ch] text-ink-2">
        Pocos campos, a propósito. Con esto basta para postularte; lo demás lo platicamos si
        avanzas.
      </p>

      {perfil.rosterPreferencial && (
        <p className="mt-5 border-rule border-purple bg-purple-100 p-4 text-sm">
          <strong>Estás en el roster preferencial.</strong> Tu perfil se revisa primero cuando
          entra una vacante que empata contigo.
        </p>
      )}

      <FormaPerfil
        perfil={{
          titular: perfil.titular,
          resumen: perfil.resumen,
          nivel: perfil.nivel,
          anosExperiencia: perfil.anosExperiencia,
          telefono: perfil.telefono,
          codigoPostal: perfil.codigoPostal,
          habilidades: perfil.habilidades,
          ligaPortafolio: perfil.ligaPortafolio,
          ligaVideo: perfil.ligaVideo,
          disponibilidad: perfil.disponibilidad,
          rosterPreferencial: perfil.rosterPreferencial,
        }}
      />
    </>
  )
}

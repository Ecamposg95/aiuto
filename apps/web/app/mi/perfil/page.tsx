import Link from 'next/link'
import { loQueFalta } from '@aiuto/core'
import { prisma } from '@aiuto/db'
import { exigirCandidato } from '@/lib/sesion'
import { FormaPerfil } from './FormaPerfil'

export const dynamic = 'force-dynamic'

export default async function MiPerfil() {
  const { id: userId } = await exigirCandidato()

  const perfil =
    (await prisma.candidateProfile.findUnique({ where: { userId } })) ??
    (await prisma.candidateProfile.create({ data: { userId, nivel: 'EXPERIMENTADO' } }))

  const faltas = loQueFalta(perfil)

  return (
    <>
      <h1 className="text-h2">Mi perfil</h1>
      <p className="mt-3 max-w-[58ch] text-ink-2">
        Pocos campos, a propósito. Con esto basta para postularte; lo demás se platica si
        avanzas.
      </p>

      {perfil.rosterPreferencial && (
        <p className="mt-5 border-rule border-purple bg-purple-100 p-4">
          <strong>Estás en el roster preferencial.</strong> Tu perfil se revisa primero cuando
          entra una vacante que empata contigo.
        </p>
      )}

      {/* Qué falta y por qué. Sin porcentajes: un «60 % completo» no le dice a
          nadie qué hacer, y el número sale de una ponderación inventada. */}
      {faltas.length > 0 ? (
        <section className="mt-6 border-rule border-ink p-5">
          <h2 className="text-h4">
            {faltas.length === 1
              ? 'Falta una cosa para que tu perfil trabaje a tu favor'
              : `Faltan ${faltas.length} cosas para que tu perfil trabaje a tu favor`}
          </h2>
          <ul className="mt-4">
            {faltas.map((f) => (
              <li key={f.campo} className="border-t-px border-line-soft py-3 first:border-t-0 first:pt-0">
                <p className="text-h4">{f.que}</p>
                <p className="mt-1 max-w-[58ch] text-sm text-ink-2">{f.porque}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 border-rule border-ink bg-off p-4">
          Tu perfil está completo. Nos alcanza para encontrarte cuando entre algo que empate
          contigo.{' '}
          <Link href="/bolsa" className="text-purple underline">
            Ver vacantes abiertas
          </Link>
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

import { prisma } from '@aiuto/db'

/**
 * La licencia que hoy deja publicar a una empresa: activa y sin vencer. Si
 * hay varias (una renovación que se empalma), gana la más generosa.
 */
export async function licenciaVigente(companyId: string, ahora = new Date()) {
  return prisma.licencia.findFirst({
    where: {
      companyId,
      estado: 'ACTIVA',
      iniciaEn: { lte: ahora },
      OR: [{ terminaEn: null }, { terminaEn: { gt: ahora } }],
    },
    orderBy: { vacantesActivas: 'desc' },
  })
}

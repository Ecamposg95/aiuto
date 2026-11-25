'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@aiuto/db'
import { auth } from '@/auth'
import { liga } from '@/lib/esquemas'

/** El perfil de quien actúa. Cada acción lo vuelve a leer de la sesión. */
async function miPerfil(): Promise<string> {
  const sesion = await auth()
  if (!sesion?.user?.id || sesion.user.rol !== 'CANDIDATO') throw new Error('No autorizado.')
  const p = await prisma.candidateProfile.findUnique({ where: { userId: sesion.user.id }, select: { id: true } })
  if (!p) throw new Error('Sin perfil.')
  return p.id
}

const t = (d: FormData, k: string) => String(d.get(k) ?? '').trim()
const corto = z.string().trim().min(1).max(160)

// Tope por lista: suficiente para una trayectoria real y evita que alguien
// llene la base desde un formulario.
const MAXIMO = 20

export async function agregarExperiencia(datos: FormData) {
  const perfilId = await miPerfil()
  const puesto = corto.parse(t(datos, 'puesto'))
  const empresa = corto.parse(t(datos, 'empresa'))
  // Tres a cinco logros, uno por renglón (máster prompt §8.2).
  const logros = t(datos, 'logros').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 5).map((l) => l.slice(0, 300))
  const orden = await prisma.experiencia.count({ where: { perfilId } })
  if (orden >= MAXIMO) return
  await prisma.experiencia.create({
    data: { perfilId, puesto, empresa, desde: t(datos, 'desde').slice(0, 40) || null, hasta: t(datos, 'hasta').slice(0, 40) || null, logros, orden },
  })
  revalidatePath('/mi/perfil')
}

export async function agregarFormacion(datos: FormData) {
  const perfilId = await miPerfil()
  const titulo = corto.parse(t(datos, 'titulo'))
  const institucion = corto.parse(t(datos, 'institucion'))
  const anio = Number.parseInt(t(datos, 'anio'), 10)
  const orden = await prisma.formacion.count({ where: { perfilId } })
  if (orden >= MAXIMO) return
  await prisma.formacion.create({
    data: { perfilId, titulo, institucion, anio: anio >= 1950 && anio <= 2100 ? anio : null, orden },
  })
  revalidatePath('/mi/perfil')
}

export async function agregarEvidencia(datos: FormData) {
  const perfilId = await miPerfil()
  const titulo = corto.parse(t(datos, 'titulo'))
  const url = liga.parse(t(datos, 'url'))
  const orden = await prisma.evidencia.count({ where: { perfilId } })
  if (orden >= MAXIMO) return
  await prisma.evidencia.create({ data: { perfilId, titulo, url, orden } })
  revalidatePath('/mi/perfil')
}

/** Borra un elemento propio. `deleteMany` con el perfil en el filtro: uno ajeno no se toca. */
export async function borrarDeTrayectoria(datos: FormData) {
  const perfilId = await miPerfil()
  const id = t(datos, 'id')
  const tipo = t(datos, 'tipo')
  if (tipo === 'experiencia') await prisma.experiencia.deleteMany({ where: { id, perfilId } })
  if (tipo === 'formacion') await prisma.formacion.deleteMany({ where: { id, perfilId } })
  if (tipo === 'evidencia') await prisma.evidencia.deleteMany({ where: { id, perfilId } })
  revalidatePath('/mi/perfil')
}

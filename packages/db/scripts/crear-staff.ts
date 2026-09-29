/**
 * Alta de una cuenta del equipo AIUTO.
 *
 * Con tres personas no hay pantalla de administración de usuarios: las cuentas
 * se crean aquí. La contraseña se genera sola y se imprime UNA vez; no queda
 * guardada en ningún lado más que como hash.
 *
 *   pnpm crear-staff correo@aiuto.com.mx "Nombre Apellido" [admin|operador]
 */
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../generated/client/index.js'

const prisma = new PrismaClient()

const [email, nombre, papel = 'operador'] = process.argv.slice(2)

if (!email || !nombre) {
  console.error('Uso: pnpm crear-staff <correo> "<nombre>" [admin|operador]')
  process.exit(1)
}

if (papel !== 'admin' && papel !== 'operador') {
  console.error(`Papel inválido: ${papel}. Usa "admin" u "operador".`)
  process.exit(1)
}

const rol = papel === 'admin' ? 'STAFF_ADMIN' : 'STAFF_OPERADOR'

/** Contraseña legible pero larga: se escribe una vez y se guarda en el gestor. */
function generarPassword(): string {
  return randomBytes(18).toString('base64url')
}

async function main() {
  const correo = email.trim().toLowerCase()
  const password = generarPassword()
  const passwordHash = await bcrypt.hash(password, 12)

  const usuario = await prisma.user.upsert({
    where: { email: correo },
    create: { email: correo, nombre, rol, passwordHash, emailVerified: new Date() },
    update: { nombre, rol, passwordHash },
  })

  console.log('')
  console.log('  Cuenta lista')
  console.log(`  correo      ${usuario.email}`)
  console.log(`  nombre      ${usuario.nombre}`)
  console.log(`  rol         ${usuario.rol}`)
  console.log(`  contraseña  ${password}`)
  console.log('')
  console.log('  Esta contraseña no se vuelve a mostrar. Guárdala ahora.')
  console.log('')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

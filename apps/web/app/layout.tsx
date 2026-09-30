import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AIUTO — Bolsa de trabajo con sueldo a la vista',
    template: '%s · AIUTO',
  },
  description:
    'Vacantes que declaran sueldo, prestaciones, horario y cuántas entrevistas tiene el proceso. Y te decimos en qué va tu postulación.',
}

/**
 * El layout raíz no pinta ninguna navegación.
 *
 * El sitio público y las zonas con sesión son dos cosas distintas: poner el menú
 * del sitio encima del panel deja dos navegaciones apiladas y rompe la sensación
 * de estar dentro de una herramienta. Cada una trae la suya.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={archivo.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}

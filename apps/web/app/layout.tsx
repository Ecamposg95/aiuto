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
    default: 'AIUTO — El ecosistema que conecta necesidades con soluciones',
    template: '%s · AIUTO',
  },
  description:
    'Soluciones profesionales para empresas, bolsa de trabajo con sueldo a la vista y asesoría de empleabilidad, en un solo lugar.',
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

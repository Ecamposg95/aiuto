'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Lo que se ve cuando algo truena de verdad.
 *
 * No se muestra el mensaje del error: en producción Next lo omite a propósito
 * para no filtrar detalles del servidor, y enseñar un identificador que nadie
 * puede usar sólo hace sentir peor a quien lo lee. Se le ofrece una salida.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error no controlado en la interfaz:', error.digest ?? error.message)
  }, [error])

  return (
    <div className="wrap max-w-[52ch] py-8">
      <p className="label">Algo falló</p>
      <h1 className="mt-3 text-h1">Se nos rompió esta página</h1>
      <p className="mt-4 text-lead text-ink-2">
        No es culpa tuya. Vuelve a intentarlo; si sigue pasando, escríbenos y lo revisamos.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button onClick={reset} className="btn">
          Reintentar
        </button>
        <Link href="/bolsa" className="btn-secundario">
          Ir a las vacantes
        </Link>
        <Link href="/contacto" className="btn-secundario">
          Reportarlo
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function NoEncontrado() {
  return (
    <div className="wrap max-w-[52ch] py-8">
      <p className="label">Error 404</p>
      <h1 className="mt-3 text-h1">Aquí no hay nada</h1>
      <p className="mt-4 text-lead text-ink-2">
        La página que buscas no existe, o la vacante que tenías guardada ya se cerró. Las
        vacantes de AIUTO viven 60 días y después se retiran solas.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link href="/bolsa" className="btn">
          Ver las vacantes abiertas
        </Link>
        <Link href="/" className="btn-secundario">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}

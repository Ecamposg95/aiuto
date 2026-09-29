import { signOut } from '@/auth'

export function SalirBoton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/entrar' })
      }}
    >
      <button type="submit" className="btn-secundario px-4 py-2 text-sm">
        Salir
      </button>
    </form>
  )
}

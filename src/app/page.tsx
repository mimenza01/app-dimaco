import Link from 'next/link'
import { getSupabaseServer } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">App Dimaco</h1>
          <p>Necesitas iniciar sesión para continuar.</p>
          <Link className="underline" href="/login">Ir a login</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Hola, {user.email}</h1>
        <form action="/api/logout" method="post">
          <button className="rounded-xl border px-4 py-2">Cerrar sesión</button>
        </form>
      </div>
    </main>
  )
}

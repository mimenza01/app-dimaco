'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { getSupabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = getSupabaseBrowser()

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Entrar a App Dimaco</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view="sign_in"              // si quieres magic link, cambia a "magic_link"
          redirectTo="http://localhost:3000"  // o 3001 si tu server está en 3001
        />
      </div>
    </div>
  )
}

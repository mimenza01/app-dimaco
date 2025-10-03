"use client";

import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lee las variables públicas de Vercel (Producción) o .env.local (local)
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://TU-PROJECT-ref.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU-ANON-KEY";

// Crea el cliente solo una vez
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AppDimacoAuth() {
  const [session, setSession] = useState<null | Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"]>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Carga/escucha sesión
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErrorMsg(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // UI muy simple para validar fin-a-fin
  return (
    <main style={{ padding: 24, color: "white" }}>
      {!session ? (
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Dimaco – Acceso</h1>
          <form onSubmit={signIn} style={{ display: "grid", gap: 8, maxWidth: 340 }}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              style={{ padding: 10, borderRadius: 8 }}
              required
            />
            <input
              type="password"
              placeholder="contraseña"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              style={{ padding: 10, borderRadius: 8 }}
              required
            />
            {errorMsg && <div style={{ color: "#ffb4b4" }}>{errorMsg}</div>}
            <button
              disabled={loading}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "#2563eb",
                color: "white",
                fontWeight: 600,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p style={{ marginTop: 16, opacity: 0.8, fontSize: 12 }}>
            URL: {SUPABASE_URL.replace("https://", "")}
          </p>
        </div>
      ) : (
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Dimaco – Sesión</h1>
          <p>Hola, <b>{session.user.email}</b></p>
          <button
            onClick={signOut}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#334155",
              color: "white",
              fontWeight: 600,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </main>
  );
}

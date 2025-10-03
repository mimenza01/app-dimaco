"use client";

import React, { useEffect, useMemo, useState } from "react";
// …el resto de imports y TU componente…
export default function AppDimacoAuth() {
  // …contenido…
}

/*************************************************
 * App Dimaco – V2 + Supabase (para Next.js)
 * - Auth email/contraseña
 * - Roles desde public.profiles (role: 'admin' | 'employee')
 * - CRUD repartos + realtime
 * - Evidencias en bucket 'evidencia'
 * - Filtros, búsqueda, responsive
 *************************************************/

// === Supabase Client (usa variables públicas de Vercel) ===
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://app-dimaco.vercel.app";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRweHdoZ2psa2x2c3NiYmlxZW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjA1MDMsImV4cCI6MjA3NDk5NjUwM30.S1GSOpIegYIkhTom0Ul7s5AoIAyCYjrCx0j";

const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// === Tipos ===
export type Role = "admin" | "employee";
export type Reparto = {
  id: string;
  fecha: string;
  hora_salida: string;
  vehiculo: string;
  chofer: string;
  ayudantes: string;
  notas_facturas: string;
  verificador: string;
  verificacion: "VERIFICADO" | "PENDIENTE" | "NO VERIFICADO";
  estado: "PENDIENTE" | "ENTREGADO" | "RECHAZADO";
  personal_done: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Evidencia = {
  id: string;
  reparto_id: string;
  url: string;
  created_by: string | null;
  created_at: string;
};

// === Utils ===
const cn = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");
const toDisplayDate = (val: any) => {
  try {
    return new Date(val).toLocaleDateString();
  } catch {
    return String(val);
  }
};
const formatDateForInput = (d: any) => {
  if (!d) return "";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const to24h = (time: string) => {
  if (!time) return "00:00";
  const t = String(time).trim().toUpperCase();
  const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!m) return time;
  let [, hh, mm, ap] = m;
  let h = parseInt(hh, 10);
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${mm}`;
};
const upper = (s: string) => (s ?? "").toString().toUpperCase();

// === UI helpers ===
const toneMap: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
  blue: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-700",
};
const Badge = ({
  tone = "neutral",
  children,
}: {
  tone?: string;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      "px-2 py-1 text-xs rounded-full whitespace-nowrap font-medium",
      toneMap[tone]
    )}
  >
    {children}
  </span>
);
const verificacionTone = (v: any) => {
  const s = String(v || "").trim().toUpperCase();
  if (s.startsWith("VER"))
    return { tone: "green", label: "VERIFICADO" } as const;
  if (s.startsWith("PEN"))
    return { tone: "yellow", label: "PENDIENTE" } as const;
  return { tone: "red", label: "NO VERIFICADO" } as const;
};
const estadoTone = (v: any) => {
  const s = String(v || "").trim().toUpperCase();
  if (s.startsWith("ENT"))
    return { tone: "green", label: "ENTREGADO" } as const;
  if (s.startsWith("PEN"))
    return { tone: "yellow", label: "PENDIENTE" } as const;
  return { tone: "red", label: "RECHAZADO" } as const;
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-white/90 mb-1">
    {children}
  </label>
);

// === Modal simple ===
const Modal = ({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
            aria-label="Cerrar"
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// === Login ===
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    onLogin();
  };

  return (
    <div className="min-h-screen w-full flex">
      <div className="hidden xl:flex w-2/5 bg-[#C41230] text-white items-center justify-center p-8">
        <div className="text-center">
          <div className="text-3xl font-semibold tracking-wide">
            Verificación de Materiales
          </div>
          <div className="opacity-90 mt-2 text-white/90">DIMACO</div>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 grid place-items-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-semibold mb-1 text-center">
            Iniciar sesión
          </h1>
          <p className="text-center text-slate-500 mb-6">Acceso Dimaco</p>
          <form onSubmit={submit} className="grid gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl border px-3 py-3"
                value={email}
                onChange={(e) =>
                  setEmail((e.target as HTMLInputElement).value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full rounded-xl border px-3 py-3"
                value={password}
                onChange={(e) =>
                  setPassword((e.target as HTMLInputElement).value)
                }
                required
              />
            </div>
            {error && <div className="text-rose-600 text-sm">{error}</div>}
            <button
              disabled={loading}
              className="w-full rounded-xl py-3 font-medium text-white"
              style={{ background: "#C41230" }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// === Formulario Reparto (crear/editar) ===
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600">{label}</label>
    {children}
  </div>
);

const emptyReparto = () => ({
  fecha: formatDateForInput(new Date()),
  hora_salida: "",
  vehiculo: "",
  chofer: "",
  ayudantes: "",
  notas_facturas: "",
  verificador: "",
  verificacion: "PENDIENTE" as const,
  estado: "PENDIENTE" as const,
});

function RepartoForm({
  initial = emptyReparto(),
  onSubmit,
  onCancel,
  submitText = "Guardar",
}: {
  initial?: any;
  onSubmit: (x: any) => void;
  onCancel: () => void;
  submitText?: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={submit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Fecha">
        <input
          type="date"
          className="input"
          value={form.fecha}
          onChange={(e) => set("fecha", (e.target as HTMLInputElement).value)}
          required
        />
      </Field>
      <Field label="Hora de Salida">
        <input
          className="input"
          placeholder="8:30 AM"
          value={form.hora_salida}
          onChange={(e) => set("hora_salida", upper((e.target as HTMLInputElement).value))}
          required
        />
      </Field>
      <Field label="Vehiculo">
        <input
          className="input"
          value={form.vehiculo}
          onChange={(e) => set("vehiculo", upper((e.target as HTMLInputElement).value))}
          required
        />
      </Field>
      <Field label="Chofer">
        <input
          className="input"
          value={form.chofer}
          onChange={(e) => set("chofer", upper((e.target as HTMLInputElement).value))}
          required
        />
      </Field>
      <Field label="Ayudantes">
        <input
          className="input"
          value={form.ayudantes}
          onChange={(e) => set("ayudantes", upper((e.target as HTMLInputElement).value))}
        />
      </Field>
      <Field label="Notas & Facturas">
        <input
          className="input"
          value={form.notas_facturas}
          onChange={(e) => set("notas_facturas", (e.target as HTMLInputElement).value)}
        />
      </Field>
      <Field label="Verificador">
        <input
          className="input"
          value={form.verificador}
          onChange={(e) => set("verificador", upper((e.target as HTMLInputElement).value))}
        />
      </Field>
      <Field label="Verificación">
        <select
          className="input"
          value={form.verificacion}
          onChange={(e) => set("verificacion", (e.target as HTMLSelectElement).value)}
        >
          <option value="VERIFICADO">VERIFICADO</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="NO VERIFICADO">NO VERIFICADO</option>
        </select>
      </Field>
      <Field label="Estado">
        <select
          className="input"
          value={form.estado}
          onChange={(e) => set("estado", (e.target as HTMLSelectElement).value)}
        >
          <option>PENDIENTE</option>
          <option>ENTREGADO</option>
          <option>RECHAZADO</option>
        </select>
      </Field>
      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn ghost">
          Cancelar
        </button>
        <button type="submit" className="btn primary">
          {submitText}
        </button>
      </div>
    </form>
  );
}

// === Evidencias ===
function EvidenciaCell({ reparto, role }: { reparto: Reparto; role: Role }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Evidencia[]>([]);
  const load = async () => {
    const { data } = await supabase
      .from("evidencias")
      .select("*")
      .eq("reparto_id", reparto.id)
      .order("created_at", { ascending: false });
    setList(data || []);
  };
  useEffect(() => {
    if (open) load();
  }, [open]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${reparto.id}/${Date.now()}.${ext}`;
    const { data: up, error } = await supabase.storage
      .from("evidencia")
      .upload(path, file, { upsert: false });
    if (error) {
      alert("Error al subir: " + error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("evidencia").getPublicUrl(up!.path);
    await supabase
      .from("evidencias")
      .insert({ reparto_id: reparto.id, url: pub.publicUrl });
    await load();
  };

  const del = async (id: string) => {
    if (role !== "admin") return;
    await supabase.from("evidencias").delete().eq("id", id);
    await load();
  };

  return (
    <>
      <button className="icon-btn" onClick={() => setOpen(true)} title="Evidencia">
        Evidencia
      </button>
      <Modal title="Evidencia" open={open} onClose={() => setOpen(false)}>
        <div className="p-4 grid gap-4">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*;capture=camera" onChange={onFile} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {list.map((ev) => (
              <div key={ev.id} className="border rounded-xl overflow-hidden">
                <a href={ev.url} target="_blank" rel="noreferrer">
                  <img src={ev.url} alt="evidencia" className="w-full h-32 object-cover" />
                </a>
                {role === "admin" && (
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-rose-50"
                    onClick={() => del(ev.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            {list.length === 0 && <div className="text-slate-500">No hay imágenes aún.</div>}
          </div>
        </div>
      </Modal>
    </>
  );
}

// === Listados (tabla/cards) — para abreviar, usamos sólo tabla aquí ===
function TableView({
  data,
  role,
  onEdit,
  onDelete,
  canPersonalAct,
  onPersonalMark,
}: {
  data: Reparto[];
  role: Role;
  onEdit?: (r: Reparto) => void;
  onDelete?: (id: string) => void;
  canPersonalAct: (r: Reparto) => boolean;
  onPersonalMark: (r: Reparto, target: "ENTREGADO" | "RECHAZADO") => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="text-left px-4 py-3">Fecha</th>
            <th className="text-left px-4 py-3">Hora</th>
            <th className="text-left px-4 py-3">Vehículo</th>
            <th className="text-left px-4 py-3">Chofer</th>
            <th className="text-left px-4 py-3">Verificación</th>
            <th className="text-left px-4 py-3">Estado</th>
            <th className="text-left px-4 py-3">Evidencia</th>
            {role === "admin" && <th className="text-left px-4 py-3">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">{toDisplayDate(r.fecha)}</td>
              <td className="px-4 py-3">{r.hora_salida}</td>
              <td className="px-4 py-3">{r.vehiculo}</td>
              <td className="px-4 py-3">{r.chofer}</td>
              <td className="px-4 py-3">
                <Badge {...verificacionTone(r.verificacion)}>
                  {verificacionTone(r.verificacion).label}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {role === "employee" && canPersonalAct?.(r) ? (
                  <div className="flex gap-2">
                    <button
                      className="pill pending"
                      onClick={() => onPersonalMark?.(r, "ENTREGADO")}
                    >
                      ENTREGADO
                    </button>
                    <button
                      className="pill pending"
                      onClick={() => onPersonalMark?.(r, "RECHAZADO")}
                    >
                      RECHAZADO
                    </button>
                  </div>
                ) : (
                  <Badge {...estadoTone(r.estado)}>
                    {estadoTone(r.estado).label}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <EvidenciaCell reparto={r} role={role} />
              </td>
              {role === "admin" && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="icon-btn" onClick={() => onEdit?.(r)}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => onDelete?.(r.id)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-400" colSpan={role === "admin" ? 8 : 7}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// === App principal ===
export default function AppDimacoAuth() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<Role>("employee");
  const [rows, setRows] = useState<Reparto[]>([]);
  const [loading, setLoading] = useState(true);

  // Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Cargar rol y datos
  useEffect(() => {
    const load = async () => {
      if (!session) {
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const uid = session.user.id;

      // rol
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .single();
      setRole((prof?.role as Role) || "employee");

      // repartos (mes actual)
      const start = new Date();
      start.setDate(1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      const { data: rep } = await supabase
        .from("repartos")
        .select("*")
        .gte("fecha", formatDateForInput(start))
        .lt("fecha", formatDateForInput(end))
        .order("fecha", { ascending: false })
        .order("hora_salida", { ascending: false });

      setRows((rep || []) as Reparto[]);
      setLoading(false);
    };
    load();
  }, [session]);

  // realtime
  useEffect(() => {
    const ch = supabase
      .channel("repartos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "repartos" }, (payload: any) => {
        setRows((prev) => {
          const n = [...prev];
          if (payload.eventType === "INSERT") {
            const row = payload.new as Reparto;
            return [row, ...n.filter((r) => r.id !== row.id)];
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as Reparto;
            return n.map((r) => (r.id === row.id ? row : r));
          }
          if (payload.eventType === "DELETE") {
            const id = payload.old.id as string;
            return n.filter((r) => r.id !== id);
          }
          return n;
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const personalCanAct = (r: Reparto) => r.estado === "PENDIENTE" && !r.personal_done;

  const addRow = async (payload: Omit<Reparto, "id" | "created_by" | "created_at" | "updated_at" | "personal_done">) => {
    const toInsert = {
      fecha: payload.fecha,
      hora_salida: upper(payload.hora_salida),
      vehiculo: upper(payload.vehiculo),
      chofer: upper(payload.chofer),
      ayudantes: upper(payload.ayudantes || ""),
      notas_facturas: payload.notas_facturas || "",
      verificador: upper(payload.verificador || ""),
      verificacion: payload.verificacion,
      estado: "PENDIENTE" as const,
      personal_done: false,
    };
    const { error } = await supabase.from("repartos").insert(toInsert);
    if (error) alert("Error al crear: " + error.message);
  };

  const updateRow = async (id: string, patch: Partial<Reparto>) => {
    const { error } = await supabase.from("repartos").update(patch).eq("id", id);
    if (error) alert("Error al actualizar: " + error.message);
  };

  const deleteRow = async (id: string) => {
    const { error } = await supabase.from("repartos").delete().eq("id", id);
    if (error) alert("Error al eliminar: " + error.message);
  };

  const markByPersonal = async (row: Reparto, target: "ENTREGADO" | "RECHAZADO") => {
    if (!personalCanAct(row)) return;
    const { error } = await supabase
      .from("repartos")
      .update({ estado: target, personal_done: true })
      .eq("id", row.id);
    if (error) alert("No permitido: " + error.message);
  };

  if (!session) return <LoginScreen onLogin={() => {}} />;

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      {/* top rojo */}
      <div className="sticky top-0 z-40" style={{ backgroundColor: "#C41230", color: "white" }}>
        <div className="w-full px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="font-semibold text-lg md:text-xl">Verificacion - Materiales Dimaco</div>
          <Badge tone="blue" />
          <button onClick={logout} className="ml-auto bg-white/20 px-3 py-1 rounded-lg">
            Salir
          </button>
        </div>
      </div>

      <main className="w-full p-4 sm:p-6">
        <section className="rounded-2xl bg-white shadow-sm p-2 sm:p-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-lg font-semibold">Repartos</h2>
            <span className="text-sm text-slate-500">{rows.length} resultado(s)</span>
          </div>
          <TableView
            data={rows}
            role={role}
            onEdit={(r) =>
              updateRow(r.id, {
                estado: r.estado,
              })
            }
            onDelete={deleteRow}
            canPersonalAct={personalCanAct}
            onPersonalMark={markByPersonal}
          />
        </section>
      </main>

      <style>{`
        .input{ border-radius: 0.75rem; border: 1px solid rgb(226 232 240); padding: 0.5rem 0.75rem; outline: none; }
        .input:focus{ box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
        .btn{ border-radius: 0.75rem; padding: 0.5rem 1rem; font-weight: 600; box-shadow: 0 1px 1px rgba(0,0,0,0.05); transition: background 0.2s; }
        .btn.primary{ background:#2563eb; color:white; }
        .btn.primary:hover{ background:#1d4ed8; }
        .btn.ghost{ background:white; border:1px solid rgb(226 232 240); }
        .btn.ghost:hover{ background:#f8fafc; }
        .icon-btn{ border:1px solid rgb(226 232 240); border-radius: 0.5rem; padding: 0.25rem 0.5rem; }
        .icon-btn:hover{ background:#f1f5f9; }
        .pill{ border-radius:9999px; padding: 0.25rem 0.75rem; font-size:0.75rem; font-weight:400; border:1px solid transparent; }
        .pill.pending{ background:#FFF4CC; color:#92400E; border-color:#FFE39A; }
        .pill.pending:hover{ background:#FFEFB3; }
      `}</style>
    </div>
  );
}

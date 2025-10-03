// src/app/repartos/page.tsx
import dynamic from "next/dynamic";

const AppDimacoAuth = dynamic(
  () => import("../../components/AppDimacoAuth").then((m) => m.default), // 👈 dos puntos: ../../
  {
    ssr: false,
    loading: () => <p className="p-6">Cargando app...</p>,
  }
);

export default function RepartosPage() {
  return <AppDimacoAuth />;
}

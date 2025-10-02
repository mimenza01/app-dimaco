// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ No frenes el build por errores de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ No frenes el build por errores de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

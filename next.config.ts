import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Obrázky už optimalizujeme v MinIO / R2 — Vercel Image Optimization nepoužíváme.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const R2_PUBLIC = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  'https://pub-d4238224a90a49f98bf05b686985171f.r2.dev'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  images: {
    // Obrázky už optimalizujeme v MinIO / R2 — Vercel Image Optimization nepoužíváme.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-d4238224a90a49f98bf05b686985171f.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        pathname: '/**',
      },
    ],
  },
  // Same-origin proxy so catalog images aren't blocked by filters on *.r2.dev
  async rewrites() {
    return [
      {
        source: '/r2/:path*',
        destination: `${R2_PUBLIC}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/r2/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

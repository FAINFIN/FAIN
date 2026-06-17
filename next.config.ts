import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // HTML pages: always revalidate, never serve stale
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Static assets have content-hashed names — safe to cache forever
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Logo images — cache 1 day, revalidate in background
        source: '/logos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
    ]
  },
}

export default nextConfig

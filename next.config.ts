import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false, // removes X-Powered-By: Next.js
  experimental: {},
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Security + compatibility headers on HTML pages only
        // Excludes: /_next/static/, /_next/image/, /api/, /logos/
        source: '/((?!_next/static|_next/image|api|logos).*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          // CSP frame-ancestors replaces X-Frame-Options (stronger, more consistent)
          { key: 'Content-Security-Policy',  value: "frame-ancestors 'none'" },
          // Explicitly disable the deprecated XSS auditor so scanners stop flagging it
          { key: 'X-XSS-Protection',         value: '0' },
          { key: 'Cache-Control',             value: 'public, no-cache' },
        ],
      },
      {
        // Static assets: content-hashed, safe to cache forever
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Logo images — cache 1 day, revalidate in background
        source: '/logos/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
    ]
  },
}

export default nextConfig

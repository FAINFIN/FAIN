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
        // Security headers on all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          // Use CSP frame-ancestors instead of X-Frame-Options (more consistent + stronger)
          { key: 'Content-Security-Policy',  value: "frame-ancestors 'none'" },
        ],
      },
      {
        // HTML pages: always revalidate, never serve stale
        // Use 'no-cache' instead of 'max-age=0, must-revalidate' (same semantics, cleaner)
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, no-cache' },
        ],
      },
      {
        // Static assets have content-hashed names — safe to cache forever
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

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [],
  },
  eslint: {
    ignoreDuringBuilds: true, // ESLint handles style; tsc handles correctness
  },
}

export default nextConfig

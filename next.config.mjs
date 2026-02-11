import { createRequire } from "module"
const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['amazon-paapi'],
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Empty turbopack config to satisfy Next 16 (avoids webpack/turbopack conflict)
  turbopack: {},
}

let config = nextConfig
try {
  const { withSentryConfig } = require("@sentry/nextjs")
  config = withSentryConfig(config, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
  })
} catch {
  // @sentry/nextjs not installed — app works without Sentry
}

export default config

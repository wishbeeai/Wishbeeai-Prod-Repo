/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude problematic packages from server bundling
  serverExternalPackages: ['amazon-paapi'],
}

export default nextConfig

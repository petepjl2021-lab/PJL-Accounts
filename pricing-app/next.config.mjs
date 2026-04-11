/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for deployment / Electron wrapping
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
}

export default nextConfig

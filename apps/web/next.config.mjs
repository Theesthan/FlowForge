/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' output requires symlink privileges (enable for Docker/prod builds)
  // output: 'standalone',
  transpilePackages: ['@flowforge/types'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig

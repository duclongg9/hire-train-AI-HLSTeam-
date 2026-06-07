/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_PRIVATE_URL || 'http://localhost:8000'}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${process.env.BACKEND_PRIVATE_URL || 'http://localhost:8000'}/health`,
      },
    ];
  },
}

export default nextConfig

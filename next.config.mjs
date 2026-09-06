/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // NOTE: Do NOT add rewrites for /api/v1/*.
  // All backend proxying is handled by app/api/[...path]/route.ts which
  // injects X-Admin-Secret server-side. A rewrite rule bypasses that handler
  // and sends requests directly to FastAPI without the required header.
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/api/forms/public/*/qr': ['./public/brand/logo.png'],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

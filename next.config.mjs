/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
    turbo: {
      loaders: {
        '.css': ['@tailwindcss/postcss']
      }
    }
  }
}

export default nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image configuration from next.config.mjs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains
      },
      {
        protocol: 'http', 
        hostname: '**', // Allow all HTTP domains (for localhost testing)
      }
    ],
  },
  // Webpack configuration from next.config.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude lighthouse from webpack bundling to avoid import.meta issues
      config.externals = [...(config.externals || []), 'lighthouse', 'puppeteer']
    }
    return config
  }
}

module.exports = nextConfig
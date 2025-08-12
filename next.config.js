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
  // Modern security headers for 2025
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
              "frame-src 'self' https: http:",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Enable static exports for better SEO
  trailingSlash: false,
  // Webpack configuration from next.config.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude lighthouse from webpack bundling to avoid import.meta issues
      config.externals = [...(config.externals || []), 'lighthouse', 'puppeteer']
    }
    return config
  },
  // Experimental features for better performance
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = nextConfig
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
        hostname: 'localhost', // Allow localhost specifically
      },
      {
        protocol: 'http', 
        hostname: '127.0.0.1', // Allow localhost IP
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP domains for development
      }
    ],
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in dev
  },
  // Modern security headers for 2025
  async headers() {
    return [
      // Proxy API routes - Permissive headers for embedded content
      {
        source: '/api/proxy-html',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src *",
              "script-src * 'unsafe-eval' 'unsafe-inline'",
              "style-src * 'unsafe-inline'",
              "img-src * data: blob:",
              "font-src *",
              "connect-src *",
              "frame-src *",
              "media-src *",
              "object-src *",
              "base-uri *",
              "form-action *"
            ].join('; '),
          },
          // NO X-Frame-Options here - allows iframe embedding
        ],
      },
      // Asset proxy routes - Permissive headers for assets
      {
        source: '/api/proxy-asset',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          // NO frame-blocking headers for assets
        ],
      },
      // Proxy API - Allow embedding
      {
        source: '/api/proxy',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          }
        ],
      },
      // All other routes - secure headers
      {
        source: '/:path((?!api/proxy|api/proxy-html|api/proxy-asset).*)',
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
    serverComponentsExternalPackages: ['playwright'],
  },
}

module.exports = nextConfig
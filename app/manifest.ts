import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Website Viewer | Layout Lab',
    short_name: 'Website Viewer',
    description: 'View websites in different device sizes - desktop, tablet, and mobile viewports all at once',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    categories: ['productivity', 'developer', 'utilities'],
    lang: 'en-US',
    dir: 'ltr'
  }
}

import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Analytics } from '@vercel/analytics/next'

import { Outfit } from 'next/font/google'
import Header from '@/components/Header'
import AuthDialogWrapper from '@/components/AuthDialogWrapper'
import { Toaster } from 'sonner'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { HistoryProvider } from '@/contexts/HistoryContext'
import { WebsiteViewerProvider } from '@/contexts/WebsiteViewerContext'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import WebsiteViewerSidebar from '@/components/WebsiteViewerSidebar'
import ClientOnly from '@/components/ClientOnly'

const fontSans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
})

const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://layoutlab.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Website Viewer | Layout Lab',
    template: '%s | Website Viewer'
  },
  description:
    'View websites in different device sizes - desktop, tablet, and mobile viewports all at once. Perfect for developers and designers testing responsive layouts.',
  keywords: [
    'website viewer',
    'responsive design',
    'mobile testing',
    'viewport testing',
    'web development',
    'layout testing',
    'device simulator'
  ],
  authors: [{ name: 'Layout Lab' }],
  creator: 'Layout Lab',
  publisher: 'Layout Lab',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: 'Website Viewer | Layout Lab',
    description:
      'View websites in different device sizes - desktop, tablet, and mobile viewports all at once. Perfect for developers and designers testing responsive layouts.',
    siteName: 'Website Viewer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Website Viewer - View sites in multiple device sizes'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Website Viewer | Layout Lab',
    description:
      'View websites in different device sizes - desktop, tablet, and mobile viewports all at once.',
    images: ['/og-image.png'],
    creator: '@layoutlab'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon'
  },
  manifest: '/manifest.json',
  category: 'technology',
  classification: 'Web Development Tool',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Website Viewer',
    'application-name': 'Website Viewer',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body
        className={`${fontSans.variable} min-h-screen flex flex-col font-sans antialiased`}
      >
        <Toaster richColors />
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem={false}
          forcedTheme='light'
        >
          <FavoritesProvider>
            <HistoryProvider>
              <WebsiteViewerProvider>
                <Header />
                <main className='flex-1 pt-16'>{children}</main>
                <AuthDialogWrapper />
              </WebsiteViewerProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

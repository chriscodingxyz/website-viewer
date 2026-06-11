import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Analytics } from '@vercel/analytics/next'

import { Inter, Instrument_Serif } from 'next/font/google'
import Header from '@/components/Header'
import AuthDialogWrapper from '@/components/AuthDialogWrapper'
import { Toaster } from 'sonner'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { HistoryProvider } from '@/contexts/HistoryContext'
import { WebsiteViewerProvider } from '@/contexts/WebsiteViewerContext'
import FeedbackProviderWrapper from '@/components/FeedbackProviderWrapper'
import AppMain from '@/components/AppMain'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
})

const fontSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap'
})

const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://layoutlab.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'WebViewer. Preview any site across all devices.',
    template: '%s | WebViewer'
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
  authors: [{ name: 'WebViewer' }],
  creator: 'WebViewer',
  publisher: 'WebViewer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: 'WebViewer. Preview any site across all devices.',
    description:
      'Preview any URL across desktop, tablet, and mobile in parallel. Inspect SEO, social cards, and technical metadata, all in one tab.',
    siteName: 'WebViewer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WebViewer. Preview any site across all devices.'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebViewer. Preview any site across all devices.',
    description:
      'Preview any URL across desktop, tablet, and mobile in parallel. Inspect SEO, social cards, and technical metadata, all in one tab.',
    images: ['/og-image.png']
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
  manifest: '/manifest.webmanifest',
  category: 'technology',
  classification: 'Web Development Tool',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'WebViewer',
    'application-name': 'WebViewer',
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
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} min-h-screen flex flex-col font-sans antialiased`}
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
                <FeedbackProviderWrapper>
                  <Header />
                  <AppMain>{children}</AppMain>
                  <AuthDialogWrapper />
                </FeedbackProviderWrapper>
              </WebsiteViewerProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

import { IBM_Plex_Mono } from 'next/font/google'
import Footer from '@/components/Footer'
import { Header } from '@/components/Header'
import { Toaster } from 'sonner'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { HistoryProvider } from '@/contexts/HistoryContext'
import { WebsiteViewerProvider } from '@/contexts/WebsiteViewerContext'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400']
})

export const metadata: Metadata = {
  title: 'Website Viewer | Layout Lab',
  description: 'View websites in different device sizes'
}

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${ibmPlexMono.className} min-h-screen flex flex-col`}>
        <Toaster richColors />
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <FavoritesProvider>
            <HistoryProvider>
              <WebsiteViewerProvider>
                <Header />
                <main className='flex-1'>{children}</main>
                <Footer />
              </WebsiteViewerProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

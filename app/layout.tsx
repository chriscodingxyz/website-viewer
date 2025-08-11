import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

import { IBM_Plex_Mono, Inter, Roboto, Montserrat, Poppins, Lato, Playfair_Display } from 'next/font/google'
import Footer from '@/components/Footer'
import { Header } from '@/components/Header'
import { Toaster } from 'sonner'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { HistoryProvider } from '@/contexts/HistoryContext'
import { WebsiteViewerProvider } from '@/contexts/WebsiteViewerContext'
import { FontProvider } from '@/contexts/FontContext'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-ibm-plex-mono'
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter'
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto'
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat'
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
})

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato'
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair-display'
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
      <body className={`${ibmPlexMono.variable} ${inter.variable} ${roboto.variable} ${montserrat.variable} ${poppins.variable} ${lato.variable} ${playfairDisplay.variable} min-h-screen flex flex-col font-sans`}>
        <Toaster richColors />
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <FontProvider>
            <FavoritesProvider>
              <HistoryProvider>
                <WebsiteViewerProvider>
                  <Header />
                  <main className='flex-1'>{children}</main>
                  <Footer />
                </WebsiteViewerProvider>
              </HistoryProvider>
            </FavoritesProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

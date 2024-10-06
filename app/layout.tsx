import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Header } from '@/components/Header'
import { IBM_Plex_Mono } from 'next/font/google'
import Footer from '@/components/Footer'
import { Toaster } from 'sonner'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { HistoryProvider } from '@/contexts/HistoryContext'

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
      <body className={`${ibmPlexMono.className} flex flex-col min-h-[100dvh]`}>
        <Toaster richColors />
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <FavoritesProvider>
            <HistoryProvider>
              <Header />
              <main className='flex-grow'>{children}</main>
              <Footer />
            </HistoryProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

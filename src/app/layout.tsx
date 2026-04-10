import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import './globals.css'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { ThemeProvider } from '@/components/settings/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return {
    title: 'Chrysalide',
    description: t('description'),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Chrysalide',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#5BCEFA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className="dark" data-color-scheme="trans" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background min-h-screen antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {/* Subtle warm overlay for cozy atmosphere */}
            <div
              className="pointer-events-none fixed inset-0 z-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(245, 169, 184, 0.015) 0%, transparent 30%, rgba(91, 206, 250, 0.015) 100%)',
              }}
            />

            <main className="relative z-10 min-h-screen pb-24">{children}</main>
            <BottomNav />
            <ServiceWorkerRegister />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}

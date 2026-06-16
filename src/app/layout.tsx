import type { Metadata, Viewport } from 'next'
import { LocaleProvider } from '@/lib/i18n/LocaleContext'
import { LocaleBody } from '@/components/ui/LocaleBody'
import { ServiceWorkerRegistration } from '@/components/ui/ServiceWorker'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title:       { template: '%s · Fain', default: 'Fain — Financial clarity for founders' },
  description: 'AI financial controller for SME founders. Ask anything about your money.',
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Fain' },
  icons: {
    icon:  [{ url: '/icon-192.png', sizes: '192x192' }, { url: '/favicon.ico' }],
    apple: [{ url: '/icon-192.png' }],
  },
}

export const viewport: Viewport = {
  themeColor:   '#fefdfb',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit:  'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400..700&family=Instrument+Serif:ital@0;1&family=Noto+Sans+Georgian:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <ToastProvider>
            <LocaleBody />
            <ServiceWorkerRegistration />
            {children}
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}

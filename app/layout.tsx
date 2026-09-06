import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'vectorbase — Multi-tenant RAG infrastructure',
  description: 'Build, monitor, and ship production-ready LLM retrieval experiences.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png',  media: '(prefers-color-scheme: dark)'  },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7fb' },
    { media: '(prefers-color-scheme: dark)',  color: '#0e0e16' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="antialiased font-sans">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {/* VectorBase chatbot widget */}
        {process.env.NEXT_PUBLIC_PUBLIC_KEY && (
          <script
            src={process.env.NEXT_PUBLIC_WIDGET_LINK || 'https://vector-base.b-cdn.net/widget.js'}
            data-api-key={process.env.NEXT_PUBLIC_PUBLIC_KEY}
            data-api-url={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`}
            defer
          />
        )}
      </body>
    </html>
  )
}

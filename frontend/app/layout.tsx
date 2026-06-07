import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const beVietnamPro = Be_Vietnam_Pro({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['vietnamese'],
  variable: '--font-be-vietnam-pro'
})

export const metadata: Metadata = {
  title: 'HireTrain AI - AI Recruitment Platform',
  description: 'AI-powered recruitment workflow for HR teams and candidates',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${beVietnamPro.variable} antialiased text-slate-800`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SVLV - Управление автопарком',
  description: 'Управление автопарком',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Анимированные блобы */}
        <div className="gradient-bg-blobs">
          <div className="blob-1" />
          <div className="blob-2" />
          <div className="blob-3" />
          <div className="blob-4" />
          <div className="blob-5" />
        </div>

        {children}
      </body>
    </html>
  )
}
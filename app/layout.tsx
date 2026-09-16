import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Tiny Trails · A little adventure in thinking',
  description:
    'Plan a path, collect treasures, and grow your thinking skills. A playful coding adventure for explorers ages 6 and up.',
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Design Explorer',
  description: 'Explore multi-objective design iteration data',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}

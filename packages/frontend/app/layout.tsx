import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = { title: 'Pokerverse', description: 'Web3 Texas Hold’em' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}



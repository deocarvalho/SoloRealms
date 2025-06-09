import type { Metadata } from 'next'
import { Inter, Cinzel_Decorative } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const cinzelDecorative = Cinzel_Decorative({ 
  weight: '700',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Solo Realms',
  description: 'Play solo D&D-style adventure books interactively',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-primary text-white">
          {children}
        </main>
      </body>
    </html>
  )
} 
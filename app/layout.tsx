import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'PLATY — Tu menú semanal más barato, en 1 clic',
  description: 'Ingredientes locales, cantidades con unidades y costo estimado para tu ciudad. PDF + WhatsApp.',
  openGraph: {
    title: 'PLATY — Menú semanal económico',
    description: 'Ingredientes locales + lista de compras consolidada. Cocina en 30–45 min.',
    url: 'https://platy.app',
    siteName: 'PLATY',
    images: [{ url: '/og.jpg', width: 1200, height: 630 }],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLATY — Menú semanal económico',
    description: 'Ingredientes locales + lista de compras consolidada.',
    images: ['/og.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased text-charcoal bg-sand`}>
        {children}
      </body>
    </html>
  )
}

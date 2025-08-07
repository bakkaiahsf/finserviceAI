import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nexus AI - Corporate Intelligence Platform',
  description: 'AI-powered beneficial ownership verification and corporate structure analysis',
  keywords: 'corporate intelligence, beneficial ownership, compliance, AI, financial services',
  authors: [{ name: 'Nexus AI Team' }],
  creator: 'Nexus AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Nexus AI - Corporate Intelligence Platform',
    description: 'AI-powered beneficial ownership verification and corporate structure analysis',
    siteName: 'Nexus AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus AI - Corporate Intelligence Platform',
    description: 'AI-powered beneficial ownership verification and corporate structure analysis',
    creator: '@nexusai',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import Web3Provider from '@/components/web3-provider'
import { Web3AuthProvider } from '@/components/web3auth-provider'
import { SmartAccountProvider } from '@/lib/smart-account/smart-account-provider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PRaise — Open Source Bounties That Pay Themselves',
  description:
    'AI agents verify GitHub contributions and release payments instantly through non-custodial smart accounts on Arbitrum Sepolia.',
  keywords: ['open source', 'bounty', 'AI', 'blockchain', 'Arbitrum', 'GitHub', 'smart contract', 'Web3', 'MetaMask', 'gasless'],
  authors: [{ name: 'PRaise' }],
  openGraph: {
    title: 'PRaise — Open Source Bounties That Pay Themselves',
    description:
      'AI agents verify GitHub contributions and release payments instantly through non-custodial smart accounts.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${spaceGrotesk.variable} ${spaceMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <Web3Provider>
          <Web3AuthProvider>
            <SmartAccountProvider>
              {children}
              <Toaster position="top-right" />
            </SmartAccountProvider>
          </Web3AuthProvider>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}

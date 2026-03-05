import type { Metadata } from 'next'
import { RootProvider } from './rootProvider'
import './globals.css'
import WalletSetup from './WalletSetup'
import { HiddenWalletButton } from './HiddenWalletButton'

export const metadata: Metadata = {
  title: 'Penalty Blitz',
  description: 'Penalty shootout game on Base',
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      name: 'Penalty Blitz',
      iconUrl: 'https://penaltyblitz.vercel.app/icon.png',
      splashImageUrl: 'https://penaltyblitz.vercel.app/splash.png',
      splashBackgroundColor: '#1a1a2e',
      homeUrl: 'https://penaltyblitz.vercel.app',
      buttonTitle: '⚽ Play Now'
    })
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RootProvider>
          {children}
          <WalletSetup />
          <HiddenWalletButton />
        </RootProvider>
      </body>
    </html>
  )
}

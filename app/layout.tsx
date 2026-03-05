import type { Metadata } from 'next'
import { RootProvider } from './rootProvider'
import './globals.css'
import WalletSetup from './WalletSetup'
import { HiddenWalletButton } from './HiddenWalletButton'
import { FarcasterInit } from './FarcasterInit'

const frame = {
  version: "1",
  imageUrl: "https://penaltyblitz.vercel.app/image.png",
  button: {
    title: "⚽ Play Now",
    action: {
      type: "launch_frame",
      name: "Penalty Blitz",
      url: "https://penaltyblitz.vercel.app",
      splashImageUrl: "https://penaltyblitz.vercel.app/splash.png",
      splashBackgroundColor: "#101C3F"
    }
  }
}

export const metadata: Metadata = {
  title: 'Penalty Blitz',
  description: 'Penalty shootout game on Base',
  other: {
    "fc:miniapp": JSON.stringify(frame),
    'base:app_id': '69a954df0050dd24efcc1e3a'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <RootProvider>
          <FarcasterInit />
          {children}
          <WalletSetup />
          <HiddenWalletButton />
        </RootProvider>
      </body>
    </html>
  )
}

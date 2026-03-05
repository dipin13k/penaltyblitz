import type { Metadata } from 'next'
import Script from 'next/script'
import { RootProvider } from './rootProvider'
import './globals.css'
import WalletSetup from './WalletSetup'
import { HiddenWalletButton } from './HiddenWalletButton'
import { FarcasterInit } from './FarcasterInit'

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
    }),
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
        <Script
          src="https://cdn.jsdelivr.net/npm/@farcaster/miniapp-sdk/dist/index.min.js"
          strategy="beforeInteractive"
        />
        <Script
          id="farcaster-ready"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function callReady() {
                  if (window.miniapp && window.miniapp.sdk) {
                    window.miniapp.sdk.actions.ready();
                  } else {
                    setTimeout(callReady, 100);
                  }
                }
                callReady();
              })();
            `
          }}
        />
      </body>
    </html>
  )
}

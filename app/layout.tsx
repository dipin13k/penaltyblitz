import type { Metadata } from 'next'
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
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (window.ReactNativeWebView || 
                      window.location !== window.parent.location ||
                      navigator.userAgent.includes('Warpcast') ||
                      navigator.userAgent.includes('FarcasterApp')) {
                    var checkSdk = setInterval(function() {
                      if (window.__farcasterSdk && 
                          window.__farcasterSdk.actions && 
                          window.__farcasterSdk.actions.ready) {
                        window.__farcasterSdk.actions.ready();
                        clearInterval(checkSdk);
                      }
                    }, 50);
                    setTimeout(function() {
                      clearInterval(checkSdk);
                    }, 3000);
                  }
                } catch(e) {}
              })();
            `
          }}
        />
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

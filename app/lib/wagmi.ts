import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'
import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    coinbaseWallet({ appName: 'Penalty Blitz' })
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org')
  }
})

"use client";
import { ReactNode, useEffect } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { WagmiProvider, useReconnect, useConnect, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./lib/wagmi";

const queryClient = new QueryClient();

function AutoReconnect() {
  const { reconnect } = useReconnect()
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (isConnected) return

    const init = async () => {
      // Step 1: try reconnecting existing session
      reconnect()

      // Step 2: explicitly try farcaster connector
      setTimeout(() => {
        const farcasterConnector = connectors.find(
          c => c.id === 'farcasterMiniApp'
        )
        if (farcasterConnector) {
          console.log('Auto-connecting farcasterMiniApp...')
          connect({ connector: farcasterConnector })
        } else {
          console.log('farcasterMiniApp not found')
          console.log('Available connectors:',
            connectors.map(c => c.id))
        }
      }, 500)
    }

    init()
  }, [reconnect, connect, connectors, isConnected])

  return null
}

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: "auto",
            },
            wallet: {
              display: "modal",
              preference: "all",
            },
          }}
          miniKit={{
            enabled: true,
          }}
        >
          <AutoReconnect />
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

"use client"

import { useMemo } from "react"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"

import { MoongateWalletAdapter } from "./adapter"

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), [])
  // const endpoint = useMemo(() => clusterApiUrl("devnet"), []);

  const wallets = useMemo(() => [new MoongateWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

"use client"

import { useMemo } from "react"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"
import { registerMoonGateWallet } from "./index"
import { MoongateWalletAdapter } from "./ui/adapter"
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare"
import { registerTipLinkWallet } from "@tiplink/wallet-adapter"

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), [])

  // const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  registerMoonGateWallet({ authMode: "Ethereum", position: "top-left" })
  registerMoonGateWallet({ authMode: "Google", position: "top-right" })
  registerTipLinkWallet({
    clientId: "3d8bfc06-7a3e-4835-940e-e3ac1d6cdd6b",
    theme: 'dark',
    title: 'Moonwalk',
    rpcUrl: process.env.REACT_APP_RPC!,
  });
  const wallets = useMemo(() => [

    /* new MoongateWalletAdapter({ authMode: "Google" }), */
    /*     new MoongateWalletAdapter() */
    new SolflareWalletAdapter(),
  ], [])


  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

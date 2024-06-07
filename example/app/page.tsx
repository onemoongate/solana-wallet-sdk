"use client"

import dynamic from "next/dynamic"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"

import "@solana/wallet-adapter-react-ui/styles.css"

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
)

export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10 relative">
      <WalletMultiButtonDynamic />
    </section>
  )
}

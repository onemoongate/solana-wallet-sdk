import {
  BaseMessageSignerWalletAdapter,
  WalletAccountError,
  WalletConfigError,
  WalletConnectionError,
  WalletDisconnectionError,
  WalletError,
  WalletLoadError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
  isVersionedTransaction,
  type SendTransactionOptions,
  type WalletName,
} from "@solana/wallet-adapter-base"
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
  TransactionVersion,
  VersionedTransaction,
} from "@solana/web3.js"

import { MoonGateEmbed } from "../../dist/index"

export const MoongateWalletName = "Ethereum Wallet" as WalletName<"MoonGate">

export class MoongateWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = MoongateWalletName
  url = "https://moongate.one"
  icon =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKYXJpYS1sYWJlbD0iRXRoZXJldW0iIHJvbGU9ImltZyIKdmlld0JveD0iMCAwIDUxMiA1MTIiPjxyZWN0CndpZHRoPSI1MTIiIGhlaWdodD0iNTEyIgpyeD0iMTUlIgpmaWxsPSIjZmZmZmZmIi8+PHBhdGgKZmlsbD0iIzNDM0MzQiIgZD0ibTI1NiAzNjJ2MTA3bDEzMS0xODV6Ii8+PHBhdGgKZmlsbD0iIzM0MzQzNCIgZD0ibTI1NiA0MWwxMzEgMjE4LTEzMSA3OC0xMzItNzgiLz48cGF0aApmaWxsPSIjOEM4QzhDIiBkPSJtMjU2IDQxdjE1OGwtMTMyIDYwbTAgMjVsMTMyIDc4djEwNyIvPjxwYXRoCmZpbGw9IiMxNDE0MTQiIGQ9Im0yNTYgMTk5djEzOGwxMzEtNzgiLz48cGF0aApmaWxsPSIjMzkzOTM5IiBkPSJtMTI0IDI1OWwxMzItNjB2MTM4Ii8+PC9zdmc+"
  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> =
    new Set(["legacy", 0])

  private _connecting: boolean
  private _wallet: MoonGateEmbed | null
  private _position: string = "top-right"
  private _publicKey: PublicKey | null
  private _readyState: WalletReadyState =
    typeof window === "undefined" || typeof document === "undefined"
      ? WalletReadyState.Unsupported
      : WalletReadyState.Installed

  constructor(config?: { position?: string }) {
    super()
    this._connecting = false
    this._wallet = null
    this._publicKey = null
    if (config?.position) {
      this._position = config.position
    }
  }

  get publicKey() {
    return this._publicKey
  }

  get connecting() {
    return this._connecting
  }

  get connected() {
    return !!this._publicKey
  }

  get readyState() {
    return this._readyState
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return
    if (this._wallet) {
      throw new WalletConnectionError("Already connected")
    }

    this._connecting = true

    try {
      this._wallet = new MoonGateEmbed()
      const publicKeyData: string = await this._wallet.sendCommand<string>(
        "login",
        {
          host: window.location.origin,
        }
      )

      if (publicKeyData) {
        let publicKey = new PublicKey(publicKeyData)
        this._publicKey = publicKey
        this.emit("connect", publicKey)
        if (this?._position) {
          this._wallet.moveModal(this?._position)
        } else {
          this._wallet.moveModal()
        }
      } else {
        throw new WalletPublicKeyError("No response from MoonGate wallet.")
      }
    } catch (error) {
      console.error("Error encountered during connection:", error)
      throw new WalletConnectionError((error as Error).message)
    } finally {
      this._connecting = false
      console.log("Connected:", this._publicKey?.toString())
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this._wallet?.disconnect()
      this._wallet = null
      this._publicKey = null
      this.emit("disconnect")
    } catch (error) {
      console.error("Error encountered during disconnection:", error)
      throw new WalletDisconnectionError((error as Error).message)
    }
  }

  async sendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options: SendTransactionOptions = {}
  ): Promise<TransactionSignature> {
    let signature: TransactionSignature
    if (!this._wallet) {
      throw new WalletNotConnectedError()
    }
    try {
      if (!isVersionedTransaction(transaction)) {
        transaction = (await this.prepareTransaction(
          transaction,
          connection,
          options
        )) as T
      }
      const signedTx = await this.signTransaction(transaction)
      signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        options
      )
      return signature
    } catch (error) {
      console.error("Error encountered during transaction submission:", error)
      throw new WalletSendTransactionError((error as Error).message)
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    if (!this._wallet) {
      throw new WalletNotConnectedError()
    }
    if (isVersionedTransaction(transaction)) {
      const data = transaction.serialize()
      try {
        const signedTransaction: any = await this._wallet.sendCommand<string>(
          "signTransaction",
          {
            transaction: data,
            host: window.location.origin,
            isVersionedTransaction: true,
          }
        )
        const finalTransaction = VersionedTransaction.deserialize(
          signedTransaction
        ) as T
        return finalTransaction
      } catch (error) {
        console.error("Error encountered during transaction signing:", error)
        throw new WalletSignTransactionError((error as Error).message)
      }
    } else {
      try {
        const data = transaction
          .serialize({ requireAllSignatures: false, verifySignatures: false })
          .toString("base64")
        const signedTransaction: any = await this._wallet.sendCommand<string>(
          "signTransaction",
          {
            transaction: data,
            host: window.location.origin,
            isVersionedTransaction: false,
          }
        )
        const finalTransaction = Transaction.from(
          Uint8Array.from(signedTransaction)
        ) as T
        return finalTransaction
      } catch (error) {
        console.error("Error encountered during transaction signing:", error)
        throw new WalletSignTransactionError((error as Error).message)
      }
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    // take an array of transactions and sign them all one by one using the signTransaction method. Wait for the result of each one before moving on to the next.
    // log transactions
    const signedTransactions: T[] = []
    for (const transaction of transactions) {
      signedTransactions.push(await this.signTransaction(transaction))
    }
    return signedTransactions
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._wallet) {
      throw new WalletNotConnectedError()
    }
    try {
      const signedMessage: any = await this._wallet.sendCommand<string>(
        "signMessage",
        {
          host: window.location.origin,
          message: message,
        }
      )
      const Uint8ArraySignedMessage = Uint8Array.from(signedMessage)
      return Uint8ArraySignedMessage
    } catch (error) {
      console.error("Error encountered during message signature:", error)
      throw new WalletSignMessageError((error as Error).message)
    }
  }
}

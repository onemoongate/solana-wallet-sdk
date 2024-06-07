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

import { MoonGateEmbed } from "../../../dist/index"

export const MoongateWalletName = "Ethereum Wallet" as WalletName<"MoonGate">

export class MoongateWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = MoongateWalletName
  url = "https://moongate.one"
  icon = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKYXJpYS1sYWJlbD0iRXRoZXJldW0iIHJvbGU9ImltZyIKdmlld0JveD0iMCAwIDUxMiA1MTIiPjxyZWN0CndpZHRoPSI1MTIiIGhlaWdodD0iNTEyIgpyeD0iMTUlIgpmaWxsPSIjZmZmZmZmIi8+PHBhdGgKZmlsbD0iIzNDM0MzQiIgZD0ibTI1NiAzNjJ2MTA3bDEzMS0xODV6Ii8+PHBhdGgKZmlsbD0iIzM0MzQzNCIgZD0ibTI1NiA0MWwxMzEgMjE4LTEzMSA3OC0xMzItNzgiLz48cGF0aApmaWxsPSIjOEM4QzhDIiBkPSJtMjU2IDQxdjE1OGwtMTMyIDYwbTAgMjVsMTMyIDc4djEwNyIvPjxwYXRoCmZpbGw9IiMxNDE0MTQiIGQ9Im0yNTYgMTk5djEzOGwxMzEtNzgiLz48cGF0aApmaWxsPSIjMzkzOTM5IiBkPSJtMTI0IDI1OWwxMzItNjB2MTM4Ii8+PC9zdmc+`
  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> =
    new Set(["legacy", 0])

  private _connecting: boolean
  private _wallet: MoonGateEmbed | null
  private _position: string = "top-right"
  private _authMode: string = "Ethereum"
  private _publicKey: PublicKey | null
  private _readyState: WalletReadyState =
    typeof window === "undefined" || typeof document === "undefined"
      ? WalletReadyState.Unsupported
      : WalletReadyState.Installed

  constructor(config?: { position?: string, authMode?: string }) {
    super()
    this._connecting = false
    this._wallet = null
    this._publicKey = null
    if (typeof window !== "undefined") {
      window.addEventListener("message", this._handleMessage.bind(this));
    }
    if (config?.position) {
      this._position = config.position
    }
    if (config?.authMode) {
      this._authMode = config.authMode
      if (config.authMode === "Google") {
        this.name = "Sign in with Google" as WalletName<"MoonGate">
        this.icon = "data:image/png;base64,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"
      }

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
      this._wallet = new MoonGateEmbed({ authModeAdapter: this._authMode })
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

  private async _handleMessage(event: MessageEvent) {
    if (event.data && event.data.type === "moongate") {
      const { command } = event.data;
      if (command === "disconnect") {
        await this.disconnect();
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this._wallet?.disconnect()
      this._wallet = null
      this._publicKey = null
      this._connecting = false
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

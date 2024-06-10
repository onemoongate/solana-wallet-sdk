import type { WalletName } from "@solana/wallet-adapter-base";
import {
    BaseSignInMessageSignerWalletAdapter,
    WalletConfigError,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletPublicKeyError,
    WalletReadyState,
    WalletSignInError,
    WalletSignMessageError,
    BaseMessageSignerWalletAdapter,
    isVersionedTransaction,
    WalletSignTransactionError,
    WalletSendTransactionError,
    SendTransactionOptions
} from "@solana/wallet-adapter-base";
import {
    Transaction,
    TransactionVersion,
    Connection,
    TransactionSignature,
    VersionedTransaction,

} from "@solana/web3.js";
import { registerWalletAdapter } from "./wallet";
import { PublicKey } from "@solana/web3.js";

import type {
    SolanaSignInInput,
    SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { MoonGateEmbed } from "../../dist/index.js";


interface MoonGateWindow extends Window { }

declare const window: MoonGateWindow;


export type CustomSolanaSignInInput =
    | SolanaSignInInput
    | (() => Promise<SolanaSignInInput>);

type ConnectOutput = {
    siwsOutput?: SolanaSignInOutput;
};


// This will register the TipLink Wallet as a standard wallet (as part of the wallet standard).
// It can be called outside of a React component.
export const registerMoonGateWallet = ({
    authMode = "Google",
    logoDataUri = "Default",
    position = "top-right",
}: {
    authMode?: string;
    position?: string;
    logoDataUri?: string;
}) => {
    if (typeof window === "undefined") {
        return () => {
            return;
        };
    }
    return registerWalletAdapter(
        new MoongateWalletAdapter2({
            authMode: authMode,
            position: position,
            logoDataUri: logoDataUri,
        }),
        "solana:mainnet"
    );
};




export const MoongateWalletName = "Ethereum Wallet" as WalletName<"MoonGate">

export class MoongateWalletAdapter2 extends BaseSignInMessageSignerWalletAdapter {
    name = MoongateWalletName
    url = "https://moongate.one"
    icon = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTcxIiBoZWlnaHQ9IjE3MyIgdmlld0JveD0iMCAwIDE3MSAxNzMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNDAiIGhlaWdodD0iMTQwIiByeD0iNiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTM0IDc4LjA0M0w2OS44MTY2IDk5LjExNjhWMTI4LjI5OEwzNCA3OC4wNDNaIiBmaWxsPSIjRjdDQkJGIiBzdHJva2U9IiMyQjFFQkMiIHN0cm9rZS13aWR0aD0iMC42MjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTM0IDcxLjIzNDdMNjkuODE2NiA1NC45ODY3VjEyTDM0IDcxLjIzNDdaIiBmaWxsPSIjRjdDQkJGIiBzdHJva2U9IiMyQjFFQkMiIHN0cm9rZS13aWR0aD0iMC42MjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTM0IDcxLjIzNjJMNjkuODE2NiA1NC45ODgzVjkyLjMzOThMMzQgNzEuMjM2MloiIGZpbGw9IiM4MUE5RjgiIHN0cm9rZT0iIzJCMUVCQyIgc3Ryb2tlLXdpZHRoPSIwLjYyNSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTA1LjYzMyA3OC4wNDNMNjkuODE2NCA5OS4xMTY4VjEyOC4yOThMMTA1LjYzMyA3OC4wNDNaIiBmaWxsPSIjQ0RBRkZBIiBzdHJva2U9IiMyQjFFQkMiIHN0cm9rZS13aWR0aD0iMC42MjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEwNS42MzMgNzEuMjM0N0w2OS44MTY0IDU0Ljk4NjdWMTJMMTA1LjYzMyA3MS4yMzQ3WiIgZmlsbD0iI0E0RkNGNSIgc3Ryb2tlPSIjMkIxRUJDIiBzdHJva2Utd2lkdGg9IjAuNjI1IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMDUuNjMzIDcxLjIzNjJMNjkuODE2NCA1NC45ODgzVjkyLjMzOThMMTA1LjYzMyA3MS4yMzYyWiIgZmlsbD0iI0NEQUZGQSIgc3Ryb2tlPSIjMkIxRUJDIiBzdHJva2Utd2lkdGg9IjAuNjI1IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2RfMTgzN18zNTczKSI+CjxyZWN0IHg9IjkxIiB5PSI4OSIgd2lkdGg9Ijc1LjEyIiBoZWlnaHQ9Ijc1LjEyIiByeD0iMzcuNTYiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMzMuMDU5IDEzNS44ODRDMTM1LjQyMiAxMzMuNzQ2IDEzNi42IDEzMS4wMTggMTM2LjYgMTI3LjcwNkMxMzYuNiAxMjQuODU0IDEzNS42OCAxMjIuNDA1IDEzMy44NDYgMTIwLjM2MUMxMzEuNzMyIDExNy45NzQgMTI5LjAyNiAxMTYuNzg1IDEyNS43MzQgMTE2Ljc4NUMxMjIuOTAyIDExNi43ODUgMTIwLjQ2IDExNy43MTggMTE4LjQwOSAxMTkuNTc2QzExNi4wNDUgMTIxLjcxMyAxMTQuODY3IDEyNC40MjYgMTE0Ljg2NyAxMjcuNzA2QzExNC44NjcgMTMwLjU1OSAxMTUuNzg4IDEzMy4wMjMgMTE3LjYyMSAxMzUuMDk5QzExOS43NjYgMTM3LjQ4NSAxMjIuNDczIDEzOC42NzQgMTI1LjczNCAxMzguNjc0QzEyOC41OTcgMTM4LjY3NCAxMzEuMDM4IDEzNy43NDkgMTMzLjA1OSAxMzUuODg0Wk0xMTkuNTc5IDEyNy43MDZDMTE5LjU3OSAxMjUuODQ5IDEyMC4wNzggMTI0LjMxIDEyMS4wNjkgMTIzLjEwNUMxMjIuMjE2IDEyMS42ODIgMTIzLjc3NiAxMjAuOTY3IDEyNS43MzQgMTIwLjk2N0MxMjcuNDQyIDEyMC45NjcgMTI4Ljg2MiAxMjEuNTI3IDEyOS45NzcgMTIyLjYzOEMxMzEuMjggMTIzLjg4MiAxMzEuOTM1IDEyNS41NjkgMTMxLjkzNSAxMjcuNzA2QzEzMS45MzUgMTI5LjU2NCAxMzEuNDIgMTMxLjExMSAxMzAuMzk4IDEzMi4zNTVDMTI5LjI0NCAxMzMuNzQ2IDEyNy42OTIgMTM0LjQ0NiAxMjUuNzM0IDEzNC40NDZDMTI0LjA1NiAxMzQuNDQ2IDEyMi42MzcgMTMzLjkwMiAxMjEuNDkgMTMyLjgyMUMxMjAuMjE5IDEzMS41NDYgMTE5LjU3OSAxMjkuODQ0IDExOS41NzkgMTI3LjcwNloiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0xNTAuOTY4IDExNi43ODVDMTQ4LjE0NCAxMTYuNzg1IDE0NS43MDIgMTE3LjcxOCAxNDMuNjUxIDExOS41NzZDMTQxLjI4NyAxMjEuNzEzIDE0MC4xMDIgMTI0LjQyNiAxNDAuMTAyIDEyNy43MDZDMTQwLjEwMiAxMzAuNTU5IDE0MS4wMjIgMTMzLjAyMyAxNDIuODU1IDEzNS4wOTlDMTQ1IDEzNy40ODUgMTQ3LjcwNyAxMzguNjc0IDE1MC45NjggMTM4LjY3NEMxNTMuODMxIDEzOC42NzQgMTU2LjI3MiAxMzcuNzQyIDE1OC4yOTMgMTM1Ljg4NEMxNjAuNjU2IDEzMy43NDYgMTYxLjgzNCAxMzEuMDI2IDE2MS44MzQgMTI3LjcwNkMxNjEuODM0IDEyNC44NTQgMTYwLjkyMiAxMjIuNDA1IDE1OS4wODggMTIwLjM2MUMxNTYuOTc1IDExNy45NzQgMTU0LjI2OCAxMTYuNzg1IDE1MC45NjggMTE2Ljc4NVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0xMDUuMzM1IDExMi44ODNDMTA1Ljg0MiAxMTMuMjg3IDEwNi41NzUgMTEzLjIxIDEwNi45ODEgMTEyLjcwNEMxMTEuNTgzIDEwNi45OTkgMTE4LjQyNCAxMDMuNzI2IDEyNS43NTcgMTAzLjcyNkMxMzMuNTI3IDEwMy43MjYgMTQwLjg1OSAxMDcuNDk2IDE0NS4zNzYgMTEzLjgxNkMxNDUuNjAyIDExNC4xMzUgMTQ1Ljk2MSAxMTQuMzA2IDE0Ni4zMjcgMTE0LjMwNkMxNDYuNTYyIDExNC4zMDYgMTQ2LjgwMyAxMTQuMjM2IDE0Ny4wMDYgMTE0LjA4OEMxNDcuNTI5IDExMy43MTUgMTQ3LjY1NCAxMTIuOTg0IDE0Ny4yNzkgMTEyLjQ2M0MxNDIuMzM0IDEwNS41MyAxMzQuMjgzIDEwMS4zOTUgMTI1Ljc1NyAxMDEuMzk1QzExNy43MTUgMTAxLjM5NSAxMTAuMjAyIDEwNC45ODYgMTA1LjE1NSAxMTEuMjQzQzEwNC43NSAxMTEuNzQ4IDEwNC44MzUgMTEyLjQ3OSAxMDUuMzM1IDExMi44ODNaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTQ3LjAzNiAxNDEuMjg1QzE0Ni41MDYgMTQwLjkxMiAxNDUuNzgxIDE0MS4wMzcgMTQ1LjQwNiAxNDEuNTY1QzE0MC44ODkgMTQ3LjkgMTMzLjU0OSAxNTEuNjg2IDEyNS43NTYgMTUxLjY4NkMxMjUuMTA5IDE1MS42ODYgMTI0LjU4NiAxNTIuMjA3IDEyNC41ODYgMTUyLjg1MkMxMjQuNTg2IDE1My40OTcgMTI1LjEwOSAxNTQuMDE4IDEyNS43NTYgMTU0LjAxOEMxMzQuMzA2IDE1NC4wMTggMTQyLjM1NiAxNDkuODY3IDE0Ny4zMDkgMTQyLjkxQzE0Ny42ODQgMTQyLjM4MSAxNDcuNTU5IDE0MS42NTggMTQ3LjAzNiAxNDEuMjg1WiIgZmlsbD0iYmxhY2siLz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kXzE4MzdfMzU3MyIgeD0iODciIHk9Ijg5IiB3aWR0aD0iODMuMTIxMSIgaGVpZ2h0PSI4My4xMjExIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjQiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMiIvPgo8ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIG9wZXJhdG9yPSJvdXQiLz4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMC41NjExMTEgMCAwIDAgMCAwLjU2MTExMSAwIDAgMCAwIDAuNTYxMTExIDAgMCAwIDAuMjUgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xODM3XzM1NzMiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMTgzN18zNTczIiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8L2RlZnM+Cjwvc3ZnPgo=`
    readonly supportedTransactionVersions = new Set([
        "legacy" as TransactionVersion,
        0 as TransactionVersion,])

    private _connecting: boolean
    private _wallet: MoonGateEmbed | null
    private _position: string = "top-right"
    private _authMode: string = "Ethereum"
    private _logoDataUri: string = "Default"
    private _disconnected: boolean
    private _publicKey: PublicKey | null

    private _readyState: WalletReadyState =
        typeof window === "undefined" || typeof document === "undefined"
            ? WalletReadyState.Unsupported
            : WalletReadyState.Installed

    constructor(config?: { position?: string, authMode?: string, logoDataUri?: string }) {
        super()
        this._connecting = false
        this._wallet = null
        this._disconnected = false
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
                this.icon = `data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDI2OCAyNjgiIHdpZHRoPSIyNjgiIGhlaWdodD0iMjY4Ij4KCTx0aXRsZT5nb29nbGUtaWNvbi1sb2dvLXN2Z3JlcG8tY29tLXN2ZzwvdGl0bGU+Cgk8c3R5bGU+CgkJLnMwIHsgZmlsbDogI2ZmZmZmZiB9IAoJCS5zMSB7IGZpbGw6ICM0Mjg1ZjQgfSAKCQkuczIgeyBmaWxsOiAjMzRhODUzIH0gCgkJLnMzIHsgZmlsbDogI2ZiYmMwNSB9IAoJCS5zNCB7IGZpbGw6ICNlYjQzMzUgfSAKCQkuczUgeyBmaWxsOiAjMDAwMDAwIH0gCgk8L3N0eWxlPgoJPHBhdGggaWQ9IlNoYXBlIDIiIGNsYXNzPSJzMCIgZD0ibTAgMzVjMC0xOS4zIDE1LjctMzUgMzUtMzVoMTk4YzE5LjMgMCAzNSAxNS43IDM1IDM1djE5OGMwIDE5LjMtMTUuNyAzNS0zNSAzNWgtMTk4Yy0xOS4zIDAtMzUtMTUuNy0zNS0zNXoiLz4KCTxwYXRoIGlkPSJMYXllciIgY2xhc3M9InMxIiBkPSJtMjM2IDEzNi40YzAtOC42LTAuNy0xNC44LTIuMi0yMS4zaC05Ny43djM4LjZoNTcuM2MtMS4xIDkuNi03LjQgMjQuMS0yMS4zIDMzLjhsLTAuMiAxLjMgMzAuOSAyMy45IDIuMiAwLjJjMTkuNi0xOC4xIDMxLTQ0LjggMzEtNzYuNXoiLz4KCTxwYXRoIGlkPSJMYXllciIgY2xhc3M9InMyIiBkPSJtMTM2LjEgMjM4LjFjMjguMSAwIDUxLjctOS4yIDY4LjktMjUuMmwtMzIuOS0yNS40Yy04LjcgNi4xLTIwLjUgMTAuNC0zNiAxMC40LTI3LjYgMC01MC45LTE4LjItNTkuMi00My4zbC0xLjMgMC4yLTMyLjEgMjQuOC0wLjQgMS4yYzE3LjEgMzQgNTIuMyA1Ny4zIDkzIDU3LjN6Ii8+Cgk8cGF0aCBpZD0iTGF5ZXIiIGNsYXNzPSJzMyIgZD0ibTc2LjkgMTU0LjZjLTIuMi02LjQtMy41LTEzLjQtMy41LTIwLjUgMC03LjIgMS4zLTE0LjEgMy4zLTIwLjZ2LTEuNGwtMzIuNS0yNS4zLTEuMSAwLjZjLTcuMSAxNC4xLTExLjEgMjkuOS0xMS4xIDQ2LjcgMCAxNi43IDQgMzIuNiAxMS4xIDQ2Ljd6Ii8+Cgk8cGF0aCBpZD0iTGF5ZXIiIGNsYXNzPSJzNCIgZD0ibTEzNi4xIDcwLjJjMTkuNSAwIDMyLjcgOC41IDQwLjIgMTUuNWwyOS40LTI4LjZjLTE4LjEtMTYuOC00MS41LTI3LjEtNjkuNi0yNy4xLTQwLjcgMC03NS45IDIzLjQtOTMgNTcuNGwzMy42IDI2LjFjOC41LTI1LjEgMzEuOC00My4zIDU5LjQtNDMuM3oiLz4KCTxnIGlkPSJGb2xkZXIgMSI+CgkJPHBhdGggaWQ9IlNoYXBlIDEiIGNsYXNzPSJzNSIgZD0ibTIxMi43IDI2Ny44Yy0zMC45IDAtNTUuOS0yNC45LTU1LjktNTUuOCAwLTMwLjkgMjUtNTUuOCA1NS45LTU1LjggMzAuOCAwIDU1LjggMjQuOSA1NS44IDU1LjggMCAzMC45LTI1IDU1LjgtNTUuOCA1NS44eiIvPgoJCTxwYXRoIGlkPSJQYXRoIDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xhc3M9InMwIiBkPSJtMjEyLjIgMTcxLjNjMi4yIDAuMSA1LjMgMC40IDYuOSAwLjggMS41IDAuMyA0LjQgMS4xIDYuMiAxLjggMS45IDAuNyA0LjkgMi4xIDYuNiAzLjIgMS43IDEgNC4zIDIuOSA1LjcgNC4xIDEuNCAxLjIgMy40IDMuMyA0LjUgNC41IDEuMSAxLjMgMi4yIDIuOCAyLjQgMy40IDAuNCAwLjggMC4zIDEuMi0wLjQgMS44LTAuNSAwLjYtMS4xIDAuOC0xLjggMC43LTAuNS0wLjItMS40LTAuOS0yLTEuOC0wLjYtMC44LTIuNS0yLjgtNC4zLTQuNS0xLjktMS44LTQuNi0zLjktNi42LTUtMS45LTEuMS01LjEtMi41LTcuMi0zLjEtMi0wLjctNS41LTEuNS03LjctMS43LTMtMC40LTQuOC0wLjMtOCAwLjEtMi4zIDAuMy01LjYgMS4xLTcuOCAxLjgtMi4xIDAuOC01LjMgMi4yLTcuMSAzLjMtMS45IDEuMi00LjYgMy4zLTYuNyA1LjUtMi40IDIuNC0zLjggMy41LTQuNSAzLjUtMC41IDAtMS4yLTAuMi0xLjUtMC41LTAuMi0wLjMtMC41LTAuOS0wLjUtMS4zIDAtMC41IDEtMS45IDIuMi0zLjIgMS4xLTEuNCAzLjUtMy41IDUuMS00LjggMS43LTEuNCA0LjctMy4yIDYuNi00LjIgMS45LTEgNS4xLTIuMiA3LjEtMi44IDEuOS0wLjYgNC43LTEuMiA2LjEtMS40IDEuNS0wLjIgNC41LTAuMyA2LjctMC4yem0zNy40IDIzLjdjMC42IDAgMi4xIDAuMSAzLjQgMC40IDEuNCAwLjIgMy40IDAuOSA0LjUgMS40IDEuMSAwLjUgMyAxLjkgNC4yIDMuMSAxLjIgMS4yIDIuNyAzLjIgMy4zIDQuNCAwLjcgMS4zIDEuNCAzLjcgMS42IDUuMyAwLjQgMi4yIDAuNCAzLjYgMCA1LjYtMC4yIDEuNC0wLjkgMy41LTEuNCA0LjctMC42IDEuMi0yIDMuMS0zLjIgNC40LTEuMyAxLjQtMyAyLjctNC43IDMuNS0yLjUgMS4yLTIuOCAxLjMtNy41IDEuMy00LjQgMC01LTAuMS03LjEtMS4xLTEuMi0wLjYtMy4yLTEuOS00LjQtMy0xLjUtMS40LTIuNi0yLjktMy42LTUtMS40LTIuOS0xLjUtMy4xLTEuNS03LjkgMC00LjUgMC4xLTUgMS4yLTcuMiAwLjctMS41IDIuMS0zLjQgMy40LTQuNyAxLjMtMS4zIDMuMS0yLjcgNC4xLTMuMiAxLTAuNSAyLjktMS4yIDQuMy0xLjUgMS4zLTAuMyAyLjgtMC41IDMuNC0wLjV6bS03IDM3LjVjMC4yIDAgMC43IDAuMyAxLjIgMC42IDAuNSAwLjQgMSAxLjEgMSAxLjYgMCAwLjUtMSAyLjEtMi40IDMuNy0xLjMgMS42LTMuNiAzLjktNS4xIDUuMi0xLjYgMS4zLTQgMy4xLTUuNSAzLjktMS40IDAuOS00LjEgMi4yLTUuOCAyLjktMS44IDAuNy00LjkgMS42LTYuOSAyLTIgMC40LTUgMC44LTYuNiAwLjgtMi42IDAtMy0wLjEtMy40LTAuOS0wLjMtMC43LTAuMy0xLjIgMC0xLjkgMC4zLTAuNSAwLjktMSAxLjQtMS4xIDAuNS0wLjEgMi4zLTAuMiAzLjktMC4zIDEuNy0wLjIgNC43LTAuNyA2LjctMS4zIDItMC42IDUuMS0xLjggNi45LTIuOCAxLjgtMC45IDQuNC0yLjYgNS44LTMuNyAxLjQtMS4xIDMuNS0zLjEgNC43LTQuNCAxLjEtMS4zIDIuNC0yLjggMi45LTMuMyAwLjUtMC41IDEtMSAxLjItMXptLTMyLjItMzcuNWMwLjUgMCAyLjEgMC4xIDMuNCAwLjQgMS40IDAuMiAzLjQgMC44IDQuNiAxLjQgMS4xIDAuNSAzLjEgMS45IDQuMyAzLjEgMS4xIDEuMiAyLjUgMi45IDMgMy45IDAuNiAxIDEuMiAyLjggMS41IDMuOSAwLjMgMS4xIDAuNiAzLjIgMC42IDQuNiAwIDEuNS0wLjMgMy42LTAuNiA0LjctMC4zIDEuMS0wLjkgMi44LTEuNCAzLjctMC41IDEtMS44IDIuNy0zIDMuOC0xLjIgMS4yLTMuMiAyLjctNC43IDMuNC0yLjUgMS4xLTMgMS4yLTcuMyAxLjItNC40IDAtNC44LTAuMS03LjMtMS4zLTEuNy0wLjgtMy40LTIuMS00LjctMy41LTEuMi0xLjMtMi42LTMuMy0zLjItNC42LTAuNi0xLjMtMS4zLTMuNC0xLjUtNC43LTAuMy0xLjgtMC4zLTMuMyAwLTUuNSAwLjMtMS43IDEtNCAxLjYtNS4zIDAuNi0xLjIgMi4xLTMuMSAzLjItNC4yIDEuMS0xLjEgMy0yLjUgNC4xLTMgMS0wLjYgMi45LTEuMiA0LjItMS41IDEuMi0wLjMgMi42LTAuNSAzLjItMC41em0tNC45IDguOGMtMC43IDAuNi0xLjggMS43LTIuMyAyLjUtMC41IDAuOC0xLjEgMi40LTEuMyAzLjYtMC4zIDEuMi0wLjQgMy0wLjIgNCAwLjEgMSAwLjUgMi41IDAuOSAzLjMgMC4zIDAuOCAxIDEuOSAxLjYgMi42IDAuNiAwLjYgMS45IDEuNSAyLjggMS45IDAuOSAwLjQgMi41IDAuNyAzLjcgMC43IDEuMiAwIDIuOC0wLjIgMy42LTAuNiAwLjktMC4zIDIuMi0xLjIgMi45LTEuOSAwLjgtMC43IDEuNy0yIDIuMS0yLjkgMC41LTEuMSAwLjgtMi42IDAuOC00LjcgMC0yLjUtMC4yLTMuNC0xLjEtNS4yLTAuNy0xLjQtMS43LTIuNy0yLjctMy40LTAuOS0wLjYtMi4zLTEuMi0zLjEtMS4zLTAuOC0wLjEtMS43LTAuMy0yLTAuNC0wLjMgMC0xLjQgMC4xLTIuNCAwLjMtMSAwLjItMi41IDAuOC0zLjMgMS41eiIvPgoJPC9nPgo8L3N2Zz4=`
            }

        }

        if (config?.logoDataUri) {
            this._logoDataUri = config.logoDataUri
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
    async _handleMessage(event: MessageEvent) {
        if (event.data && event.data.type === "moongate") {
            const { command } = event.data;
            if (command === "disconnect") {

                this._disconnected = true
                this._connecting = false
                await this.disconnect();
            }
        }
    }
    async connect(): Promise<void> {
        if (this.connected || this.connecting) return
        if (this._wallet) {
            throw new WalletConnectionError("Already connected")
        }
        /* throw new WalletConnectionError("hello world") */

        try {
            this._wallet = new MoonGateEmbed({ authModeAdapter: this._authMode, logoDataURI: this._logoDataUri })
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
        if (this._wallet) {
            try {
                await this._wallet.disconnect();

                this._wallet = null;
                this._publicKey = null;
                this._connecting = false;
                this.emit("disconnect");
                console.log("MoonGate wallet disconnected.");

            } catch (error) {
                console.error("Error encountered during disconnection:", error);
                throw new WalletDisconnectionError((error as Error).message);
            } finally {
                this._disconnected = false; // Reset the flag after disconnection attempt
                this._connecting = false; // Ensure connecting is also reset
            }
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


    async signIn(input?: CustomSolanaSignInInput): Promise<SolanaSignInOutput> {
        // console.log("triggering sign in!");
        /* try {
            if (!this.connected) {
                const output = await this._connect({
                    siwsInput: input,
                });
                const siwsOutput = output?.siwsOutput;
                if (input) {
                    if (!siwsOutput) {
                        throw new Error("No Solana Sign In Output");
                    }
                    return siwsOutput;
                }
            }

            const wallet = this._wallet;
            if (!wallet || !this.connected) throw new WalletNotConnectedError();

            const publicKey = this._publicKey;
            if (!publicKey) throw new WalletNotConnectedError("no public key found");

            try {
                const siwsInput =
                    typeof input === "function"
                        ? input()
                        : input
                            ? Promise.resolve(input)
                            : undefined;
                const siwsOutput = null;

                return siwsOutput;
            } catch (error: any) {
                throw new WalletSignInError(error?.message, error);
            }
        } catch (error: any) {
            this.emit("error", error);
            throw error;
        }
    } */
        // return an empty promise of SolanaSignInOutput
        return new Promise((resolve, reject) => {
            resolve({} as SolanaSignInOutput);
        });
    }
}
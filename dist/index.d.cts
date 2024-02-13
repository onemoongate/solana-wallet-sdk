import { Config, ConnectReturnType, SendTransactionParameters } from '@wagmi/core';
import { SignableMessage } from 'viem';

declare class MoonGateEmbed {
    private iframe;
    private iframeOrigin;
    private _ready;
    private readonly listeners;
    private minimizeButton;
    private readonly commandQueue;
    walletConnectSession: any;
    connectedWalletAddress: string | null;
    connectedChainId: number | null;
    wagmiConfig: Config;
    constructor();
    private isMobileDevice;
    private createIframe;
    moveModal(corner?: string): void;
    private setPosition;
    private createMinimizeButton;
    private toggleIframe;
    private handleMessage;
    private processQueue;
    connectWalletConnect(): Promise<void>;
    connectCoinbaseWallet(): Promise<void>;
    connectInjected(target?: string): Promise<void>;
    autoConnectOnLoad(): Promise<void>;
    beforeConnecting(): Promise<{
        accounts: readonly `0x${string}`[];
        chainId: number;
    } | null>;
    onConnected(res: ConnectReturnType<Config>): void;
    signMessage(key: string, message: SignableMessage): Promise<void>;
    switchNetwork(chainId: number): Promise<void>;
    sendTransaction(key: string, transaction: SendTransactionParameters): Promise<void>;
    writeContract(key: string, transaction: any): Promise<void>;
    disconnect(): Promise<void>;
    sendCommand<T = unknown>(command: string, data: any): Promise<T>;
}

export { MoonGateEmbed };

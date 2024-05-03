// @ts-ignore
import { walletConnect, injected, coinbaseWallet } from "@wagmi/connectors";
import {
  Config,
  ConnectReturnType,
  SendTransactionParameters,
  connect,
  createConfig,
  disconnect,
  http,
  reconnect,
  sendTransaction,
  signMessage,
  switchChain,
  writeContract,
} from "@wagmi/core";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  avalanche,
  base,
  zora,
  zkSync,
  opBNB,
  linea,
} from "@wagmi/core/chains";
// import { ThemeCtrlState } from "@walletconnect/ethereum-provider/dist/types/types";
// import { WalletConnectModal } from "@walletconnect/modal";
// import SignClient from "@walletconnect/sign-client";
import { SignableMessage, createClient } from "viem";

const logoDataURI =
  "data:image/png;base64,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";

const iframeUrl = "https://v2.moongate.one";

export class MoonGateEmbed {
  private iframe: HTMLIFrameElement;
  private iframeOrigin: string;
  private _ready: boolean = false;
  private readonly listeners: { [key: string]: (data: any) => void } = {};
  private minimizeButton: HTMLImageElement;
  private readonly commandQueue: {
    command: string;
    data: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }[] = [];
  // signClient: SignClient | null = null;
  // walletConnectModal: WalletConnectModal;
  walletConnectSession: any;
  connectedWalletAddress: string | null = null;
  connectedChainId: number | null = null;
  // connectedProvider: any = null;
  wagmiConfig: Config;

  constructor() {
    window.addEventListener("message", this.handleMessage.bind(this));
    this.iframeOrigin = new URL(iframeUrl).origin;
    this.iframe = this.createIframe();
    this.minimizeButton = this.createMinimizeButton();

    // const walletConnectModal = new WalletConnectModal({
    //   projectId: "927848f28c257a3e24dacce25127d8d5",
    // });

    // this.walletConnectModal = walletConnectModal;

    const wagmiConfig = createConfig({
      chains: [
        mainnet,
        polygon,
        optimism,
        arbitrum,
        avalanche,
        base,
        zora,
        zkSync,
        opBNB,
        linea,
      ],
      client({ chain }) {
        return createClient({
          chain,
          transport: http(),
        });
      },
      connectors: [
        injected({
          shimDisconnect: true,
        }),
        walletConnect({
          projectId: "927848f28c257a3e24dacce25127d8d5",
          metadata: {
            name: "Moongate",
            description: "Moongate Wallet",
            url: "https://moongate.one",
            icons: [logoDataURI],
          },
          qrModalOptions: {
            themeVariables: {
              "--wcm-z-index": "2147483647",
            },
          },
        }),
        coinbaseWallet({
          appName: "Moongate",
        }),
      ],
    });

    this.wagmiConfig = wagmiConfig;
  }

  // async initSignClient() {
  //   const signClient = await SignClient.init({
  //     projectId: "927848f28c257a3e24dacce25127d8d5",
  //   });

  //   this.signClient = signClient;
  //   return signClient;
  // }

  private isMobileDevice(): boolean {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  private createIframe(): HTMLIFrameElement {
    const iframe = document.createElement("iframe");
    iframe.src = iframeUrl;
    iframe.sandbox;
    iframe.style.position = "fixed";
    iframe.style.top = "50%";
    iframe.style.left = "50%";
    iframe.style.transform = "translate(-50%, -50%)";
    iframe.style.width = "400px";
    iframe.style.height = "600px";
    iframe.style.zIndex = "2147483647";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "transparent";
    iframe.sandbox.value =
      "allow-scripts allow-same-origin allow-popups allow-modals allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation";
    iframe.allow = "clipboard-write; clipboard-read;";
    iframe.onload = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "initIframe",
          data: { origin: window.location.origin },
        },
        this.iframeOrigin
      );
    };
    if (this.isMobileDevice()) {
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.transform = "";
    }
    document.body.appendChild(iframe);

    return iframe;
  }

  public moveModal(corner: string = "top-right"): void {
    if (!this.isMobileDevice()) {
      this.iframe.style.transform = "";
      switch (corner) {
        case "top-left":
          this.setPosition(this.iframe, "10px", "auto", "10px", "auto");
          this.setPosition(this.minimizeButton, "10px", "auto", "10px", "auto");
          break;
        case "top-right":
          this.setPosition(this.iframe, "10px", "10px", "auto", "auto");
          this.setPosition(this.minimizeButton, "10px", "10px", "auto", "auto");
          break;
        case "bottom-left":
          this.setPosition(this.iframe, "auto", "auto", "10px", "10px");
          this.setPosition(this.minimizeButton, "auto", "auto", "10px", "10px");
          break;
        case "bottom-right":
          this.setPosition(this.iframe, "auto", "10px", "auto", "10px");
          this.setPosition(this.minimizeButton, "auto", "10px", "auto", "10px");
          break;
        default:
          console.error("Invalid corner specified for moveModal method");
          break;
      }
    } else {
      this.setPosition(this.minimizeButton, "auto", "auto", "10px", "10px");
    }
  }

  private setPosition(
    element: HTMLElement,
    top: string,
    right: string,
    left: string,
    bottom: string
  ): void {
    element.style.top = top;
    element.style.right = right;
    element.style.left = left;
    element.style.bottom = bottom;
  }

  private createMinimizeButton(): HTMLImageElement {
    const imgButton = document.createElement("img");
    imgButton.src = "https://i.ibb.co/NjxF2zw/Image-3.png";
    imgButton.style.position = "fixed";
    imgButton.style.display = "none";
    imgButton.style.width = "50px";
    imgButton.style.height = "50px";
    imgButton.style.zIndex = "2147483647";
    imgButton.style.cursor = "pointer";
    imgButton.addEventListener("click", this.toggleIframe.bind(this));
    document.body.appendChild(imgButton);
    return imgButton;
  }

  private toggleIframe(): void {
    if (this.iframe.style.display === "none") {
      this.iframe.style.display = "block";
      this.minimizeButton.style.display = "none";
    } else {
      this.iframe.style.display = "none";
      this.minimizeButton.style.display = "block";
    }
  }

  private handleMessage(event: MessageEvent): void {
    if (event.origin !== this.iframeOrigin) return;
    const { type, data } = event.data;

    if (type === "minimizeIframe") {
      this.toggleIframe();
      return;
    }

    if (type === "disconnect") {
      this.disconnect();
      return;
    }

    if (type === "connectWalletConnect") {
      this.connectWalletConnect();
      return;
    }

    if (type === "connectInjected") {
      this.connectInjected(data.target);
      return;
    }

    if (type === "connectCoinbase") {
      this.connectCoinbaseWallet();
      return;
    }

    if (type === "switchNetwork") {
      this.switchNetwork(data.chainId);
      return;
    }

    // if (type == "beforeConnecting") {
    //   console.log("Before connecting");
    //   this.beforeConnecting();

    //   return;
    // }

    if (type === "autoConnectOnLoad") {
      console.log("Auto connect on load");
      this.autoConnectOnLoad();
      return;
    }

    if (type === "signMessage") {
      console.log("Signing message", data.key, data.message);
      this.signMessage(data.key, data.message);
      return;
    }

    if (type === "sendTransaction") {
      console.log("Sending transaction", data.key, data.transaction);
      this.sendTransaction(data.key, data.transaction);
      return;
    }

    if (type === "writeContract") {
      console.log("Writing contract", data.key, data.transaction);
      this.writeContract(data.key, data.transaction);
      return;
    }

    if (type === "iframeReady") {
      this._ready = true;
      this.processQueue();
      return;
    }

    if (this.listeners[type]) {
      console.log("Received message", type, data);
      this.listeners[type](data);
    }
  }

  private processQueue(): void {
    while (this.commandQueue.length && this._ready) {
      const { command, data, resolve } = this.commandQueue.shift()!;
      const responseType = `${command}Response`;

      if (!this.listeners[responseType]) {
        this.listeners[responseType] = resolve;
        this.iframe.contentWindow?.postMessage(
          { type: command, data },
          this.iframeOrigin
        );
      }
    }
  }

  async connectWalletConnect(): Promise<void> {
    try {
      await this.beforeConnecting();

      const res = await connect(this.wagmiConfig, {
        connector: walletConnect({
          projectId: "927848f28c257a3e24dacce25127d8d5",
          metadata: {
            name: "Moongate",
            description: "Moongate Wallet",
            url: "https://moongate.one",
            icons: [logoDataURI],
          },
          qrModalOptions: {
            themeVariables: {
              "--wcm-z-index": "2147483647",
            },
          },
        }),
      });

      this.onConnected(res);
    } catch (e) {
      console.log(e);
    }
  }

  async connectCoinbaseWallet(): Promise<void> {
    try {
      await this.beforeConnecting();

      const res = await connect(this.wagmiConfig, {
        connector: coinbaseWallet({
          appName: "Moongate",
        }),
      });

      this.onConnected(res);
    } catch (e) {
      console.log(e);
    }
  }

  async connectInjected(target?: string): Promise<void> {
    try {
      const res = await this.beforeConnecting();

      if (res) {
        this.onConnected(res as ConnectReturnType<Config>);
      } else {
        const res = await connect(this.wagmiConfig, {
          connector: injected({
            target: (target ?? "metaMask") as any,
          }),
        });

        localStorage.setItem("wagmi.injected.shimDisconnect", "true");

        this.onConnected(res);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async autoConnectOnLoad(): Promise<void> {
    const res = await this.beforeConnecting();

    if (res) {
      this.onConnected(res as ConnectReturnType<Config>);
    }
  }

  async beforeConnecting() {
    const reconnectRes = await reconnect(this.wagmiConfig, {
      connectors: [
        injected(),
        walletConnect({
          projectId: "927848f28c257a3e24dacce25127d8d5",
          metadata: {
            name: "Moongate",
            description: "Moongate Wallet",
            url: "https://moongate.one",
            icons: [logoDataURI],
          },
          qrModalOptions: {
            themeVariables: {
              "--wcm-z-index": "2147483647",
            },
          },
        }),
        coinbaseWallet({
          appName: "Moongate",
        }),
      ],
    });

    let res = null;

    if (reconnectRes.length) {
      res = await reconnectRes[0].connector.connect();
    }

    return res;
  }

  onConnected(res: ConnectReturnType<Config>) {
    this.connectedWalletAddress = res.accounts[0];
    this.connectedChainId = res.chainId;

    console.log("Connected to wallet", res);

    this.iframe.contentWindow?.postMessage(
      {
        type: "connected",
        data: {
          chainId: res.chainId,
          address: res.accounts[0],
          host: window.location.host,
          origin: window.location.origin,
        },
      },
      this.iframeOrigin
    );
  }

  async signMessage(key: string, message: SignableMessage) {
    console.log("Signing message", key, message);

    try {
      const signature = await signMessage(this.wagmiConfig, {
        message: message,
      });

      this.iframe.contentWindow?.postMessage(
        {
          type: "signedMessage",
          data: {
            key,
            message,
            signature,
          },
        },
        this.iframeOrigin
      );
    } catch (e) {
      console.error("Failed to sign message", e);
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    console.log(this.wagmiConfig, chainId);

    try {
      await switchChain(this.wagmiConfig, {
        chainId: Number(chainId),
      });

      this.iframe.contentWindow?.postMessage(
        {
          type: "switchedNetwork",
          data: {
            chainId: chainId,
          },
        },
        this.iframeOrigin
      );
    } catch (e) {
      console.error("Failed to switch network, retrying...", e);

      setTimeout(async () => {
        try {
          await switchChain(this.wagmiConfig, {
            chainId: Number(chainId),
          });

          this.iframe.contentWindow?.postMessage(
            {
              type: "switchedNetwork",
              data: {
                chainId: chainId,
              },
            },
            this.iframeOrigin
          );
        } catch (e) {
          console.error("Failed to switch network again", e);
        }
      }, 500);
    }
  }

  async sendTransaction(
    key: string,
    transaction: SendTransactionParameters
  ): Promise<void> {
    console.log("Sending transaction");

    try {
      const hash = await sendTransaction(this.wagmiConfig, transaction);

      this.iframe.contentWindow?.postMessage(
        {
          type: "sentTransaction",
          data: {
            transaction,
            hash,
            key,
          },
        },
        this.iframeOrigin
      );
    } catch (e) {
      console.error("Failed to send transaction", e);
    }
  }

  async writeContract(key: string, transaction: any) {
    console.log("Sending transaction");

    try {
      const hash = await writeContract(this.wagmiConfig, transaction);

      this.iframe.contentWindow?.postMessage(
        {
          type: "sentTransaction",
          data: {
            transaction,
            hash,
            key,
          },
        },
        this.iframeOrigin
      );
    } catch (e) {
      console.error("Failed to send transaction", e);
    }
  }

  async disconnect(): Promise<void> {
    console.log("Starting the disconnection process...");
    disconnect(this.wagmiConfig);
    this.connectedWalletAddress = null;
    this.connectedChainId = null;
    this.iframe.contentWindow?.postMessage(
      {
        type: "disconnected",
      },
      this.iframeOrigin
    );
    this.iframe.remove();
    if (this.minimizeButton) {
      this.minimizeButton.remove();
    }
    this._ready = false;
  }

  async sendCommand<T = unknown>(command: string, data: any): Promise<T> {
    if (this.iframe.style.display === "none") {
      this.toggleIframe();
    }
    const responseType = `${command}Response`;
    const origin = window.location.origin;
    return new Promise((resolve, reject) => {
      if (!this._ready) {
        this.commandQueue.push({ command, data, resolve, reject });
        setTimeout(() => {
          console.log("didn't respond in time");
          reject(new Error("Iframe did not respond in time"));
        }, 120000);
      } else {
        if (!this.listeners[responseType]) {
          this.listeners[responseType] = (responseData: any) => {
            resolve(responseData as T);
            delete this.listeners[responseType];
          };
        }
        this.iframe.contentWindow?.postMessage(
          { type: command, data, origin },
          this.iframeOrigin
        );
      }
    });
  }
}

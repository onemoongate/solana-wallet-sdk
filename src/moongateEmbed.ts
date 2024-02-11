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
    this.iframeOrigin = new URL("http://anish.local:3000").origin;
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
    iframe.src = "http://anish.local:3000";
    iframe.sandbox;
    iframe.style.position = "fixed";
    iframe.style.top = "50%";
    iframe.style.left = "50%";
    iframe.style.transform = "translate(-50%, -50%)";
    iframe.style.width = "500px";
    iframe.style.height = "600px";
    iframe.style.zIndex = "5";
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
    imgButton.style.zIndex = "1000000";
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
  }

  async switchNetwork(chainId: number): Promise<void> {
    console.log(this.wagmiConfig, chainId);
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
  }

  async sendTransaction(
    key: string,
    transaction: SendTransactionParameters
  ): Promise<void> {
    console.log("Sending transaction");

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
  }

  async writeContract(key: string, transaction: any) {
    console.log("Sending transaction");

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

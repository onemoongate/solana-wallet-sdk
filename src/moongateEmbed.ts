// @ts-ignore
import { ThemeCtrlState } from "@walletconnect/ethereum-provider/dist/types/types";
import { WalletConnectModal } from "@walletconnect/modal";
import SignClient from "@walletconnect/sign-client";

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
  signClient: SignClient | null = null;
  walletConnectModal: WalletConnectModal;
  walletConnectSession: any;
  connectedWalletAddress: string | null = null;
  connectedProvider: any = null;

  constructor() {
    window.addEventListener("message", this.handleMessage.bind(this));
    this.iframeOrigin = new URL("http://anish.local:3000").origin;
    this.iframe = this.createIframe();
    this.minimizeButton = this.createMinimizeButton();

    // @ts-ignore
    const walletConnectModal = new WalletConnectModal({
      projectId: "927848f28c257a3e24dacce25127d8d5",
    });

    this.walletConnectModal = walletConnectModal;
  }

  async initSignClient() {
    const signClient = await SignClient.init({
      projectId: "927848f28c257a3e24dacce25127d8d5",
    });

    this.signClient = signClient;
    return signClient;
  }

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
      "allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation";
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
      this.connectInjected();
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
    if (!this.signClient) {
      console.log("Initializing sign client...");
      this.signClient = await this.initSignClient();
      console.log("Sign client initialized.");
    }

    const pairings = this.signClient.core.pairing.getPairings();

    console.log("Pairings:", pairings);

    const { uri, approval } = await this.signClient.connect({
      // Optionally: pass a known prior pairing (e.g. from `signClient.core.pairing.getPairings()`) to skip the `uri` step.
      // pairingTopic: pairings[0]?.topic,
      // Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
      requiredNamespaces: {
        eip155: {
          methods: [
            // "eth_requestAccounts",
            "eth_sendTransaction",
            "eth_signTransaction",
            "eth_sign",
            "personal_sign",
            "eth_signTypedData",
          ],
          chains: ["eip155:1"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    });

    console.log("URI:", uri);

    if (uri) {
      this.walletConnectModal.openModal({
        uri,
        CSSStyleSheet: {
          "z-index": "100000",
        },
      });
      console.log("Waiting for session approval...");
      // Await session approval from the wallet.
      const session = await approval();
      console.log("Session approved:", session);
      // Handle the returned session (e.g. update UI to "connected" state).
      // * You will need to create this function *
      // onSessionConnect(session);
      this.walletConnectSession = session;
      // Close the QRCode modal in case it was open.
      this.walletConnectModal.closeModal();

      // const walletAddress = await this.signClient.request({
      //   topic: session.topic,
      //   chainId: "eip155:1",
      //   request: {
      //     method: "eth_requestAccounts",
      //     params: [],
      //   },
      // });

      // console.log("Wallet address:", walletAddress);
      console.log(session.namespaces.eip155.accounts);
      const walletAddress = session.namespaces.eip155.accounts[0].slice(9);

      console.log("Wallet address:", walletAddress);

      // const signResult = await this.signClient.request({
      //   topic: session.topic,
      //   chainId: "eip155:1",
      //   request: {
      //     method: "personal_sign",
      //     params: ["hello world", walletAddress],
      //   },
      // });

      // console.log("Sign result:", signResult);
    }
  }

  async connectInjected(): Promise<void> {
    const provider = (window as any).ethereum;

    if (!provider) {
      throw new Error("No injected provider found");
    }
  }

  async disconnect(): Promise<void> {
    console.log("Starting the disconnection process...");
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

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
  bsc,
} from "@wagmi/core/chains";
import { SignableMessage, createClient } from "viem";

const iframeUrl = "http://v2.moongate.one";

export class MoonGateEmbed {
  private iframe: HTMLIFrameElement;
  private iframeOrigin: string;
  private _ready: boolean = false;
  private authMode: string = "Ethereum";
  private logoDataURI: string = "Default";
  private buttonLogoURI: string = "https://i.ibb.co/NjxF2zw/Image-3.png";
  private onrampMode: string = "Standard";
  private readonly listeners: { [key: string]: (data: any) => void } = {};
  private minimizeButton: HTMLImageElement;
  private readonly commandQueue: {
    command: string;
    data: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }[] = [];
  walletConnectSession: any;
  connectedWalletAddress: string | null = null;
  connectedChainId: number | null = null;
  wagmiConfig: Config;

  constructor({ authModeAdapter = "Ethereum", logoDataURI = "Default", buttonLogoURI = "https://i.ibb.co/NjxF2zw/Image-3.png" }) {
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener("message", this.handleMessage);
    this.iframeOrigin = new URL(iframeUrl).origin;
    this.iframe = this.createIframe();
    this.buttonLogoURI = buttonLogoURI;
    this.minimizeButton = this.createMinimizeButton();
    this.authMode = authModeAdapter;
    this.logoDataURI = logoDataURI;

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
        bsc,
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
    iframe.style.overflow = "hidden";
    iframe.style.zIndex = "9998";
    iframe.style.border = "none";
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
    const imgButton: HTMLImageElement = document.createElement("img");
    imgButton.src = this.buttonLogoURI;
    imgButton.style.position = "fixed";
    imgButton.style.display = "none";
    imgButton.style.borderRadius = "50%";
    // add border colour blue
    // add border width 3px
    imgButton.style.borderWidth = "2px";
    imgButton.style.borderStyle = "solid";
    imgButton.style.borderColor = "white";
    imgButton.style.width = "55px";
    imgButton.style.height = "55px";
    imgButton.style.zIndex = "2147483647";
    imgButton.style.cursor = "pointer";
    imgButton.draggable = false; // Prevent default image dragging

    let isDragging: boolean = false;
    let startY: number, initialY: number;

    imgButton.addEventListener("mousedown", (e: MouseEvent) => {
      e.preventDefault(); // Prevent default image dragging behavior
      startY = e.clientY;
      initialY = imgButton.offsetTop;
      isDragging = false;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dy) > 5) {
          isDragging = true;
          imgButton.style.top = `${initialY + dy}px`;
        }
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        if (!isDragging) {
          this.toggleIframe();
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    imgButton.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation(); // Prevent click event propagation
    });

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
    /* if (event.origin !== this.iframeOrigin) return; */
    const { type, data } = event.data;

    if (type === "minimizeIframe") {
      this.toggleIframe();
      return;
    }

    if (type === "disconnect") {
      this.disconnect();
      return;
    }
    if (type === "googleExternal") {
      this.handleGoogleLogin(data);
      return;
    }
    if (type === "onramp") {
      this.onRamp(data);
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

    if (type === "autoConnectOnLoad") {
      this.autoConnectOnLoad();
      return;
    }

    if (type === "signMessage") {
      this.signMessage(data.key, data.message);
      return;
    }

    if (type === "sendTransaction") {
      this.sendTransaction(data.key, data.transaction);
      return;
    }

    if (type === "writeContract") {
      this.writeContract(data.key, data.transaction);
      return;
    }

    if (type === "iframeReady") {
      this.iframe.contentWindow?.postMessage(
        { type: "authMethod", data: { authMode: this.authMode } },
        this.iframeOrigin
      );
      this.iframe.contentWindow?.postMessage(
        { type: "onrampMethod", data: { onrampMode: this.onrampMode } },
        this.iframeOrigin
      );
      this.iframe.contentWindow?.postMessage(
        { type: "logo", data: { logoDataURI: this.logoDataURI } },
        this.iframeOrigin
      );
      this._ready = true;

      this.processQueue();
      return;
    }

    if (type === "unauthenticated") {
      if (this.authMode === "Google") {
        this.initGoogleOneTap();
      } else if (this.authMode === "Twitter") {
        this.connectTwitter();
      }
    }

    if (this.listeners[type]) {
      this.listeners[type](data);
    }
  }

  private processQueue(): void {
    while (this.commandQueue.length && this._ready) {
      const { command, data, resolve, reject } = this.commandQueue.shift()!;
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
            icons: [this.logoDataURI],
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
            icons: [this.logoDataURI],
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

  async initGoogleOneTap() {
    const clientId = '896710466843-42ss52pj2o1j9b17477nv73smnu096e2.apps.googleusercontent.com';

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: clientId,
        callback: this.onGoogleSignIn.bind(this),
        auto_select: true,
      });

      // @ts-ignore
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.googleSignInPopup();
          console.log('One Tap prompt was not displayed:', notification);
        }
      });
    };

    script.onerror = () => {
      this.googleSignInPopup();
      console.error('Failed to load the Google One Tap script.');
    };
  }

  onGoogleSignIn(response: any) {
    const id_token = response.credential;
    this.handleGoogleLogin(id_token);
  }

  googleSignInPopup() {
    const clientId = '896710466843-42ss52pj2o1j9b17477nv73smnu096e2.apps.googleusercontent.com';
    const redirectUri = "https://web.moongate.one/callback";
    const origin = window.location.href;
    const state = encodeURIComponent(origin);
    function generateNonce(length: number) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
    const nonce = generateNonce(16);

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=id_token%20token&scope=email%20profile&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}`,
      'googleSignInPopup',
      'width=500,height=600'
    );
  }

  async connectTwitter(): Promise<void> {
    const clientId = 'Slo1eVdkSEt0a2dYOE1VU1JCcVk6MTpjaQ';
    const redirectUri = "https://v2.moongate.one/callbacktwitter";
    const state = encodeURIComponent(window.location.href);

    function generateNonce(length: number) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    function generateCodeVerifier(length: number) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      let result = '';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    async function generateCodeChallenge(verifier: string) {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    const nonce = generateNonce(16);
    const codeVerifier = generateCodeVerifier(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const iframe = document.createElement('iframe');
    iframe.src = `https://v2.moongate.one/twittercodeverifier?codeVerifier=${codeVerifier}`;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    await new Promise((resolve) => {
      iframe.onload = resolve;
    });

    const codeChallengeMethod = 'S256';

    const popup = window.open(
      `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}&scope=tweet.read%20users.read%20offline.access&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`,
      'twitterSignInPopup',
      'width=500,height=600'
    );
  }

  async handleGoogleLogin(idToken: any) {
    this.iframe.contentWindow?.postMessage(
      {
        type: "googleAuth",
        data: {
          token: idToken,
        },
      },
      this.iframeOrigin
    );
  }

  onRamp(url: string) {
    if (document.getElementById("onramp-container")) {
      return;
    }
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
    overlay.style.zIndex = "9998";
    overlay.style.transition = "background-color 0.5s ease";
    document.body.appendChild(overlay);

    const container = document.createElement("div");
    container.id = "onramp-container";
    container.style.position = "fixed";
    if (this.isMobileDevice()) {
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.transform = "";
    } else {
      container.style.top = "50%";
      container.style.left = "50%";
      container.style.transform = "translate(-50%, -50%)";
      container.style.width = "400px";
      container.style.height = "600px";
    }

    container.style.zIndex = "9999";
    container.style.borderRadius = "8px";
    container.style.overflow = "hidden";
    container.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    container.style.backgroundColor = "#0D1117";
    container.style.paddingTop = "45px";

    document.body.appendChild(container);

    const onrampIframe = document.createElement("iframe");
    onrampIframe.src = url;
    onrampIframe.style.width = "100%";
    onrampIframe.style.height = "100%";
    onrampIframe.style.border = "none";
    onrampIframe.sandbox.value =
      "allow-scripts allow-same-origin allow-popups allow-modals allow-forms allow-top-navigation allow-popups-to-escape-sandbox";
    onrampIframe.allow = "clipboard-write; clipboard-read;";
    container.appendChild(onrampIframe);

    const closeButton = document.createElement("button");
    closeButton.innerText = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.backgroundColor = "red";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "50%";
    closeButton.style.width = "30px";
    closeButton.style.height = "30px";
    closeButton.style.cursor = "pointer";
    closeButton.style.zIndex = "10000";
    container.appendChild(closeButton);

    closeButton.addEventListener("click", () => {
      document.body.removeChild(container);
      document.body.removeChild(overlay);
    });

    setTimeout(() => {
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    }, 10);
  }

  onConnected(res: ConnectReturnType<Config>) {
    this.connectedWalletAddress = res.accounts[0];
    this.connectedChainId = res.chainId;

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
    disconnect(this.wagmiConfig);
    this.connectedWalletAddress = null;
    this.connectedChainId = null;
    window.removeEventListener("message", this.handleMessage);

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
          console.log("MoonGate closed as user didn't respond within time");
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

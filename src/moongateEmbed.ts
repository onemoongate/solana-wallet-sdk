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

  constructor() {
    window.addEventListener("message", this.handleMessage.bind(this));
    this.iframeOrigin = new URL("https://staging.moongate.one/").origin;
    this.iframe = this.createIframe();
    this.minimizeButton = this.createMinimizeButton();
  }

  private isMobileDevice(): boolean {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  private createIframe(): HTMLIFrameElement {
    const iframe = document.createElement("iframe");
    iframe.src = "https://staging.moongate.one/";
    iframe.sandbox
    iframe.style.position = "fixed";
    iframe.style.top = "50%";
    iframe.style.left = "50%";
    iframe.style.transform = "translate(-50%, -50%)";
    iframe.style.width = "500px";
    iframe.style.height = "600px";
    iframe.style.zIndex = "999999";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "transparent";
    iframe.sandbox.value= "allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox";
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

    if (type === "mobileConnect") {
      location.assign(data);
      return;
    }

    if (type == "localStorageSet") {
      const { key, value } = data;
      localStorage.setItem(key, value);
      return;
    }
    if (type == "localStorageGet") {
      const { key } = data;
      const value = localStorage.getItem(key);
      this.iframe.contentWindow?.postMessage(
        { type: "localStorageGetResponse", data: { key, value } },
        this.iframeOrigin
      );
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

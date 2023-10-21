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
    this.iframeOrigin = new URL("https://wallet.moongate.one/").origin;
    this.iframe = document.createElement("iframe");
    this.iframe.src = "https://wallet.moongate.one/";
    this.minimizeButton = this.createMinimizeButton();
    // put the iframe on the top right corner of the screen with some space
    this.iframe.style.position = "fixed";
    this.iframe.style.top = "10px";
    this.iframe.style.right = "10px";
    this.iframe.style.width = "500px";
    this.iframe.style.height = "600px";
    this.iframe.style.zIndex = "999999";
    this.iframe.style.border = "none";
    this.iframe.allow = "clipboard-write; clipboard-read;";
    this.iframe.onload = () => {
      // Once the iframe has loaded, send a message to its content
      this.iframe.contentWindow?.postMessage(
        {
          type: "initIframe",
          data: { origin: window.location.origin },
        },
        this.iframeOrigin
      );
    };
    document.body.appendChild(this.iframe);
  }

  async disconnect(): Promise<void> {
    console.log("Starting the disconnection process...");
    this.iframe.remove();
    if (this.minimizeButton) {
      this.minimizeButton.remove();
    }
    this._ready = false;
  }
  private createMinimizeButton(): HTMLImageElement {
    const imgButton = document.createElement("img");
    // Set the image source
    imgButton.src = "https://i.ibb.co/NjxF2zw/Image-3.png";
    // style the image to look like a button
    imgButton.style.position = "fixed";
    imgButton.style.display = "none";
    imgButton.style.width = "50px";
    imgButton.style.height = "50px";
    imgButton.style.top = "10px";
    imgButton.style.right = "10px";
    imgButton.style.zIndex = "9999999"; // Ensure it's above the iframe
    imgButton.style.cursor = "pointer"; // Change cursor to pointer on hover to indicate it's clickable

    // Event listener to handle the click on the image
    imgButton.addEventListener("click", this.toggleIframe.bind(this));

    // Append the image button to the document body
    document.body.appendChild(imgButton);

    return imgButton;
  }

  private toggleIframe() {
    if (this.iframe.style.display === "none") {
      this.iframe.style.display = "block";
      this.minimizeButton.style.display = "none";
    } else {
      this.iframe.style.display = "none";
      this.minimizeButton.style.display = "block";
    }
  }
  private handleMessage(event: MessageEvent) {
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

    if (type === "iframeReady") {
      this._ready = true;
      this.processQueue();
      return;
    }

    if (this.listeners[type]) {
      this.listeners[type](data);
    }
  }

  private processQueue() {
    while (this.commandQueue.length && this._ready) {
      const { command, data, resolve } = this.commandQueue.shift()!;
      const responseType = `${command}Response`; // Determine the expected response type
      if (!this.listeners[responseType]) {
        this.listeners[responseType] = resolve;
        this.iframe.contentWindow?.postMessage(
          { type: command, data },
          this.iframeOrigin
        );
      }
    }
  }

  async sendCommand<T = unknown>(command: string, data: any): Promise<T> {
    if (this.iframe.style.display === "none") {
      this.toggleIframe();
    }
    const responseType = `${command}Response`; // Adjust the expected response type
    // Get the origin URL of the parent window
    const origin = window.location.origin;
    return new Promise((resolve, reject) => {
      if (!this._ready) {
        this.commandQueue.push({ command, data, resolve, reject });

        // Set a timeout for queued commands
        setTimeout(() => {
          reject(new Error("Iframe did not respond in time"));
        }, 120000);
      } else {
        // Set up the listener first.
        if (!this.listeners[responseType]) {
          // Check for the adjusted response type
          this.listeners[responseType] = (responseData: any) => {
            resolve(responseData as T);
            delete this.listeners[responseType]; // Optionally clean up after getting a response
          };
        }

        // Then send the command with the origin.
        this.iframe.contentWindow?.postMessage(
          { type: command, data, origin }, // Include the origin in the message data
          this.iframeOrigin
        );
      }
    });
  }
}

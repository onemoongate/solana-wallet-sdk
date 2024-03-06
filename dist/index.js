var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/moongateEmbed.ts
import { walletConnect, injected, coinbaseWallet } from "@wagmi/connectors";
import {
  connect,
  createConfig,
  disconnect,
  http,
  reconnect,
  sendTransaction,
  signMessage,
  switchChain,
  writeContract
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
  linea
} from "@wagmi/core/chains";
import { createClient } from "viem";
var MoonGateEmbed = class {
  constructor() {
    this._ready = false;
    this.listeners = {};
    this.commandQueue = [];
    this.connectedWalletAddress = null;
    this.connectedChainId = null;
    window.addEventListener("message", this.handleMessage.bind(this));
    this.iframeOrigin = new URL("https://v2.moongate.one").origin;
    this.iframe = this.createIframe();
    this.minimizeButton = this.createMinimizeButton();
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
        linea
      ],
      client({ chain }) {
        return createClient({
          chain,
          transport: http()
        });
      },
      connectors: [
        injected({
          shimDisconnect: true
        }),
        walletConnect({
          projectId: "927848f28c257a3e24dacce25127d8d5"
        }),
        coinbaseWallet({
          appName: "Moongate"
        })
      ]
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
  isMobileDevice() {
    return window.matchMedia("(max-width: 767px)").matches;
  }
  createIframe() {
    const iframe = document.createElement("iframe");
    iframe.src = "https://v2.moongate.one";
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
    iframe.sandbox.value = "allow-scripts allow-same-origin allow-popups allow-modals allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation";
    iframe.allow = "clipboard-write; clipboard-read;";
    iframe.onload = () => {
      var _a;
      (_a = iframe.contentWindow) == null ? void 0 : _a.postMessage(
        {
          type: "initIframe",
          data: { origin: window.location.origin }
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
  moveModal(corner = "top-right") {
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
  setPosition(element, top, right, left, bottom) {
    element.style.top = top;
    element.style.right = right;
    element.style.left = left;
    element.style.bottom = bottom;
  }
  createMinimizeButton() {
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
  toggleIframe() {
    if (this.iframe.style.display === "none") {
      this.iframe.style.display = "block";
      this.minimizeButton.style.display = "none";
    } else {
      this.iframe.style.display = "none";
      this.minimizeButton.style.display = "block";
    }
  }
  handleMessage(event) {
    if (event.origin !== this.iframeOrigin)
      return;
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
  processQueue() {
    var _a;
    while (this.commandQueue.length && this._ready) {
      const { command, data, resolve } = this.commandQueue.shift();
      const responseType = `${command}Response`;
      if (!this.listeners[responseType]) {
        this.listeners[responseType] = resolve;
        (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
          { type: command, data },
          this.iframeOrigin
        );
      }
    }
  }
  connectWalletConnect() {
    return __async(this, null, function* () {
      try {
        yield this.beforeConnecting();
        const res = yield connect(this.wagmiConfig, {
          connector: walletConnect({
            projectId: "927848f28c257a3e24dacce25127d8d5"
          })
        });
        this.onConnected(res);
      } catch (e) {
        console.log(e);
      }
    });
  }
  connectCoinbaseWallet() {
    return __async(this, null, function* () {
      try {
        yield this.beforeConnecting();
        const res = yield connect(this.wagmiConfig, {
          connector: coinbaseWallet({
            appName: "Moongate"
          })
        });
        this.onConnected(res);
      } catch (e) {
        console.log(e);
      }
    });
  }
  connectInjected(target) {
    return __async(this, null, function* () {
      try {
        const res = yield this.beforeConnecting();
        if (res) {
          this.onConnected(res);
        } else {
          const res2 = yield connect(this.wagmiConfig, {
            connector: injected({
              target: target != null ? target : "metaMask"
            })
          });
          localStorage.setItem("wagmi.injected.shimDisconnect", "true");
          this.onConnected(res2);
        }
      } catch (e) {
        console.log(e);
      }
    });
  }
  autoConnectOnLoad() {
    return __async(this, null, function* () {
      const res = yield this.beforeConnecting();
      if (res) {
        this.onConnected(res);
      }
    });
  }
  beforeConnecting() {
    return __async(this, null, function* () {
      const reconnectRes = yield reconnect(this.wagmiConfig, {
        connectors: [
          injected(),
          walletConnect({
            projectId: "927848f28c257a3e24dacce25127d8d5"
          }),
          coinbaseWallet({
            appName: "Moongate"
          })
        ]
      });
      let res = null;
      if (reconnectRes.length) {
        res = yield reconnectRes[0].connector.connect();
      }
      return res;
    });
  }
  onConnected(res) {
    var _a;
    this.connectedWalletAddress = res.accounts[0];
    this.connectedChainId = res.chainId;
    console.log("Connected to wallet", res);
    (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
      {
        type: "connected",
        data: {
          chainId: res.chainId,
          address: res.accounts[0],
          host: window.location.host,
          origin: window.location.origin
        }
      },
      this.iframeOrigin
    );
  }
  signMessage(key, message) {
    return __async(this, null, function* () {
      var _a;
      console.log("Signing message", key, message);
      try {
        const signature = yield signMessage(this.wagmiConfig, {
          message
        });
        (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
          {
            type: "signedMessage",
            data: {
              key,
              message,
              signature
            }
          },
          this.iframeOrigin
        );
      } catch (e) {
        console.error("Failed to sign message", e);
      }
    });
  }
  switchNetwork(chainId) {
    return __async(this, null, function* () {
      var _a;
      console.log(this.wagmiConfig, chainId);
      try {
        yield switchChain(this.wagmiConfig, {
          chainId: Number(chainId)
        });
        (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
          {
            type: "switchedNetwork",
            data: {
              chainId
            }
          },
          this.iframeOrigin
        );
      } catch (e) {
        console.error("Failed to switch network, retrying...", e);
        setTimeout(() => __async(this, null, function* () {
          var _a2;
          try {
            yield switchChain(this.wagmiConfig, {
              chainId: Number(chainId)
            });
            (_a2 = this.iframe.contentWindow) == null ? void 0 : _a2.postMessage(
              {
                type: "switchedNetwork",
                data: {
                  chainId
                }
              },
              this.iframeOrigin
            );
          } catch (e2) {
            console.error("Failed to switch network again", e2);
          }
        }), 500);
      }
    });
  }
  sendTransaction(key, transaction) {
    return __async(this, null, function* () {
      var _a;
      console.log("Sending transaction");
      try {
        const hash = yield sendTransaction(this.wagmiConfig, transaction);
        (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
          {
            type: "sentTransaction",
            data: {
              transaction,
              hash,
              key
            }
          },
          this.iframeOrigin
        );
      } catch (e) {
        console.error("Failed to send transaction", e);
      }
    });
  }
  writeContract(key, transaction) {
    return __async(this, null, function* () {
      var _a;
      console.log("Sending transaction");
      try {
        const hash = yield writeContract(this.wagmiConfig, transaction);
        (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
          {
            type: "sentTransaction",
            data: {
              transaction,
              hash,
              key
            }
          },
          this.iframeOrigin
        );
      } catch (e) {
        console.error("Failed to send transaction", e);
      }
    });
  }
  disconnect() {
    return __async(this, null, function* () {
      var _a;
      console.log("Starting the disconnection process...");
      disconnect(this.wagmiConfig);
      this.connectedWalletAddress = null;
      this.connectedChainId = null;
      (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
        {
          type: "disconnected"
        },
        this.iframeOrigin
      );
      this.iframe.remove();
      if (this.minimizeButton) {
        this.minimizeButton.remove();
      }
      this._ready = false;
    });
  }
  sendCommand(command, data) {
    return __async(this, null, function* () {
      if (this.iframe.style.display === "none") {
        this.toggleIframe();
      }
      const responseType = `${command}Response`;
      const origin = window.location.origin;
      return new Promise((resolve, reject) => {
        var _a;
        if (!this._ready) {
          this.commandQueue.push({ command, data, resolve, reject });
          setTimeout(() => {
            console.log("didn't respond in time");
            reject(new Error("Iframe did not respond in time"));
          }, 12e4);
        } else {
          if (!this.listeners[responseType]) {
            this.listeners[responseType] = (responseData) => {
              resolve(responseData);
              delete this.listeners[responseType];
            };
          }
          (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
            { type: command, data, origin },
            this.iframeOrigin
          );
        }
      });
    });
  }
};
export {
  MoonGateEmbed
};

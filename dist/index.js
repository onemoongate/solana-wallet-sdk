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
  linea,
  bsc
} from "@wagmi/core/chains";
import { appleAuthHelpers } from "react-apple-signin-auth";
import { createClient } from "viem";
var iframeUrl = "https://v2.moongate.one";
var MoonGateEmbed = class {
  constructor({ authModeAdapter = "Ethereum", logoDataURI = "Default", buttonLogoURI = "https://i.ibb.co/NjxF2zw/Image-3.png" }) {
    this._ready = false;
    this.authMode = "Ethereum";
    this.logoDataURI = "Default";
    this.buttonLogoURI = "https://i.ibb.co/NjxF2zw/Image-3.png";
    this.onrampMode = "Standard";
    this.listeners = {};
    this.commandQueue = [];
    this.connectedWalletAddress = null;
    this.connectedChainId = null;
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
        bsc
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
          projectId: "927848f28c257a3e24dacce25127d8d5",
          metadata: {
            name: "Moongate",
            description: "Moongate Wallet",
            url: "https://moongate.one",
            icons: [logoDataURI]
          },
          qrModalOptions: {
            themeVariables: {
              "--wcm-z-index": "2147483647"
            }
          }
        }),
        coinbaseWallet({
          appName: "Moongate"
        })
      ]
    });
    this.wagmiConfig = wagmiConfig;
  }
  isMobileDevice() {
    return window.matchMedia("(max-width: 767px)").matches;
  }
  createIframe() {
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
    imgButton.src = this.buttonLogoURI;
    imgButton.style.position = "fixed";
    imgButton.style.display = "none";
    imgButton.style.borderRadius = "50%";
    imgButton.style.borderWidth = "2px";
    imgButton.style.borderStyle = "solid";
    imgButton.style.borderColor = "white";
    imgButton.style.width = "55px";
    imgButton.style.height = "55px";
    imgButton.style.zIndex = "2147483647";
    imgButton.style.cursor = "pointer";
    imgButton.draggable = false;
    let isDragging = false;
    let startY, initialY;
    imgButton.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startY = e.clientY;
      initialY = imgButton.offsetTop;
      isDragging = false;
      const onMouseMove = (moveEvent) => {
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
    imgButton.addEventListener("click", (e) => {
      e.stopPropagation();
    });
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
    var _a, _b, _c;
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
    if (type === "twitterExternal") {
      this.handleTwitterAuth(data);
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
      (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
        { type: "authMethod", data: { authMode: this.authMode } },
        this.iframeOrigin
      );
      (_b = this.iframe.contentWindow) == null ? void 0 : _b.postMessage(
        { type: "onrampMethod", data: { onrampMode: this.onrampMode } },
        this.iframeOrigin
      );
      (_c = this.iframe.contentWindow) == null ? void 0 : _c.postMessage(
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
      } else if (this.authMode === "Apple") {
        this.initAppleSignIn();
      }
    }
    if (this.listeners[type]) {
      this.listeners[type](data);
    }
  }
  processQueue() {
    var _a;
    while (this.commandQueue.length && this._ready) {
      const { command, data, resolve, reject } = this.commandQueue.shift();
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
            projectId: "927848f28c257a3e24dacce25127d8d5",
            metadata: {
              name: "Moongate",
              description: "Moongate Wallet",
              url: "https://moongate.one",
              icons: [this.logoDataURI]
            },
            qrModalOptions: {
              themeVariables: {
                "--wcm-z-index": "2147483647"
              }
            }
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
            projectId: "927848f28c257a3e24dacce25127d8d5",
            metadata: {
              name: "Moongate",
              description: "Moongate Wallet",
              url: "https://moongate.one",
              icons: [this.logoDataURI]
            },
            qrModalOptions: {
              themeVariables: {
                "--wcm-z-index": "2147483647"
              }
            }
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
  initGoogleOneTap() {
    return __async(this, null, function* () {
      const clientId = "896710466843-42ss52pj2o1j9b17477nv73smnu096e2.apps.googleusercontent.com";
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: this.onGoogleSignIn.bind(this),
          auto_select: true
        });
        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.googleSignInPopup();
            console.log("One Tap prompt was not displayed:", notification);
          }
        });
      };
      script.onerror = () => {
        this.googleSignInPopup();
        console.error("Failed to load the Google One Tap script.");
      };
    });
  }
  onGoogleSignIn(response) {
    const id_token = response.credential;
    this.handleGoogleLogin(id_token);
  }
  googleSignInPopup() {
    const clientId = "896710466843-42ss52pj2o1j9b17477nv73smnu096e2.apps.googleusercontent.com";
    const redirectUri = "https://web.moongate.one/callback";
    const origin = window.location.href;
    const state = encodeURIComponent(origin);
    function generateNonce(length) {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
    const nonce = generateNonce(16);
    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=id_token%20token&scope=email%20profile&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}`,
      "googleSignInPopup",
      "width=500,height=600"
    );
  }
  initAppleSignIn() {
    return __async(this, null, function* () {
      const appleSign = document.createElement("script");
      appleSign.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      appleSign.async = true;
      appleSign.defer = true;
      document.head.appendChild(appleSign);
      function generateNonce(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
      }
      if (!localStorage.getItem("appleSignInNonce")) {
        const nonce = generateNonce(16);
        localStorage.setItem("appleSignInNonce", nonce);
        appleAuthHelpers.signIn({
          authOptions: {
            clientId: "com.moongate.web",
            scope: "email name",
            redirectURI: "https://wallet.moongate.one/api1/verifyapple",
            state: window.location.href,
            usePopup: false,
            nonce
          }
        });
      } else {
        let accessToken = null;
        function getToken() {
          return __async(this, null, function* () {
            try {
              const response = yield fetch(`https://wallet.moongate.one/api1/getappletoken`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ codeVerifier: localStorage.getItem("appleSignInNonce") })
              });
              const data = yield response.json();
              if (data) {
                accessToken = data.supabaseToken;
              } else {
                console.error("Failed to get token");
              }
            } catch (e) {
              console.error(e);
            }
          });
        }
        const getTheToken = setInterval(() => __async(this, null, function* () {
          var _a;
          yield getToken();
          if (accessToken) {
            (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
              {
                type: "twitter",
                data: {
                  token: accessToken
                }
              },
              this.iframeOrigin
            );
            localStorage.removeItem("appleSignInNonce");
            clearInterval(getTheToken);
          }
        }), 1500);
      }
    });
  }
  connectTwitter() {
    return __async(this, null, function* () {
      const clientId = "Slo1eVdkSEt0a2dYOE1VU1JCcVk6MTpjaQ";
      const redirectUri = "https://v2.moongate.one/callbacktwitter";
      const state = encodeURIComponent(window.location.href);
      function generateNonce(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
      }
      function generateCodeVerifier(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        let result = "";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
      }
      function generateCodeChallenge(verifier) {
        return __async(this, null, function* () {
          const encoder = new TextEncoder();
          const data = encoder.encode(verifier);
          const digest = yield crypto.subtle.digest("SHA-256", data);
          return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        });
      }
      const nonce = generateNonce(16);
      const codeVerifier = generateCodeVerifier(128);
      const codeChallenge = yield generateCodeChallenge(codeVerifier);
      const firstPopup = window.open(`https://v2.moongate.one/twittercodeverifier?codeVerifier=${codeVerifier}`);
      yield new Promise((resolve) => {
        const interval = setInterval(() => {
          if (firstPopup == null ? void 0 : firstPopup.closed) {
            clearInterval(interval);
            resolve(null);
          }
        }, 1e3);
      });
      const codeChallengeMethod = "S256";
      setTimeout(() => {
        const popup = window.open(
          `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}&scope=tweet.read%20users.read%20offline.access&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}`,
          "twitterSignInPopup",
          "width=500,height=600"
        );
      }, 1500);
      let accessToken = null;
      const getTheToken = setInterval(() => __async(this, null, function* () {
        var _a;
        yield getToken();
        if (accessToken) {
          (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
            {
              type: "twitter",
              data: {
                token: accessToken
              }
            },
            this.iframeOrigin
          );
          clearInterval(getTheToken);
        }
      }), 1500);
      function getToken() {
        return __async(this, null, function* () {
          try {
            const response = yield fetch(`https://wallet.moongate.one/api1/gettwittertoken`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ codeVerifier })
            });
            const data = yield response.json();
            if (data) {
              accessToken = data.supabaseToken;
            } else {
              console.error("Failed to get token");
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  }
  handleGoogleLogin(idToken) {
    return __async(this, null, function* () {
      var _a;
      (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
        {
          type: "googleAuth",
          data: {
            token: idToken
          }
        },
        this.iframeOrigin
      );
    });
  }
  handleTwitterAuth(idToken) {
    return __async(this, null, function* () {
      var _a;
      (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(
        {
          type: "token",
          data: {
            token: idToken
          }
        },
        this.iframeOrigin
      );
    });
  }
  onRamp(url) {
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
    onrampIframe.sandbox.value = "allow-scripts allow-same-origin allow-popups allow-modals allow-forms allow-top-navigation allow-popups-to-escape-sandbox";
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
  onConnected(res) {
    var _a;
    this.connectedWalletAddress = res.accounts[0];
    this.connectedChainId = res.chainId;
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
      disconnect(this.wagmiConfig);
      this.connectedWalletAddress = null;
      this.connectedChainId = null;
      window.removeEventListener("message", this.handleMessage);
      localStorage.removeItem("appleSignInNonce");
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
            console.log("MoonGate closed as user didn't respond within time");
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

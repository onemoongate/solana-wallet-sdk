/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    appDir: true,
  },
  // headers: async () => {
  //   return [
  //     {
  //       source: "/",
  //       headers: [
  //         {
  //           key: "Content-Security-Policy",
  //           value:
  //             // "frame-ancestors 'self' *.moongate.one verify.walletconnect.org verify.walletconnect.com http://anish.local:3000 localhost:3000 https://verify.walletconnect.org https://verify.walletconnect.com;",
  //             "frame-ancestors 'self' *.moongate.one localhost:3000; connect-src 'self' verify.walletconnect.org;",
  //         },
  //       ],
  //     },
  //   ]
  // },
}

export default nextConfig

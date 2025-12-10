/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: false,
  serverExternalPackages: ['@xmtp/xmtp-js', '@xmtp/proto'],
};

module.exports = nextConfig;
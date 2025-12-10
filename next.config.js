/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  serverExternalPackages: ['@xmtp/xmtp-js', '@xmtp/proto'],
};

module.exports = nextConfig;
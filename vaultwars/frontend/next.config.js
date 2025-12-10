/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  serverExternalPackages: ['@xmtp/xmtp-js', '@xmtp/proto'],
};

module.exports = nextConfig;
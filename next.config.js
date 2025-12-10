/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: false,
  serverExternalPackages: ['@xmtp/xmtp-js', '@xmtp/proto'],
  webpack: (config, { isServer }) => {
    // Resolve aliases for missing dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-elasticsearch': false,
      'tap': false,
    };

    return config;
  },
};

module.exports = nextConfig;
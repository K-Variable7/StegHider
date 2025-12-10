/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@xmtp/xmtp-js', '@xmtp/proto'],
  webpack: (config, { isServer }) => {
    // Resolve aliases for missing dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-elasticsearch': false,
      'tap': false,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    return config;
  },
};

module.exports = nextConfig;
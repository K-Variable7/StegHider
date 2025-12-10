/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: false,
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  serverExternalPackages: ['@xmtp/xmtp-js', '@xmtp/proto'],
  webpack: (config, { isServer }) => {
    // Exclude test files from node_modules
    config.module.rules.push({
      test: /\.test\.(js|ts|tsx|mjs)$/,
      include: /node_modules/,
      use: 'ignore-loader'
    });

    // Exclude specific problematic files
    config.module.rules.push({
      test: /thread-stream\/test\/.*\.(js|ts|tsx|mjs|md|zip|sh)$/,
      use: 'ignore-loader'
    });

    // Exclude README and LICENSE files in thread-stream
    config.module.rules.push({
      test: /thread-stream\/(README\.md|LICENSE)$/,
      use: 'ignore-loader'
    });

    return config;
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  turbopack: {},
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

    // Resolve fallbacks for missing optional dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    };

    // Ignore specific modules that cause issues
    config.externals = config.externals || [];
    config.externals.push({
      'pino-pretty': 'commonjs pino-pretty',
      '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
    });

    return config;
  },
};

module.exports = withPWA(nextConfig);
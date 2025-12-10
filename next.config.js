/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: false,
  serverExternalPackages: ['@xmtp/xmtp-js', '@xmtp/proto'],
  webpack: (config, { isServer }) => {
    // Externalize problematic packages
    config.externals = config.externals || [];
    config.externals.push({
      'thread-stream': 'commonjs thread-stream',
    });

    return config;
  },
};

module.exports = nextConfig;
'use client';

import { Component, ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  baseSepolia,
} from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Wallet connection error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Connection Error</h1>
            <p className="text-gray-300 mb-6">
              There was an issue connecting to your wallet. This might be due to:
            </p>
            <ul className="text-left text-gray-400 text-sm mb-6 space-y-2">
              <li>• MetaMask extension not installed or updated</li>
              <li>• Network connection issues</li>
              <li>• Browser compatibility problems</li>
              <li>• Conflicting wallet extensions</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const config = createConfig({
  chains: [baseSepolia, sepolia, mainnet, polygon, optimism, arbitrum, base],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
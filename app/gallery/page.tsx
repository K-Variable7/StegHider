'use client';

import { useAccount } from 'wagmi';
import NFTGallery from '../../components/NFTGallery';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function GalleryPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Gallery Access Required</h1>
          <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8">Connect your wallet to view the NFT evolution gallery</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header with Navigation - Mobile optimized */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              🖼️ NFT Evolution Gallery
            </h1>
            <p className="text-gray-300 text-base sm:text-lg px-4">
              Witness the cosmic transformation of your steganographic treasures
            </p>
          </div>
          <nav className="flex space-x-4 sm:space-x-6">
            <a
              href="/"
              className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
            >
              Arena
            </a>
            <a
              href="/warroom"
              className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
            >
              War Room
            </a>
            <a
              href="/analytics"
              className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base"
            >
              Analytics
            </a>
            <a
              href="/gallery"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold text-sm sm:text-base"
            >
              Gallery
            </a>
          </nav>
        </div>

        {/* Gallery - Mobile optimized */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-purple-500/20 shadow-2xl">
          <NFTGallery />
        </div>
      </div>
    </div>
  );
}

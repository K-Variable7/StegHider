'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

import TournamentDashboard from '../../components/TournamentDashboard';

export default function TournamentsPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-4xl font-bold text-white">VaultWars</h1>
            {isConnected && (
              <nav className="flex space-x-4">
                <a
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Arena
                </a>
                <a
                  href="/warroom"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  War Room
                </a>
                <a
                  href="/gallery"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Gallery
                </a>
                <div className="relative group">
                  <button className="text-gray-300 hover:text-white transition-colors flex items-center">
                    Extras ▼
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max z-50">
                    <a
                      href="/tournaments"
                      className="block px-4 py-2 text-sm text-cyan-400 hover:bg-gray-700 hover:text-white transition-colors font-semibold"
                    >
                      🏆 Tournaments
                    </a>
                    <a
                      href="/challenges"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      🧩 Challenges
                    </a>
                    <a
                      href="/marketplace"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      💰 Marketplace
                    </a>
                    <a
                      href="/staking"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      🔒 Staking
                    </a>
                    <a
                      href="/referrals"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      👥 Referrals
                    </a>
                    <a
                      href="/leaderboard"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      🏅 Leaderboard
                    </a>
                    <a
                      href="/events"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      🎉 Events
                    </a>
                  </div>
                </div>
              </nav>
            )}
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">🏆 Tournament Arena</h2>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to join epic tournaments and compete for glory!
            </p>
            <ConnectButton />
          </div>
        ) : (
          <TournamentDashboard />
        )}
      </main>
    </div>
  );
}
'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useState, Suspense, lazy } from 'react';
import { Cinzel_Decorative } from 'next/font/google';

const cinzelDecorative = Cinzel_Decorative({ subsets: ['latin'], weight: ['400', '700', '900'] });

export const dynamic = 'force-dynamic';

const FactionDashboard = lazy(() => import('../components/EnhancedFactionDashboard'));

export default function Home() {
  const { isConnected } = useAccount();
  const [isClient, setIsClient] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [showLore, setShowLore] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black">
        <div className="text-center pt-20">
          <h1 className="text-6xl font-bold text-white mb-8">VAULTWARS</h1>
          <p className="text-xl text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasEntered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
        {/* Colosseum Image */}
        <img
          src="/colosseum-illustration-sketch-hand-drawn-vector.jpg"
          alt="Colosseum Silhouette"
          className="absolute inset-0 w-full h-full object-cover opacity-5 mix-blend-screen pointer-events-none"
        />
        <div className="text-center relative z-10">
          <h1 className={`${cinzelDecorative.className} text-6xl md:text-8xl font-bold text-white mb-8 tracking-wider drop-shadow-2xl bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent`}>VAULTWARS</h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto drop-shadow-lg">
            Enter the Colosseum of Digital Warfare. Hidden clues await. Factions clash. Only the cunning survive.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
            <button
              onClick={() => setHasEntered(true)}
              className="px-12 py-4 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white font-bold text-xl rounded-xl hover:from-red-500 hover:via-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-red-500/50 hover:border-red-400/70 hover:shadow-red-500/25"
            >
              ⚔️ ENTER THE ARENA
            </button>
            <a
              href="/analytics"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-bold text-lg rounded-xl hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-blue-500/50 hover:border-blue-400/70 hover:shadow-blue-500/25 text-center"
            >
              📊 ANALYTICS
            </a>
            <a
              href="/spectator"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white font-bold text-lg rounded-xl hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-purple-500/50 hover:border-purple-400/70 hover:shadow-purple-500/25 text-center"
            >
              👁️ SPECTATOR MODE
            </a>
            <button
              onClick={() => setShowLore(true)}
              className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold text-lg rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-gray-500/50 hover:border-gray-400/70"
            >
              📜 LORE & RULES
            </button>
          </div>
        </div>

        {/* Lore Modal */}
        {showLore && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-xl rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative border border-red-500/20 shadow-2xl">
              <button
                onClick={() => setShowLore(false)}
                className="absolute top-4 right-4 text-white hover:text-red-400 text-2xl transition-colors"
              >
                ×
              </button>
              
              <h2 className={`${cinzelDecorative.className} text-3xl md:text-4xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent`}>VAULTWARS: The Eternal Hunt</h2>
              
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-2xl font-bold text-red-400 mb-3">The Lore</h3>
                  <p className="text-lg leading-relaxed">
                    In the shadowed vaults of ancient Rome, a legendary emperor hid his greatest treasures. 
                    Not gold or jewels, but secrets of power that could reshape empires. These treasures were 
                    scattered across the digital Colosseum, hidden within steganographic images - messages 
                    concealed in plain sight.
                  </p>
                  <p className="text-lg leading-relaxed mt-4">
                    Four factions emerged from the ashes: The Red Legion (aggressive hunters), Blue Strategists 
                    (tactical minds), Green Druids (nature's explorers), and Gold Champions (elite warriors). 
                    Each seeks dominance through cunning, theft, and revelation.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-blue-400 mb-3">How to Play</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold text-white">1. Choose Your Faction</h4>
                      <p>Select one of four factions. Each has unique playstyles and faction-specific rewards.</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">2. Hunt for Clues</h4>
                      <p>Scour the digital landscape for hidden images containing steganographic messages. 
                      Use the StegHider tool to decode them and collect NFT clues.</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">3. Strategic Reveals</h4>
                      <p>Use Random Reveal to peek at opponents' clues (costs ETH, scales with quantity/duration). 
                      Or Block Reveal to prevent others from seeing yours (defensive play).</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">4. Steal & Conquer</h4>
                      <p>Once you know a clue's location, steal it from its owner for a small fee. 
                      Build your faction's score and treasury.</p>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">5. Faction Warfare</h4>
                      <p>Chat with your faction via Nostr for decentralized coordination. 
                      Compete for leaderboard dominance and share in faction pots.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-green-400 mb-3">Steganography Explained</h3>
                  <p className="text-lg leading-relaxed">
                    Steganography hides messages within images using advanced algorithms. Unlike encryption 
                    (which makes data unreadable), steganography makes the data invisible. Our clues are 
                    embedded in hunt images using least significant bit (LSB) manipulation and error-correcting 
                    codes for reliability.
                  </p>
                  <p className="text-lg leading-relaxed mt-4">
                    <strong>How it works:</strong> Each pixel in an image has color values (RGB). We modify 
                    the least significant bits of these values to encode our message. The changes are so 
                    subtle they're invisible to the human eye, but our tools can extract them perfectly.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-3">Economic Mechanics</h3>
                  <ul className="list-disc list-inside space-y-2 text-lg">
                    <li><strong>Reveal Fees:</strong> Scale with quantity and duration. More reveals = higher cost, longer protection = more expensive.</li>
                    <li><strong>Steal Costs:</strong> Fixed 0.001 ETH per theft attempt.</li>
                    <li><strong>Faction Pots:</strong> Accumulate from failed steals and reveals. Winners share the spoils.</li>
                    <li><strong>Difficulty Scaling:</strong> Every 50 solves increases hunt difficulty and rewards.</li>
                  </ul>
                </div>

                <div className="text-center pt-6">
                  <button
                    onClick={() => setShowLore(false)}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-red-500/50"
                  >
                    UNDERSTOOD - ENTER THE ARENA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <header className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-4xl font-bold text-white">VaultWars</h1>
            {isConnected && (
              <nav className="flex space-x-4">
                <a
                  href="/"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
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
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
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
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to VaultWars</h2>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to join the scavenger hunt and compete with factions for NFT rewards!
            </p>
            <ConnectButton />
          </div>
        ) : (
          <Suspense fallback={<div className="text-center text-white">Loading game...</div>}>
            <FactionDashboard />
          </Suspense>
        )}
      </main>
      </div>
    </div>
  );
}
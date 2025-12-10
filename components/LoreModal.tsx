'use client';

import { useState } from 'react';

interface LoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  factionScores: Array<{name: string, score: number, pot: number}>;
}

export default function LoreModal({ isOpen, onClose, factionScores }: LoreModalProps) {
  const [activeTab, setActiveTab] = useState<'story' | 'howto' | 'economy'>('story');

  if (!isOpen) return null;

  const totalPots = factionScores.reduce((sum, f) => sum + Number(f.pot), 0);
  const totalSolved = factionScores.reduce((sum, f) => sum + Number(f.score), 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-red-900/90 to-yellow-900/90 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-white/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-yellow-400 transition-colors"
          >
            ✕
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">🏛️ VaultWars: Emperor's Treasure</h1>
            <p className="text-yellow-400 text-lg">Blockchain Scavenger Hunt in Ancient Rome</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/20">
          {[
            { id: 'story', label: '📜 The Legend', icon: '🏛️' },
            { id: 'howto', label: '⚔️ How to Play', icon: '🔍' },
            { id: 'economy', label: '💰 Economy', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 text-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white border-b-2 border-yellow-400'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-lg mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'story' && (
            <div className="space-y-6">
              {/* Colosseum Visual */}
              <div className="bg-black/30 p-4 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">🏛️</div>
                  <p className="text-yellow-400 text-sm">The Eternal City - 79 AD</p>
                </div>
                <p className="text-white text-lg leading-relaxed mb-4">
                  In the shadow of Mount Vesuvius, four legendary gladiators battle for the Emperor's greatest treasure.
                  Hidden within the volcanic ash are clues to unimaginable wealth - but only the cleverest will claim victory.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-red-900/30 p-3 rounded">
                    <p className="text-red-400 font-bold">🔴 Hunters</p>
                    <p className="text-gray-300">Aggressive scavengers who strike first</p>
                  </div>
                  <div className="bg-blue-900/30 p-3 rounded">
                    <p className="text-blue-400 font-bold">🔵 Guardians</p>
                    <p className="text-gray-300">Strategic defenders of their territory</p>
                  </div>
                  <div className="bg-green-900/30 p-3 rounded">
                    <p className="text-green-400 font-bold">🟢 Explorers</p>
                    <p className="text-gray-300">Nature-attuned seekers of hidden paths</p>
                  </div>
                  <div className="bg-yellow-900/30 p-3 rounded">
                    <p className="text-yellow-400 font-bold">🟡 Champions</p>
                    <p className="text-gray-300">Elite warriors who dominate the arena</p>
                  </div>
                </div>
              </div>

              {/* Stego Example */}
              <div className="bg-black/30 p-4 rounded-lg">
                <h3 className="text-white text-xl font-bold mb-3">🔍 Ancient Roman Steganography</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm">Original mosaic tile:</p>
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 w-20 h-20 rounded mx-auto flex items-center justify-center text-2xl">🏛️</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm">With hidden message (LSB):</p>
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 w-20 h-20 rounded mx-auto flex items-center justify-center text-2xl relative">
                      🏛️
                      <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                        <span className="text-xs text-white font-bold">SECRET</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-yellow-400 text-sm mt-3 text-center">
                  "Just as Roman spies hid messages in mosaic patterns, you hide clues in digital pixels"
                </p>
              </div>
            </div>
          )}

          {activeTab === 'howto' && (
            <div className="space-y-6">
              <div className="bg-black/30 p-4 rounded-lg">
                <h3 className="text-white text-xl font-bold mb-4">🎯 Core Mechanics</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                      <h4 className="text-white font-bold">Choose Your Faction</h4>
                      <p className="text-gray-300 text-sm">Join Hunters, Guardians, Explorers, or Champions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">2️⃣</span>
                    <div>
                      <h4 className="text-white font-bold">Embed Clues</h4>
                      <p className="text-gray-300 text-sm">Use LSB steganography to hide messages in images, mint as NFTs</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">3️⃣</span>
                    <div>
                      <h4 className="text-white font-bold">Strategic Warfare</h4>
                      <p className="text-gray-300 text-sm">Pay ETH to reveal others' clues or block incoming reveals</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">4️⃣</span>
                    <div>
                      <h4 className="text-white font-bold">Social Combat</h4>
                      <p className="text-gray-300 text-sm">Use Nostr for faction chat, Zaps for tipping, decentralized leaderboards</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg">
                <h3 className="text-white text-xl font-bold mb-4">🔬 LSB Steganography Tech</h3>
                <div className="bg-gray-900/50 p-3 rounded font-mono text-sm text-green-400 mb-3">
                  <p>// Example: Hiding "SECRET" in pixel RGB values</p>
                  <p>Original: (255, 128, 64)</p>
                  <p>Modified: (254, 129, 65) // LSB changed</p>
                  <p>Human eye sees: ~0.1% difference</p>
                </div>
                <p className="text-gray-300 text-sm">
                  Least Significant Bit steganography modifies the lowest bit of each color channel,
                  creating imperceptible changes that carry your hidden messages.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'economy' && (
            <div className="space-y-6">
              <div className="bg-black/30 p-4 rounded-lg">
                <h3 className="text-white text-xl font-bold mb-4">💰 Economic Engine</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{totalSolved}</div>
                    <div className="text-sm text-gray-300">Total Clues Solved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{(Number(totalPots) / 1e18).toFixed(3)}</div>
                    <div className="text-sm text-gray-300">ETH in Faction Pots</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {factionScores.map((faction, index) => (
                    <div key={faction.name} className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span className="text-white">{faction.name}</span>
                      <div className="text-right">
                        <div className="text-yellow-400 text-sm">{Number(faction.score)} solved</div>
                        <div className="text-green-400 text-xs">{(Number(faction.pot) / 1e18).toFixed(3)} ETH</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg">
                <h3 className="text-white text-xl font-bold mb-4">📈 Pot Growth Visualization</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Reveal Fees (60%)</span>
                    <span className="text-green-400">→ Faction Pots</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{width: '60%'}}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Block Fees (30%)</span>
                    <span className="text-blue-400">→ Treasury</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{width: '30%'}}></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Steal Fees (10%)</span>
                    <span className="text-purple-400">→ Winner</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-purple-500 h-3 rounded-full" style={{width: '10%'}}></div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/30">
                <h4 className="text-yellow-400 font-bold mb-2">🎲 Dynamic Pricing</h4>
                <p className="text-gray-300 text-sm">
                  Fees increase every 50 solves across all factions, creating escalating tension
                  and ensuring the game remains competitive as more players join.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
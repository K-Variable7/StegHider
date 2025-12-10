'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import NFTGallery from './NFTGallery';
import FactionChat from './FactionChat';
import NostrFeed from './NostrFeed';
import LoreModal from './LoreModal';

const FACTIONS = [
  { id: 0, name: 'Red', color: 'bg-red-500', description: 'Aggressive hunters' },
  { id: 1, name: 'Blue', color: 'bg-blue-500', description: 'Strategic thinkers' },
  { id: 2, name: 'Green', color: 'bg-green-500', description: 'Nature explorers' },
  { id: 3, name: 'Gold', color: 'bg-yellow-500', description: 'Elite champions' }
];

export default function SimpleFactionDashboard() {
  const { address, isConnected } = useAccount();
  const [selectedFaction, setSelectedFaction] = useState<number | null>(null);
  const [showLoreModal, setShowLoreModal] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">VaultWars</h1>
          <p className="text-gray-300">Please connect your wallet to enter the arena</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            ⚔️ VaultWars Arena
          </h1>
          <p className="text-gray-300 text-lg">
            Choose your faction and explore your NFT evolution
          </p>
        </div>

        {/* Faction Selection */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Choose Your Faction
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FACTIONS.map((faction) => (
              <button
                key={faction.id}
                onClick={() => setSelectedFaction(faction.id)}
                className={`p-6 rounded-xl text-white transition-all duration-300 transform hover:scale-105 border-2 ${
                  selectedFaction === faction.id
                    ? `${faction.color} ring-4 ring-white/50 scale-105 shadow-2xl border-white/50`
                    : `${faction.color} hover:shadow-2xl border-transparent hover:border-white/30`
                } backdrop-blur-sm`}
              >
                <h3 className="font-bold text-xl mb-2">{faction.name}</h3>
                <p className="text-sm opacity-90">{faction.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* NFT Evolution Gallery */}
        <NFTGallery />

        {/* Faction Chat */}
        <FactionChat factionId={selectedFaction || 0} />

        {/* Nostr Feed */}
        {selectedFaction !== null && (
          <NostrFeed 
            faction={FACTIONS[selectedFaction].name} 
            onBroadcastReady={() => {}}
          />
        )}

        {/* Lore Modal */}
        <LoreModal 
          isOpen={showLoreModal} 
          onClose={() => setShowLoreModal(false)}
          factionScores={[
            { name: 'Red', score: 0, pot: 0 },
            { name: 'Blue', score: 0, pot: 0 },
            { name: 'Green', score: 0, pot: 0 },
            { name: 'Gold', score: 0, pot: 0 }
          ]}
        />
      </div>
    </div>
  );
}

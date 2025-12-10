'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import FactionChat from '../../components/FactionChat';
import NostrFeed from '../../components/NostrFeed';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const FACTIONS = [
  { id: 0, name: 'Red', color: 'bg-red-500', description: 'Aggressive hunters' },
  { id: 1, name: 'Blue', color: 'bg-blue-500', description: 'Strategic thinkers' },
  { id: 2, name: 'Green', color: 'bg-green-500', description: 'Nature explorers' },
  { id: 3, name: 'Gold', color: 'bg-yellow-500', description: 'Elite champions' }
];

export default function WarRoomPage() {
  const { isConnected } = useAccount();
  const [selectedFaction, setSelectedFaction] = useState<number | null>(null);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">WarRoom Access Required</h1>
          <p className="text-gray-300 mb-8">Connect your wallet to access faction communications</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              🏰 WarRoom - Faction Command Center
            </h1>
            <p className="text-gray-300 text-lg">
              Coordinate with your faction and monitor the decentralized battlefield
            </p>
          </div>
          <nav className="flex space-x-6 ml-8">
            <a
              href="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Arena
            </a>
            <a
              href="/warroom"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
            >
              War Room
            </a>
            <a
              href="/analytics"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Analytics
            </a>
            <a
              href="/gallery"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Gallery
            </a>
          </nav>
        </div>

        {/* Faction Selection for WarRoom */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Select Your Faction
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

        {/* WarRoom Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Faction Chat */}
          <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              💬 Faction Chat
            </h2>
            <FactionChat factionId={selectedFaction || 0} />
          </div>

          {/* Nostr Feed */}
          <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              📡 Decentralized Feed
            </h2>
            {selectedFaction !== null && (
              <NostrFeed 
                faction={FACTIONS[selectedFaction].name} 
                onBroadcastReady={() => {}}
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-gray-500/50"
          >
            ← Back to Arena
          </a>
        </div>
      </div>
    </div>
  );
}

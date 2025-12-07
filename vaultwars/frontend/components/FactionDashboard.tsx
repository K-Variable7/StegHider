'use client';

import FactionChat from './FactionChat';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

// Mock contract ABI - replace with actual compiled ABI
const CLUE_NFT_ABI = [
  {
    "inputs": [],
    "name": "getFactionScore",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "getPlayerClues",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = "0x..."; // Replace with deployed contract address

const FACTIONS = [
  { id: 0, name: 'Red', color: 'bg-red-500', description: 'Aggressive hunters' },
  { id: 1, name: 'Blue', color: 'bg-blue-500', description: 'Strategic thinkers' },
  { id: 2, name: 'Green', color: 'bg-green-500', description: 'Nature explorers' },
  { id: 3, name: 'Gold', color: 'bg-yellow-500', description: 'Elite champions' }
];

export default function FactionDashboard() {
  const { address } = useAccount();
  const [selectedFaction, setSelectedFaction] = useState<number | null>(null);
  const [clues, setClues] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Read faction scores
  const { data: redScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [0]
  });

  const { data: blueScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [1]
  });

  const { data: greenScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [2]
  });

  const { data: goldScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [3]
  });

  // Read player clues
  const { data: playerClues } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getPlayerClues',
    args: [address]
  });

  useEffect(() => {
    if (playerClues) {
      setClues(playerClues as number[]);
    }
  }, [playerClues]);

  const revealClue = (clueId: number) => {
    // In real implementation, this would verify ownership and reveal the clue
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    alert(`Revealing clue ${clueId}... (This would decrypt and show the hidden message)`);
  };

  return (
    <div className="space-y-8">
      {showConfetti && <Confetti />}
      {/* Faction Selection */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Choose Your Faction</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FACTIONS.map((faction) => (
            <button
              key={faction.id}
              onClick={() => setSelectedFaction(faction.id)}
              className={`p-4 rounded-lg text-white transition-all ${
                selectedFaction === faction.id
                  ? `${faction.color} ring-4 ring-white/50 scale-105`
                  : `${faction.color} hover:scale-105`
              }`}
            >
              <h3 className="font-bold text-lg">{faction.name}</h3>
              <p className="text-sm opacity-90">{faction.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Faction Leaderboard</h2>
          <div className="text-center">
            <p className="text-yellow-400 text-sm">Next Difficulty Increase</p>
            <p className="text-white font-bold text-lg">{solvesUntilNextDifficulty} solves</p>
          </div>
        </div>
        <div className="space-y-2">
          {factionScores
            .sort((a, b) => Number(b.score) - Number(a.score))
            .map((faction, index) => (
              <div key={faction.name} className="flex justify-between items-center p-3 bg-white/5 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">#{index + 1}</span>
                  <span className="font-bold text-white">{faction.name}</span>
                </div>
                <span className="text-xl font-bold text-yellow-400">{Number(faction.score)} pts</span>
              </div>
            ))}
        </div>
      </div>

      {/* Player Clues */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Your Clues</h2>
        {clues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clues.map((clueId) => (
              <div key={clueId} className="bg-white/5 p-4 rounded-lg">
                <h3 className="font-bold text-white">Clue #{clueId}</h3>
                <p className="text-gray-300 text-sm">Click to reveal hidden message</p>
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" onClick={() => revealClue(clueId)}>
                  Reveal Clue
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-300">No clues found. Join a hunt to get started!</p>
        )}
      </div>

      {/* Faction Chat Placeholder */}
      <FactionChat factionId={selectedFaction || 0} />
    </div>
  );
}
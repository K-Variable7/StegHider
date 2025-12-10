'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x7fE9313c7e65A0c8Db47F9Fbb825Bab10bbbd1f4"; // DynamicClueNFT on Base Sepolia

const FACTIONS = [
  { id: 0, name: 'Red', color: '#DC143C', bgColor: 'bg-red-500' },
  { id: 1, name: 'Blue', color: '#4169E1', bgColor: 'bg-blue-500' },
  { id: 2, name: 'Green', color: '#228B22', bgColor: 'bg-green-500' },
  { id: 3, name: 'Gold', color: '#FFD700', bgColor: 'bg-yellow-500' }
];

interface EvolutionState {
  level: number;
  experience: number;
  cluesCollected: number;
  revealsSurvived: number;
  stealsSuccessful: number;
  lastEvolution: number;
}

interface LeaderboardEntry {
  address: string;
  score: number;
}

export default function NFTGallery() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState<string>('0');
  const [svgData, setSvgData] = useState<string>('');
  const [evolution, setEvolution] = useState<EvolutionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [leaderboardType, setLeaderboardType] = useState<'hoarders' | 'survivors' | 'stealers'>('hoarders');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  // Leaderboard queries
  const { data: hoardersData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getTopHoarders',
    args: [10],
  });

  const { data: survivorsData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getTopRevealSurvivors',
    args: [10],
  });

  const { data: stealersData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getTopStealers',
    args: [10],
  });

  // Get evolution state
  const { data: nftEvolutionData, refetch: refetchNftEvolution } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getEvolutionState',
    args: tokenId ? [BigInt(tokenId)] : undefined,
  });

  // Get SVG data
  const { data: nftSvgResult, refetch: refetchNftSvg } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'generateSVG',
    args: tokenId ? [BigInt(tokenId)] : undefined,
  });

  useEffect(() => {
    if (nftEvolutionData) {
      setEvolution({
        level: Number(nftEvolutionData[0]),
        experience: Number(nftEvolutionData[1]),
        cluesCollected: Number(nftEvolutionData[2]),
        revealsSurvived: Number(nftEvolutionData[3]),
        stealsSuccessful: Number(nftEvolutionData[4]),
        lastEvolution: Number(nftEvolutionData[5]),
      });
    }
  }, [nftEvolutionData]);

  useEffect(() => {
    if (nftSvgResult) {
      setSvgData(nftSvgResult as string);
    }
  }, [nftSvgResult]);

  // Process leaderboard data
  useEffect(() => {
    let data: any;
    switch (leaderboardType) {
      case 'hoarders':
        data = hoardersData;
        break;
      case 'survivors':
        data = survivorsData;
        break;
      case 'stealers':
        data = stealersData;
        break;
    }

    if (data && Array.isArray(data[0]) && Array.isArray(data[1])) {
      const addresses = data[0] as string[];
      const scores = data[1] as bigint[];
      const entries: LeaderboardEntry[] = addresses.map((addr, i) => ({
        address: addr,
        score: Number(scores[i])
      }));
      setLeaderboardData(entries);
    }
  }, [hoardersData, survivorsData, stealersData, leaderboardType]);

  const loadNFT = async () => {
    if (!tokenId) return;

    setIsLoading(true);
    setError('');

    try {
      await Promise.all([refetchNftEvolution(), refetchNftSvg()]);
    } catch (err) {
      setError('Failed to load NFT data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFactionInfo = (level: number) => {
    // For cosmic NFTs, we can determine faction from the SVG data
    if (level >= 10 && svgData) {
      if (svgData.includes('fill="#DC143C"')) return FACTIONS[0]; // Red
      if (svgData.includes('fill="#4169E1"')) return FACTIONS[1]; // Blue
      if (svgData.includes('fill="#228B22"')) return FACTIONS[2]; // Green
      if (svgData.includes('fill="#FFD700"')) return FACTIONS[3]; // Gold
    }
    return null;
  };

  const isCosmic = evolution && evolution.level >= 10;

  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
        🖼️ NFT Evolution Gallery
        {isCosmic && <span className="ml-2 text-yellow-400">🌌 COSMIC</span>}
      </h2>

      {/* Token ID Input - Mobile optimized */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Token ID
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter token ID (e.g., 0)"
          />
          <button
            onClick={loadNFT}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load NFT'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-md text-red-200">
          {error}
        </div>
      )}

      {/* NFT Display */}
      {svgData && (
        <div className="space-y-6">
          {/* SVG Art */}
          <div className={`relative rounded-lg overflow-hidden border-2 ${
            isCosmic ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border-gray-600'
          }`}>
            {isCosmic && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold z-10">
                🌌 COSMIC
              </div>
            )}
            <div
              className="w-full h-96 flex items-center justify-center bg-gray-800"
              dangerouslySetInnerHTML={{ __html: svgData }}
            />
          </div>

          {/* Evolution Stats */}
          {evolution && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Level & Experience */}
              <div className={`p-4 rounded-lg border ${
                isCosmic ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-gray-800 border-gray-600'
              }`}>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  📊 Evolution Stats
                  {isCosmic && <span className="ml-2 text-yellow-400">✨</span>}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Level:</span>
                    <span className={`font-bold ${isCosmic ? 'text-yellow-400' : 'text-white'}`}>
                      {evolution.level}
                      {isCosmic && ' 🌌'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Experience:</span>
                    <span className="text-white font-mono">{evolution.experience.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Clues Collected:</span>
                    <span className="text-green-400">{evolution.cluesCollected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reveals Survived:</span>
                    <span className="text-blue-400">{evolution.revealsSurvived}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Steals Successful:</span>
                    <span className="text-purple-400">{evolution.stealsSuccessful}</span>
                  </div>
                </div>
              </div>

              {/* Faction & Cosmic Info */}
              <div className={`p-4 rounded-lg border ${
                isCosmic ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-gray-800 border-gray-600'
              }`}>
                <h3 className="text-lg font-semibold text-white mb-3">
                  ⚔️ Faction & Status
                </h3>
                <div className="space-y-3">
                  {getFactionInfo(evolution.level) && (
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full ${getFactionInfo(evolution.level)?.bgColor}`}
                      />
                      <span className="text-white">
                        {getFactionInfo(evolution.level)?.name} Faction
                        {isCosmic && ' Nebula'}
                      </span>
                    </div>
                  )}

                  {isCosmic && (
                    <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-md">
                      <div className="flex items-center text-yellow-400 font-semibold mb-1">
                        🌌 COSMIC EVOLUTION ACHIEVED
                      </div>
                      <p className="text-yellow-200 text-sm">
                        This NFT has transcended to cosmic form, representing the ultimate achievement in VaultWars!
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Last evolved: {new Date(evolution.lastEvolution * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cosmic Features Highlight */}
          {isCosmic && (
            <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                ✨ Cosmic Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-gray-300">Starry Background</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">🌫️</span>
                  <span className="text-gray-300">Faction Nebula</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">✨</span>
                  <span className="text-gray-300">Energy Glow Effects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400">🏛️</span>
                  <span className="text-gray-300">Floating Golden Arches</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboards Section */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          🏆 VaultWars Leaderboards
        </h3>
        
        {/* Leaderboard Type Selector */}
        <div className="flex space-x-2 mb-4">
          {[
            { key: 'hoarders', label: 'Top Hoarders', icon: '💰' },
            { key: 'survivors', label: 'Reveal Survivors', icon: '🛡️' },
            { key: 'stealers', label: 'Master Stealers', icon: '🗡️' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setLeaderboardType(key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                leaderboardType === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((entry, index) => (
                    <tr key={entry.address} className={entry.address.toLowerCase() === address?.toLowerCase() ? 'bg-blue-900/20' : ''}>
                      <td className="px-4 py-3 text-sm text-white">
                        #{index + 1}
                        {index === 0 && ' 🥇'}
                        {index === 1 && ' 🥈'}
                        {index === 2 && ' 🥉'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        {entry.address.toLowerCase() === address?.toLowerCase() && (
                          <span className="ml-2 text-blue-400">(You)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-semibold">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {entry.address.toLowerCase() === address?.toLowerCase() ? (
                          <span className="text-blue-400">Your Rank</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      Loading leaderboard data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaderboard Description */}
        <div className="mt-4 text-sm text-gray-400">
          {leaderboardType === 'hoarders' && (
            <>💰 Top Hoarders are ranked by clues collected × 10 + level × 5. The ultimate collectors!</>
          )}
          {leaderboardType === 'survivors' && (
            <>🛡️ Reveal Survivors are ranked by how many reveal attempts they've withstood. True defenders!</>
          )}
          {leaderboardType === 'stealers' && (
            <>🗡️ Master Stealers are ranked by successful thefts. The bold raiders of VaultWars!</>
          )}
        </div>
      </div>

      {!svgData && !isLoading && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🖼️</div>
          <p>Enter a token ID and click "Load NFT" to view your evolving colosseum!</p>
        </div>
      )}
    </div>
  );
}
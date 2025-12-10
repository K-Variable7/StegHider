import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x9AaD4AC1113A3ecb6FBacB0212bD01422Cf8eb6f";

export default function Leaderboard() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('tournaments');

  // Read leaderboard data
  const { data: tournamentLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getTournamentLeaderboard'
  });

  const { data: referralLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getReferralLeaderboard'
  });

  const { data: playerStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getPlayerStats',
    args: [address]
  });

  const { data: globalStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getGlobalStats'
  });

  const tabs = [
    { id: 'tournaments', label: '🏆 Tournaments', data: tournamentLeaderboard },
    { id: 'referrals', label: '👥 Referrals', data: referralLeaderboard },
    { id: 'challenges', label: '🧩 Challenges', data: [] }, // Would need to implement this in contract
    { id: 'trading', label: '💰 Trading', data: [] } // Would need to implement this in contract
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const formatAddress = (addr) => {
    return `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'eth':
        return `${(Number(value) / 1e18).toFixed(4)} ETH`;
      case 'count':
        return value?.toString() || '0';
      case 'percentage':
        return `${value}%`;
      default:
        return value?.toString() || '0';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
        🏆 VaultWars Leaderboard
      </h1>

      {/* Global Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">🎮</div>
          <h3 className="text-lg font-bold mb-1">Total Players</h3>
          <p className="text-2xl text-blue-400">{(globalStats as any)?.totalPlayers?.toString() || '0'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-bold mb-1">Tournaments</h3>
          <p className="text-2xl text-green-400">{(globalStats as any)?.totalTournaments?.toString() || '0'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">💰</div>
          <h3 className="text-lg font-bold mb-1">Total Volume</h3>
          <p className="text-2xl text-purple-400">{globalStats ? (Number((globalStats as any).totalVolume) / 1e18).toFixed(2) : '0.00'} ETH</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">🎴</div>
          <h3 className="text-lg font-bold mb-1">NFTs Minted</h3>
          <p className="text-2xl text-yellow-400">{(globalStats as any)?.totalNFTs?.toString() || '0'}</p>
        </div>
      </div>

      {/* Your Stats */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">📊 Your Stats</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-sm text-gray-400">Tournament Wins</p>
            <p className="font-bold text-green-400">{(playerStats as any)?.tournamentWins?.toString() || '0'}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">👥</div>
            <p className="text-sm text-gray-400">Referrals</p>
            <p className="font-bold text-blue-400">{(playerStats as any)?.referralCount?.toString() || '0'}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🧩</div>
            <p className="text-sm text-gray-400">Challenges Solved</p>
            <p className="font-bold text-purple-400">{(playerStats as any)?.challengesSolved?.toString() || '0'}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-sm text-gray-400">Total Earned</p>
            <p className="font-bold text-yellow-400">{playerStats ? (Number((playerStats as any).totalEarned) / 1e18).toFixed(3) : '0.000'} ETH</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">📈</div>
            <p className="text-sm text-gray-400">Your Rank</p>
            <p className="font-bold text-orange-400">#{(playerStats as any)?.globalRank?.toString() || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-600">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-center font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'tournaments' && (
            <div>
              <h3 className="text-xl font-bold mb-4">🏆 Tournament Champions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4">Rank</th>
                      <th className="text-left py-3 px-4">Player</th>
                      <th className="text-left py-3 px-4">Wins</th>
                      <th className="text-left py-3 px-4">Total Earned</th>
                      <th className="text-left py-3 px-4">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentLeaderboard && (tournamentLeaderboard as any).length > 0 ? (
                      (tournamentLeaderboard as any).map((player, index) => (
                        <tr key={index} className={`border-b border-gray-700 ${player.address === address ? 'bg-indigo-900/30' : ''}`}>
                          <td className="py-3 px-4">
                            <span className="text-2xl">{getRankIcon(index + 1)}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">
                            {formatAddress(player.address)}
                            {player.address === address && <span className="ml-2 text-indigo-400">(You)</span>}
                          </td>
                          <td className="py-3 px-4 font-bold">{player.wins?.toString() || '0'}</td>
                          <td className="py-3 px-4 text-green-400">{formatValue(player.totalEarned, 'eth')}</td>
                          <td className="py-3 px-4">{player.winRate?.toString() || '0'}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          <div className="text-4xl mb-2">🏆</div>
                          <p>No tournament data yet</p>
                          <p className="text-sm mt-2">Be the first to compete!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div>
              <h3 className="text-xl font-bold mb-4">👥 Top Referrers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4">Rank</th>
                      <th className="text-left py-3 px-4">Player</th>
                      <th className="text-left py-3 px-4">Referrals</th>
                      <th className="text-left py-3 px-4">Commission Earned</th>
                      <th className="text-left py-3 px-4">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralLeaderboard && (referralLeaderboard as any).length > 0 ? (
                      (referralLeaderboard as any).map((player, index) => (
                        <tr key={index} className={`border-b border-gray-700 ${player.address === address ? 'bg-indigo-900/30' : ''}`}>
                          <td className="py-3 px-4">
                            <span className="text-2xl">{getRankIcon(index + 1)}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">
                            {formatAddress(player.address)}
                            {player.address === address && <span className="ml-2 text-indigo-400">(You)</span>}
                          </td>
                          <td className="py-3 px-4 font-bold">{player.referralCount?.toString() || '0'}</td>
                          <td className="py-3 px-4 text-green-400">{formatValue(player.totalCommission, 'eth')}</td>
                          <td className="py-3 px-4">{player.successRate?.toString() || '0'}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          <div className="text-4xl mb-2">👥</div>
                          <p>No referral data yet</p>
                          <p className="text-sm mt-2">Start referring friends!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div>
              <h3 className="text-xl font-bold mb-4">🧩 Challenge Masters</h3>
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">🧩</div>
                <p className="text-lg">Challenge leaderboard coming soon!</p>
                <p className="text-sm mt-2">Complete daily challenges to climb the ranks</p>
              </div>
            </div>
          )}

          {activeTab === 'trading' && (
            <div>
              <h3 className="text-xl font-bold mb-4">💰 Trading Champions</h3>
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">💰</div>
                <p className="text-lg">Trading leaderboard coming soon!</p>
                <p className="text-sm mt-2">Top traders will be showcased here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-gray-800 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold mb-4">🏅 Achievement Badges</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="text-center bg-gray-700 p-4 rounded-lg">
            <div className="text-3xl mb-2">🥇</div>
            <h3 className="font-bold">Tournament Champion</h3>
            <p className="text-sm text-gray-400">Win 10 tournaments</p>
          </div>
          <div className="text-center bg-gray-700 p-4 rounded-lg">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold">Network Builder</h3>
            <p className="text-sm text-gray-400">Refer 50 players</p>
          </div>
          <div className="text-center bg-gray-700 p-4 rounded-lg">
            <div className="text-3xl mb-2">🧩</div>
            <h3 className="font-bold">Puzzle Master</h3>
            <p className="text-sm text-gray-400">Solve 100 challenges</p>
          </div>
          <div className="text-center bg-gray-700 p-4 rounded-lg">
            <div className="text-3xl mb-2">💎</div>
            <h3 className="font-bold">Collector</h3>
            <p className="text-sm text-gray-400">Own 25 unique NFTs</p>
          </div>
          <div className="text-center bg-gray-700 p-4 rounded-lg">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold">Legend</h3>
            <p className="text-sm text-gray-400">Reach top 10 in all categories</p>
          </div>
        </div>
      </div>
    </div>
  );
}
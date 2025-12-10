import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x9AaD4AC1113A3ecb6FBacB0212bD01422Cf8eb6f";

export default function SeasonalEvents() {
  const { address } = useAccount();

  // Read seasonal event data
  const { data: activeEvent, refetch: refetchActiveEvent } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getActiveEvent'
  });

  const { data: userParticipation, refetch: refetchParticipation } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getEventParticipation',
    args: (activeEvent as any)?.id ? [(activeEvent as any).id, address] : undefined
  });

  // Write functions
  const { writeContract: claimEventReward } = useWriteContract();

  // Watch for event-related events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'TournamentJoined',
    onLogs: () => refetchParticipation()
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'DailyChallengeSolved',
    onLogs: () => refetchParticipation()
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'NFTStaked',
    onLogs: () => refetchParticipation()
  });

  const handleClaimReward = () => {
    if (!(activeEvent as any)?.id) return;
    claimEventReward({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'claimEventReward',
      args: [(activeEvent as any).id],
      chain: baseSepolia,
      account: address
    });
  };

  const getTimeRemaining = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(endTime) - now;

    if (remaining <= 0) return "Event Ended";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getEventThemeEmoji = (theme) => {
    const themes = {
      "Winter Wonderland": "❄️",
      "Summer Championship": "☀️",
      "Halloween Horror": "🎃",
      "Spring Festival": "🌸",
      "Autumn Quest": "🍂",
      "New Year Blast": "🎆"
    };
    return themes[theme] || "🎉";
  };

  const calculateProgress = (participation) => {
    if (!participation) return 0;
    const activities = [
      participation.tournamentsJoined,
      participation.challengesCompleted,
      participation.nftsStaked
    ];
    const total = activities.reduce((sum, val) => sum + Number(val), 0);
    return Math.min(total * 10, 100); // Cap at 100%
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
        🎉 Seasonal Events
      </h1>

      {/* Active Event Display */}
      {(activeEvent as any) && (activeEvent as any).active ? (
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{getEventThemeEmoji((activeEvent as any).theme)}</div>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {(activeEvent as any).name}
            </h2>
            <p className="text-xl text-purple-300 mb-4">{(activeEvent as any).theme}</p>
            <div className="inline-flex items-center bg-red-900/50 border border-red-500/50 rounded-full px-4 py-2">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse mr-2"></div>
              <span className="font-bold text-red-300">{getTimeRemaining((activeEvent as any).endTime)}</span>
            </div>
          </div>

          {/* Event Bonuses */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-bold mb-1">Tournament Bonus</h3>
              <p className="text-2xl text-green-400">{(activeEvent as any).tournamentMultiplier / 100}x</p>
              <p className="text-sm text-gray-400">Rewards Multiplier</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🧩</div>
              <h3 className="font-bold mb-1">Challenge Bonus</h3>
              <p className="text-2xl text-blue-400">{(activeEvent as any).challengeMultiplier / 100}x</p>
              <p className="text-sm text-gray-400">Rewards Multiplier</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-bold mb-1">Staking Bonus</h3>
              <p className="text-2xl text-yellow-400">{(activeEvent as any).stakingMultiplier / 100}x</p>
              <p className="text-sm text-gray-400">Rewards Multiplier</p>
            </div>
          </div>

          {/* User Participation Progress */}
          {userParticipation && (
            <div className="bg-gray-800/30 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-center">📊 Your Event Progress</h3>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Event Participation</span>
                  <span>{calculateProgress(userParticipation)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgress(userParticipation)}%` }}
                  ></div>
                </div>
              </div>

              {/* Participation Stats */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl mb-1">🏆</div>
                  <p className="text-sm text-gray-400">Tournaments Joined</p>
                  <p className="text-xl font-bold text-green-400">{(userParticipation as any).tournamentsJoined?.toString() || '0'}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🧩</div>
                  <p className="text-sm text-gray-400">Challenges Completed</p>
                  <p className="text-xl font-bold text-blue-400">{(userParticipation as any).challengesCompleted?.toString() || '0'}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <p className="text-sm text-gray-400">NFTs Staked</p>
                  <p className="text-xl font-bold text-yellow-400">{(userParticipation as any).nftsStaked?.toString() || '0'}</p>
                </div>
              </div>

              {/* Reward Claiming */}
              {(userParticipation as any).totalBonusEarned && Number((userParticipation as any).totalBonusEarned) > 0 && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-green-400 mb-1">🎁 Event Rewards Available!</h4>
                      <p className="text-green-300">
                        {(Number((userParticipation as any).totalBonusEarned) / 1e18).toFixed(4)} ETH bonus earned
                      </p>
                    </div>
                    <button
                      onClick={handleClaimReward}
                      disabled={(userParticipation as any).claimedReward}
                      className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 ${
                        (userParticipation as any).claimedReward
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-500 hover:to-teal-500'
                      }`}
                    >
                      {(userParticipation as any).claimedReward ? '✅ Claimed' : '💰 Claim Reward'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special NFTs Progress */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold">🎨 Special Event NFTs</h4>
              <span className="text-sm text-gray-400">
                {(activeEvent as any).specialNFTsMinted?.toString() || '0'} / {(activeEvent as any).maxSpecialNFTs?.toString() || '0'} minted
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                style={{
                  width: `${(activeEvent as any).maxSpecialNFTs ?
                    (Number((activeEvent as any).specialNFTsMinted) / Number((activeEvent as any).maxSpecialNFTs)) * 100 : 0}%`
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Limited edition NFTs available during this event!
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-8xl mb-6">🎪</div>
          <h2 className="text-3xl font-bold mb-4">No Active Seasonal Event</h2>
          <p className="text-xl text-gray-400 mb-8">
            Seasonal events bring special bonuses, limited NFTs, and exciting rewards!
          </p>
          <div className="bg-gray-800/50 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-bold mb-3">🎯 What to Expect:</h3>
            <ul className="text-left space-y-2 text-gray-300">
              <li>• <span className="text-green-400">2x tournament rewards</span></li>
              <li>• <span className="text-blue-400">1.5x challenge bonuses</span></li>
              <li>• <span className="text-yellow-400">1.2x staking rewards</span></li>
              <li>• <span className="text-purple-400">Limited edition NFTs</span></li>
              <li>• <span className="text-pink-400">Exclusive achievements</span></li>
            </ul>
          </div>
        </div>
      )}

      {/* Event History/Upcoming Events */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">📅 Event Calendar</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample upcoming events - in real app, fetch from contract */}
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="text-center">
              <div className="text-3xl mb-2">❄️</div>
              <h3 className="font-bold mb-1">Winter Wonderland</h3>
              <p className="text-sm text-gray-400 mb-2">December 2025</p>
              <div className="text-xs text-gray-500">Coming Soon</div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="text-center">
              <div className="text-3xl mb-2">☀️</div>
              <h3 className="font-bold mb-1">Summer Championship</h3>
              <p className="text-sm text-gray-400 mb-2">June 2025</p>
              <div className="text-xs text-gray-500">Coming Soon</div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="text-center">
              <div className="text-3xl mb-2">🎃</div>
              <h3 className="font-bold mb-1">Halloween Horror</h3>
              <p className="text-sm text-gray-400 mb-2">October 2025</p>
              <div className="text-xs text-gray-500">Coming Soon</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400">
            🎪 Events are announced on our social channels. Follow for updates!
          </p>
        </div>
      </div>
    </div>
  );
}
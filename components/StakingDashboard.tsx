import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x7fE9313c7e65A0c8Db47F9Fbb825Bab10bbbd1f4";

export default function StakingDashboard() {
  const { address } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [stakingDuration, setStakingDuration] = useState(7);

  // Read staking data
  const { data: userClues } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getPlayerClues',
    args: [address]
  });

  const { data: userStakes, refetch: refetchStakes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getUserStakes',
    args: [address]
  });

  // Get stake details for each user stake
  const stakeDetails = (userStakes as any)?.map(tokenId => {
    const { data: stake } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'stakes',
      args: [tokenId]
    });
    return { tokenId, stake };
  });

  // Write functions
  const { writeContract: stakeNFT } = useWriteContract();
  const { writeContract: unstakeNFT } = useWriteContract();

  // Watch for staking events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'NFTStaked',
    onLogs: () => refetchStakes()
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'NFTUnstaked',
    onLogs: () => refetchStakes()
  });

  const handleStakeNFT = () => {
    if (!selectedTokenId) return;

    stakeNFT({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'stakeNFT',
      args: [selectedTokenId, stakingDuration],
      chain: baseSepolia,
      account: address
    });
  };

  const handleUnstakeNFT = (tokenId) => {
    unstakeNFT({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'unstakeNFT',
      args: [tokenId],
      chain: baseSepolia,
      account: address
    });
  };

  const calculateReward = (duration) => {
    return (10 * duration / 100).toFixed(3); // 10% bonus per day
  };

  const isStaked = (tokenId) => {
    return (userStakes as any)?.includes(tokenId);
  };

  const getStakeInfo = (tokenId) => {
    return stakeDetails?.find(s => s.tokenId === tokenId)?.stake;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        🔒 NFT Staking Vault
      </h1>

      {/* Staking Interface */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">⚡ Stake Your NFTs</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <select
            value={selectedTokenId}
            onChange={(e) => setSelectedTokenId(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          >
            <option value="">Select NFT to Stake</option>
            {(userClues as any)?.filter(tokenId => !isStaked(tokenId)).map((tokenId) => (
              <option key={tokenId} value={tokenId}>
                Clue NFT #{tokenId}
              </option>
            ))}
          </select>

          <select
            value={stakingDuration}
            onChange={(e) => setStakingDuration(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          >
            <option value={7}>7 Days (70% bonus)</option>
            <option value={14}>14 Days (140% bonus)</option>
            <option value={30}>30 Days (300% bonus)</option>
            <option value={60}>60 Days (600% bonus)</option>
            <option value={90}>90 Days (900% bonus)</option>
          </select>

          <button
            onClick={handleStakeNFT}
            disabled={!selectedTokenId}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-bold disabled:opacity-50"
          >
            🔒 Stake NFT
          </button>
        </div>

        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg">
          <h3 className="font-bold mb-2">📈 Staking Rewards</h3>
          <p className="text-indigo-300">
            Earn <span className="font-bold text-yellow-400">{calculateReward(stakingDuration)} ETH</span> bonus
            on all future transactions with this NFT after {stakingDuration} days!
          </p>
        </div>
      </div>

      {/* Your Stakes */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">🛡️ Your Active Stakes</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(userStakes as any) && (userStakes as any).length > 0 ? (
            (userStakes as any).map((tokenId) => {
              const stake = getStakeInfo(tokenId);
              if (!stake) return null;

              const stakedAt = new Date(Number(stake.stakedAt) * 1000);
              const unlockTime = new Date((Number(stake.stakedAt) + Number(stake.duration)) * 1000);
              const now = new Date();
              const canUnstake = now >= unlockTime;

              return (
                <div key={tokenId} className="bg-gray-700 p-4 rounded-lg border border-indigo-500/30">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🛡️</div>
                    <h3 className="font-bold">Clue NFT #{tokenId}</h3>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-300">
                      Staked: {stakedAt.toLocaleDateString()}
                    </p>
                    <p className="text-gray-300">
                      Duration: {Number(stake.duration) / 86400} days
                    </p>
                    <p className="text-yellow-400 font-bold">
                      Reward: {calculateReward(Number(stake.duration) / 86400)} ETH
                    </p>
                    <p className={`font-bold ${canUnstake ? 'text-green-400' : 'text-red-400'}`}>
                      {canUnstake ? '✅ Ready to Unstake' : `⏳ Unlocks: ${unlockTime.toLocaleDateString()}`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleUnstakeNFT(tokenId)}
                    disabled={!canUnstake}
                    className={`w-full py-2 px-4 rounded transition-all duration-300 font-bold ${
                      canUnstake
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-500 hover:to-teal-500'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canUnstake ? '🔓 Unstake & Claim' : 'Locked'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-400 py-12">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-lg">No active stakes</p>
              <p className="text-sm mt-2">Stake your NFTs to earn rewards!</p>
            </div>
          )}
        </div>
      </div>

      {/* Available NFTs */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">🎴 Available NFTs</h2>
        <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(userClues as any)?.filter(tokenId => !isStaked(tokenId)).map((tokenId) => (
            <div
              key={tokenId}
              onClick={() => setSelectedTokenId(tokenId)}
              className={`bg-gray-700 p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                selectedTokenId === tokenId
                  ? 'border-indigo-400 bg-indigo-400/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🎴</div>
                <p className="text-sm font-bold">#{tokenId}</p>
                <p className="text-xs text-gray-400">Available</p>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center text-gray-400 py-8">
              <p>All your NFTs are staked!</p>
            </div>
          )}
        </div>
      </div>

      {/* Staking Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">🛡️</div>
          <h3 className="text-lg font-bold mb-1">Active Stakes</h3>
          <p className="text-2xl text-indigo-400">{(userStakes as any)?.length || 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">💎</div>
          <h3 className="text-lg font-bold mb-1">Total NFTs</h3>
          <p className="text-2xl text-purple-400">{(userClues as any)?.length || 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">💰</div>
          <h3 className="text-lg font-bold mb-1">Total Rewards</h3>
          <p className="text-2xl text-green-400">
            {(userStakes as any) ? ((userStakes as any).length * 0.07).toFixed(3) : '0.000'} ETH
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-bold mb-1">Avg. APY</h3>
          <p className="text-2xl text-yellow-400">1,000%</p>
        </div>
      </div>

      {/* Staking Benefits */}
      <div className="bg-gray-800 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold mb-4">🎁 Staking Benefits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="font-bold mb-1">Transaction Bonuses</h3>
            <p className="text-sm text-gray-300">Earn percentage bonuses on all future reveal and block transactions</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="font-bold mb-1">Faction Power</h3>
            <p className="text-sm text-gray-300">Increase your faction influence and unlock exclusive perks</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-bold mb-1">Evolution Boost</h3>
            <p className="text-sm text-gray-300">Accelerate NFT evolution and unlock rare traits faster</p>
          </div>
        </div>
      </div>
    </div>
  );
}
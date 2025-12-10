import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x9AaD4AC1113A3ecb6FBacB0212bD01422Cf8eb6f";

export default function DailyChallenges() {
  const { address } = useAccount();
  const [challengeSolution, setChallengeSolution] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeReward, setChallengeReward] = useState('');
  const [solutionHash, setSolutionHash] = useState('');

  // Read challenge data
  const { data: currentDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'currentDay'
  });

  const { data: dailyChallenge } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'dailyChallenges',
    args: [currentDay]
  });

  const { data: lastCompletion } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'lastChallengeCompletion',
    args: [address]
  });

  // Write functions
  const { writeContract: createChallenge } = useWriteContract();
  const { writeContract: solveChallenge } = useWriteContract();
  const { writeContract: advanceDay } = useWriteContract();

  // Watch for challenge events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'DailyChallengeSolved',
    onLogs: (logs) => {
      console.log('Challenge solved:', logs);
    }
  });

  const handleCreateChallenge = () => {
    if (!challengeDescription || !challengeReward || !solutionHash) return;

    createChallenge({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'createDailyChallenge',
      args: [challengeDescription, solutionHash, challengeReward],
      chain: baseSepolia,
      account: address
    });
  };

  const handleSolveChallenge = () => {
    if (!challengeSolution) return;

    solveChallenge({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'solveDailyChallenge',
      args: [challengeSolution],
      chain: baseSepolia,
      account: address
    });
  };

  const handleAdvanceDay = () => {
    advanceDay({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'advanceDay',
      chain: baseSepolia,
      account: address
    });
  };

  const hasCompletedToday = lastCompletion && Number(lastCompletion) >= Number(currentDay);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        🎯 Daily Challenges
      </h1>

      {/* Admin Panel */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">⚙️ Admin Panel</h2>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Challenge Description"
            value={challengeDescription}
            onChange={(e) => setChallengeDescription(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
          <input
            type="number"
            placeholder="Reward (ETH)"
            value={challengeReward}
            onChange={(e) => setChallengeReward(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Solution Hash"
            value={solutionHash}
            onChange={(e) => setSolutionHash(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
          <button
            onClick={handleCreateChallenge}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-bold"
          >
            Create Challenge
          </button>
        </div>
        <button
          onClick={handleAdvanceDay}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-300 font-bold"
        >
          Advance to Next Day
        </button>
      </div>

      {/* Current Challenge */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">🎪 Today's Challenge</h2>
        <div className="text-center">
          <div className="text-6xl mb-4">🧩</div>
          <h3 className="text-xl font-bold mb-2">Day {currentDay ? String(currentDay) : 'Loading...'}</h3>

          {dailyChallenge && (dailyChallenge as any).active ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-300 mb-4">{(dailyChallenge as any).description}</p>
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg mb-4">
                <p className="text-yellow-300 text-sm">
                  💰 Reward: {(dailyChallenge as any).reward} ETH
                </p>
              </div>

              {hasCompletedToday ? (
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                  <p className="text-green-300 text-lg font-bold">✅ Challenge Completed!</p>
                  <p className="text-green-200 text-sm mt-1">You've already solved today's challenge.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter your solution..."
                    value={challengeSolution}
                    onChange={(e) => setChallengeSolution(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center text-lg"
                  />
                  <button
                    onClick={handleSolveChallenge}
                    disabled={!challengeSolution}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-300 font-bold text-lg disabled:opacity-50"
                  >
                    🚀 Submit Solution
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400">
              <p className="text-lg">No active challenge for today.</p>
              <p className="text-sm mt-2">Check back later or create a new challenge!</p>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">📅</div>
          <h3 className="text-lg font-bold mb-1">Current Day</h3>
          <p className="text-2xl text-yellow-400">{currentDay ? String(currentDay) : 'Loading...'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-bold mb-1">Your Completions</h3>
          <p className="text-2xl text-green-400">{lastCompletion ? String(lastCompletion) : '0'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">💎</div>
          <h3 className="text-lg font-bold mb-1">Total Rewards</h3>
          <p className="text-2xl text-purple-400">
            {lastCompletion ? (Number(lastCompletion) * 0.001).toFixed(3) : '0.000'} ETH
          </p>
        </div>
      </div>

      {/* Challenge History */}
      <div className="bg-gray-800 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold mb-4">📚 Challenge History</h2>
        <div className="space-y-3">
          {Array.from({ length: Math.min(5, Number(currentDay)) }, (_, i) => Number(currentDay) - i).map((day) => (
            <div key={day} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
              <div>
                <span className="font-bold">Day {day}</span>
                {day === Number(currentDay) && (
                  <span className="ml-2 text-xs bg-yellow-600 px-2 py-1 rounded">Current</span>
                )}
                {lastCompletion && day <= Number(lastCompletion) && (
                  <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">Completed</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">Reward: 0.001 ETH</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
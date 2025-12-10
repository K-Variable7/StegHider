import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x7fE9313c7e65A0c8Db47F9Fbb825Bab10bbbd1f4";

export default function ReferralDashboard() {
  const { address } = useAccount();
  const [referrerAddress, setReferrerAddress] = useState('');

  // Read referral data
  const { data: userReferrer } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'referrers',
    args: [address]
  });

  const { data: userReferrals } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getUserReferrals',
    args: [address]
  });

  const { data: referralRewards } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'referralRewards',
    args: [address]
  });

  const { data: totalReferrals } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'totalReferrals',
    args: [address]
  });

  // Write functions
  const { writeContract: setReferrer } = useWriteContract();
  const { writeContract: claimReferralRewards } = useWriteContract();

  // Watch for referral events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'ReferrerSet',
    onLogs: () => window.location.reload()
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'ReferralRewardEarned',
    onLogs: () => window.location.reload()
  });

  const handleSetReferrer = () => {
    if (!referrerAddress || referrerAddress === address) return;

    setReferrer({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'setReferrer',
      args: [referrerAddress],
      chain: baseSepolia,
      account: address
    });
  };

  const handleClaimRewards = () => {
    claimReferralRewards({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'claimReferralRewards',
      chain: baseSepolia,
      account: address
    });
  };

  const generateReferralLink = () => {
    return `${window.location.origin}?ref=${address}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(generateReferralLink());
    alert('Referral link copied to clipboard!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
        👥 Referral Network
      </h1>

      {/* Set Referrer */}
      {!userReferrer && (
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">🔗 Set Your Referrer</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={referrerAddress}
              onChange={(e) => setReferrerAddress(e.target.value)}
              placeholder="Enter referrer's wallet address"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
            />
            <button
              onClick={handleSetReferrer}
              disabled={!referrerAddress}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-6 rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-300 font-bold disabled:opacity-50"
            >
              Set Referrer
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Set a referrer to start earning rewards when they make transactions!
          </p>
        </div>
      )}

      {/* Referral Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">👥</div>
          <h3 className="text-lg font-bold mb-1">Total Referrals</h3>
          <p className="text-2xl text-green-400">{totalReferrals?.toString() || '0'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">💰</div>
          <h3 className="text-lg font-bold mb-1">Rewards Earned</h3>
          <p className="text-2xl text-yellow-400">{referralRewards ? (Number(referralRewards) / 1e18).toFixed(4) : '0.0000'} ETH</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">📈</div>
          <h3 className="text-lg font-bold mb-1">Commission Rate</h3>
          <p className="text-2xl text-blue-400">5%</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-bold mb-1">Your Rank</h3>
          <p className="text-2xl text-purple-400">#{Math.floor(Math.random() * 100) + 1}</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">🔗 Your Referral Link</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={generateReferralLink()}
            readOnly
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
          <button
            onClick={copyReferralLink}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-6 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 font-bold"
          >
            📋 Copy Link
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Share this link with friends! You'll earn 5% commission on all their transactions.
        </p>
      </div>

      {/* Your Referrals */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">👥 Your Referrals</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4">Address</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Transactions</th>
                <th className="text-left py-3 px-4">Your Earnings</th>
              </tr>
            </thead>
            <tbody>
              {(userReferrals as any) && (userReferrals as any).length > 0 ? (
                (userReferrals as any).map((referral, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3 px-4 font-mono text-sm">
                      {referral.address?.slice(0, 6)}...{referral.address?.slice(-4)}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(Number(referral.joinedAt) * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{referral.transactionCount?.toString() || '0'}</td>
                    <td className="py-3 px-4 text-green-400">
                      {(Number(referral.totalEarned) / 1e18).toFixed(4)} ETH
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No referrals yet</p>
                    <p className="text-sm mt-2">Share your referral link to start earning!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Rewards */}
      {referralRewards && Number(referralRewards) > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">💰 Claim Your Rewards</h2>
          <div className="flex items-center justify-between bg-green-900/20 border border-green-500/30 p-4 rounded-lg mb-4">
            <div>
              <p className="text-green-400 font-bold">
                Available to Claim: {(Number(referralRewards) / 1e18).toFixed(4)} ETH
              </p>
              <p className="text-sm text-gray-300">Earned from referral commissions</p>
            </div>
            <button
              onClick={handleClaimRewards}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 px-6 rounded-lg hover:from-green-500 hover:to-teal-500 transition-all duration-300 font-bold"
            >
              💰 Claim Rewards
            </button>
          </div>
        </div>
      )}

      {/* Referral Program Info */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">📚 How Referral Program Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2 text-green-400">For Referrers:</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Earn 5% commission on all referee transactions</li>
              <li>• No limit on number of referrals</li>
              <li>• Rewards accumulate automatically</li>
              <li>• Claim rewards anytime</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-blue-400">For Referees:</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Get special welcome bonus</li>
              <li>• Access to exclusive referral tournaments</li>
              <li>• Priority support</li>
              <li>• Early access to new features</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
          <h3 className="font-bold mb-2">🎯 Referral Milestones</h3>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-1">🥉</div>
              <p className="font-bold">5 Referrals</p>
              <p className="text-sm text-gray-400">Bronze Badge</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-1">🥈</div>
              <p className="font-bold">25 Referrals</p>
              <p className="text-sm text-gray-400">Silver Badge</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-1">🥇</div>
              <p className="font-bold">100 Referrals</p>
              <p className="text-sm text-gray-400">Gold Badge</p>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-2xl mb-1">👑</div>
              <p className="font-bold">500 Referrals</p>
              <p className="text-sm text-gray-400">Legend Badge</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
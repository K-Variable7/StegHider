import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { ethers } from 'ethers';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0xDE39A3e2ea3056e5f612760B4E936877AAa7De1f";

export default function DemoDashboard() {
  const { address } = useAccount();
  const [numReveals, setNumReveals] = useState(1);
  const [durationHours, setDurationHours] = useState(1);
  const [selectedFaction, setSelectedFaction] = useState(0);

  // Fee calculations
  const { data: revealFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'calculateFee',
    args: [numReveals, durationHours, address || '0x0000000000000000000000000000000000000000']
  });

  const { data: blockFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'calculateBlockFee',
    args: [durationHours, address || '0x0000000000000000000000000000000000000000']
  });

  const { writeContract: mintNFT } = useWriteContract();

  const handleMintDemo = () => {
    if (!address) return;

    mintNFT({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'mintClue',
      args: [address, selectedFaction, 5, ethers.keccak256(ethers.toUtf8Bytes("demo clue"))],
      value: ethers.parseEther("0.01"),
      chain: baseSepolia,
      account: address
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        🕵️ VaultWars Demo Dashboard
      </h1>

      {/* Fee Calculator Demo */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">💰 Dynamic Fee Calculator</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reveal Quantity</label>
            <input
              type="number"
              value={numReveals}
              onChange={(e) => setNumReveals(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Duration (Hours)</label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
            >
              {[1,6,12,24,48,72].map(h => <option key={h} value={h}>{h}h</option>)}
            </select>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>Reveal Fee:</span>
            <span className="text-yellow-400 font-bold">
              {revealFee ? (Number(revealFee) / 1e18).toFixed(4) : '0.0000'} ETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Block Fee:</span>
            <span className="text-yellow-400 font-bold">
              {blockFee ? (Number(blockFee) / 1e18).toFixed(4) : '0.0000'} ETH
            </span>
          </div>
        </div>
      </div>

      {/* Faction Selection Demo */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">⚔️ Faction Perks Demo</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Red Legion', perk: '20% Reveal Discount', color: 'from-red-500 to-red-700' },
            { name: 'Blue Order', perk: '20% Block Discount', color: 'from-blue-500 to-blue-700' }
          ].map((faction, index) => (
            <button
              key={index}
              onClick={() => setSelectedFaction(index)}
              className={`p-4 rounded-lg bg-gradient-to-r ${faction.color} ${
                selectedFaction === index ? 'ring-2 ring-white' : ''
              }`}
            >
              <h3 className="font-bold">{faction.name}</h3>
              <p className="text-sm opacity-90">{faction.perk}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Mint Demo */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🎨 Mint Demo NFT</h2>
        <p className="text-gray-300 mb-4">
          Experience the full VaultWars ecosystem by minting a dynamic NFT that evolves with gameplay!
        </p>
        <button
          onClick={handleMintDemo}
          disabled={!address}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-300 font-bold disabled:opacity-50"
        >
          {address ? 'Mint Demo NFT (0.01 ETH)' : 'Connect Wallet First'}
        </button>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';
import NFTGallery from './NFTGallery';
import FactionChat from './FactionChat';
import NostrFeed from './NostrFeed';
import LoreModal from './LoreModal';
import StegHideEmbed from './StegHideEmbed';
import Confetti from 'react-confetti';
import { ethers } from 'ethers';
import AchievementPopup, { ACHIEVEMENTS, Achievement } from './AchievementPopup';
import TournamentTimer, { useTournamentTimer } from './TournamentTimer';
import { audioManager } from '../utils/audioUtils';
import { AchievementParticles, MintParticles, RevealParticles, StealParticles } from './ParticleSystem';

const CLUE_NFT_ABI = DYNAMIC_CLUE_NFT_ABI;
const CONTRACT_ADDRESS = "0x7fE9313c7e65A0c8Db47F9Fbb825Bab10bbbd1f4";

const FACTIONS = [
  { id: 0, name: 'Red', color: 'bg-red-500', description: 'Aggressive hunters' },
  { id: 1, name: 'Blue', color: 'bg-blue-500', description: 'Strategic thinkers' },
  { id: 2, name: 'Green', color: 'bg-green-500', description: 'Nature explorers' },
  { id: 3, name: 'Gold', color: 'bg-yellow-500', description: 'Elite champions' }
];

const TIERS = [
  { id: 0, name: 'Basic', price: '0.001 ETH', color: 'bg-gray-500', description: 'Entry level clues' },
  { id: 1, name: 'Rare', price: '0.005 ETH', color: 'bg-blue-500', description: 'Enhanced rewards' },
  { id: 2, name: 'Epic', price: '0.01 ETH', color: 'bg-purple-500', description: 'Maximum rewards' }
];

export default function EnhancedFactionDashboard() {
  const { address, isConnected, connector } = useAccount();
  const [selectedFaction, setSelectedFaction] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<number>(0); // Default to Basic tier
  const [clues, setClues] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [numReveals, setNumReveals] = useState(1);
  const [durationHours, setDurationHours] = useState(24);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [revealedClues, setRevealedClues] = useState<{[key: number]: string[]}>({});
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [stegoImage, setStegoImage] = useState<string | null>(null);
  const [clueText, setClueText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessingStego, setIsProcessingStego] = useState(false);
  const [showStegHideSection, setShowStegHideSection] = useState(false);

  // Achievement and tournament state
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [playerStats, setPlayerStats] = useState({
    mints: 0,
    reveals: 0,
    steals: 0,
    level: 1
  });
  
  // Particle effect triggers
  const [showMintParticles, setShowMintParticles] = useState(false);
  const [showRevealParticles, setShowRevealParticles] = useState(false);
  const [showStealParticles, setShowStealParticles] = useState(false);
  const [showAchievementParticles, setShowAchievementParticles] = useState(false);
  const tournament = useTournamentTimer();

  // Achievement management
  const triggerAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement);
    setShowAchievementParticles(true);
    setTimeout(() => setShowAchievementParticles(false), 1500);
  };

  const handleAchievementClose = () => {
    setCurrentAchievement(null);
  };

  // Update player stats and check achievements
  const updatePlayerStats = (action: 'mint' | 'reveal' | 'steal') => {
    setPlayerStats(prev => {
      const newStats = { ...prev };
      
      switch (action) {
        case 'mint':
          newStats.mints += 1;
          if (newStats.mints === 1) {
            triggerAchievement(ACHIEVEMENTS.FIRST_MINT);
          }
          break;
        case 'reveal':
          newStats.reveals += 1;
          if (newStats.reveals === 1) {
            triggerAchievement(ACHIEVEMENTS.FIRST_REVEAL);
          }
          break;
        case 'steal':
          newStats.steals += 1;
          if (newStats.steals === 1) {
            triggerAchievement(ACHIEVEMENTS.FIRST_STEAL);
          }
          break;
      }

      // Check level achievements
      const totalActions = newStats.mints + newStats.reveals + newStats.steals;
      const newLevel = Math.floor(totalActions / 10) + 1;
      if (newLevel > prev.level && newLevel >= 5) {
        triggerAchievement(ACHIEVEMENTS.LEVEL_5);
      }
      newStats.level = newLevel;

      return newStats;
    });
  };

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Monitor wallet connection
  useEffect(() => {
    console.log('Wallet connection status:', { isConnected, address, connector });
    
    if (!isConnected && address) {
      console.warn('Wallet appears disconnected but address exists');
      setConnectionError('Wallet disconnected. Please check MetaMask and reconnect.');
    } else if (isConnected && address) {
      console.log('Wallet connected successfully:', address);
      setConnectionError(null);
    } else if (!isConnected) {
      console.log('No wallet connected');
      setConnectionError(null);
    }
  }, [isConnected, address, connector]);

  // Read contract data
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

  const { data: playerClues } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getPlayerClues',
    args: [address]
  });

  const { data: revealFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'calculateFee',
    args: [numReveals, durationHours, address]
  });

  const { data: blockFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'calculateBlockFee',
    args: [durationHours, address]
  });

  const factionScores = [
    { name: 'Red', score: Number(redScore || 0), pot: 0 },
    { name: 'Blue', score: Number(blueScore || 0), pot: 0 },
    { name: 'Green', score: Number(greenScore || 0), pot: 0 },
    { name: 'Gold', score: Number(goldScore || 0), pot: 0 }
  ];

  useEffect(() => {
    if (playerClues) {
      setClues(playerClues as number[]);
    }
  }, [playerClues]);

  // Monitor transaction success for achievements
  useEffect(() => {
    if (isSuccess && hash) {
      // Determine which action was completed based on the transaction
      // This is a simplified approach - in a real app you'd track the action type
      updatePlayerStats('mint'); // Assume mint for now, could be enhanced with action tracking
    }
  }, [isSuccess, hash]);

  const revealClue = async (clueId: number) => {
    // Simulate revealing a clue
    const mockClue = "Hidden clue extracted from steganographic image!";
    setRevealedClues(prev => ({
      ...prev,
      [clueId]: [mockClue]
    }));
    
    // Play reveal sound and trigger particles
    audioManager.playReveal();
    setShowRevealParticles(true);
    setTimeout(() => setShowRevealParticles(false), 1800);
    
    updatePlayerStats('reveal');
    
    setSuccessMessage(`Revealed NFT #${clueId} — clue extracted!`);
    setShowSuccessToast(true);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setShowSuccessToast(false);
    }, 3000);
  };

  const stealClue = (clueId: number) => {
    if (!address || selectedFaction === null) return;
    
    // Play steal sound and trigger particles
    audioManager.playSteal();
    setShowStealParticles(true);
    setTimeout(() => setShowStealParticles(false), 2000);
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CLUE_NFT_ABI,
      functionName: 'stealClue',
      args: [clueId, selectedFaction],
      value: BigInt('1000000000000000'), // 0.001 ETH
      chain: baseSepolia,
      account: address
    });
  };

  const randomReveal = () => {
    if (!address) return;
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CLUE_NFT_ABI,
      functionName: 'randomReveal',
      args: [numReveals, durationHours * 3600],
      value: revealFee as bigint,
      chain: baseSepolia,
      account: address
    });
  };

  const blockReveal = () => {
    if (!address) return;
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CLUE_NFT_ABI,
      functionName: 'blockReveal',
      args: [durationHours * 3600],
      value: blockFee as bigint,
      chain: baseSepolia,
      account: address
    });
  };

  const mintNFT = async () => {
    if (!address || selectedFaction === null || !clueText) {
      console.error('Missing required data for minting:', { address, selectedFaction, clueText });
      return;
    }
    
    try {
      setIsProcessingStego(true);
      console.log('Starting NFT mint process...');
      
      // Get tier-based pricing
      const tierPrices = ['1000000000000000', '5000000000000000', '10000000000000000']; // 0.001, 0.005, 0.01 ETH
      const mintPrice = tierPrices[selectedTier];
      
      // Simulate steganography processing and create clue hash
      setTimeout(() => {
        const clueHash = ethers.keccak256(ethers.toUtf8Bytes(clueText));
        console.log('Generated clue hash:', clueHash);
        
        // Play mint sound and trigger particles
        audioManager.playMint();
        setShowMintParticles(true);
        setTimeout(() => setShowMintParticles(false), 1200);
        
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: CLUE_NFT_ABI,
          functionName: 'mintClue',
          args: [address, selectedFaction, selectedTier, 5, clueHash], // faction, tier, difficulty, clueHash
          value: BigInt(mintPrice),
          chain: baseSepolia,
          account: address
        });
        setIsProcessingStego(false);
        setSuccessMessage(`NFT minted successfully with ${TIERS[selectedTier].name} tier! Now embed your clue in an image below!`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }, 2000);
    } catch (error) {
      console.error('Minting failed:', error);
      setConnectionError('Transaction failed. Please check your wallet connection and try again.');
      setIsProcessingStego(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 sm:p-6 relative">
      {/* Particle Effects */}
      <MintParticles trigger={showMintParticles} />
      <RevealParticles trigger={showRevealParticles} />
      <StealParticles trigger={showStealParticles} />
      <AchievementParticles trigger={showAchievementParticles} />
      
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {showConfetti && <Confetti />}
        
        {/* Success Toast - Mobile optimized */}
        {showSuccessToast && (
          <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-3 rounded-xl shadow-2xl border border-green-500/30 z-50 animate-pulse backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl">🎉</span>
              <span className="font-semibold text-sm sm:text-base">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Header - Mobile optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            ⚔️ VaultWars Arena
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mb-4 sm:mb-6 px-4">
            Choose your faction and command the digital Colosseum
          </p>
          
          {/* Lore Button - Mobile optimized */}
          <button
            onClick={() => setShowLoreModal(true)}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-amber-500/50 hover:border-amber-400/70 text-sm sm:text-base"
          >
            📜 Read the Emperor's Legend
          </button>
        </div>

        {/* Tournament Timer */}
        <TournamentTimer 
          endTime={tournament.endTime}
          onTournamentEnd={tournament.onTournamentEnd}
          className="mb-8"
        />

        {/* Connection Error Alert */}
        {connectionError && (
          <div className="bg-red-900/80 border border-red-500/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <h3 className="text-red-400 font-bold">Connection Issue</h3>
                <p className="text-red-300 text-sm">{connectionError}</p>
                <p className="text-red-300 text-xs mt-1">
                  Try refreshing the page or reconnecting your wallet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Faction Selection - Mobile optimized */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Choose Your Faction
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {FACTIONS.map((faction) => (
              <button
                key={faction.id}
                onClick={() => setSelectedFaction(faction.id)}
                className={`p-3 sm:p-4 lg:p-6 rounded-xl text-white transition-all duration-300 transform hover:scale-105 border-2 text-sm sm:text-base ${
                  selectedFaction === faction.id
                    ? `${faction.color} ring-4 ring-white/50 scale-105 shadow-2xl border-white/50`
                    : `${faction.color} hover:shadow-2xl border-transparent hover:border-white/30`
                } backdrop-blur-sm`}
              >
                <h3 className="font-bold text-lg sm:text-xl mb-1 sm:mb-2">{faction.name}</h3>
                <p className="text-xs sm:text-sm opacity-90">{faction.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Faction Perks - Mobile optimized */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-yellow-500/20 shadow-2xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 text-center bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            ⚔️ Faction Perks & Abilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
              <h3 className="text-red-400 font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center">
                🔥 Red Faction - Aggressive
              </h3>
              <ul className="text-gray-300 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>• <strong>20% cheaper reveals</strong> - Hunt faster!</li>
                <li>• Bonus multiplier on successful steals</li>
                <li>• Aggressive playstyle for quick victories</li>
              </ul>
            </div>
            <div className="p-4 sm:p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
              <h3 className="text-blue-400 font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center">
                🛡️ Blue Faction - Defensive
              </h3>
              <ul className="text-gray-300 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>• <strong>20% cheaper blocks + 20% longer duration</strong></li>
                <li>• Stronger defensive capabilities</li>
                <li>• Survive reveal attempts and protect your hoard</li>
              </ul>
            </div>
            <div className="p-4 sm:p-6 bg-green-900/20 border border-green-500/30 rounded-xl">
              <h3 className="text-green-400 font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center">
                🌿 Green Faction - Balanced
              </h3>
              <ul className="text-gray-300 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>• Balanced gameplay approach</li>
                <li>• Steady accumulation of resources</li>
                <li>• Nature-inspired strategic play</li>
              </ul>
            </div>
            <div className="p-4 sm:p-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
              <h3 className="text-yellow-400 font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center">
                👑 Gold Faction - Elite
              </h3>
              <ul className="text-gray-300 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>• <strong>Higher base multipliers</strong></li>
                <li>• Elite status and prestige</li>
                <li>• Access to exclusive features</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Leaderboard - Mobile optimized */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            🏆 Faction Leaderboard
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {factionScores.map((faction, index) => (
              <div key={faction.name} className="text-center">
                <div className={`p-3 sm:p-4 rounded-xl ${FACTIONS[index].color} text-white`}>
                  <h3 className="font-bold text-base sm:text-lg">{faction.name}</h3>
                  <p className="text-xl sm:text-2xl font-bold">{Number(faction.score)}</p>
                  <p className="text-xs sm:text-sm opacity-80">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clue Management */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            🔍 Your Hidden Treasures
          </h2>
          
          <div className="mb-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
            <h3 className="text-green-400 font-bold text-lg mb-2">🎯 Hunt & Conquer:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• <strong>Reveal</strong> extracts clues from steganographic images you've found</li>
              <li>• <strong>Steal</strong> claims ownership of discovered clues (0.001 ETH)</li>
              <li>• Successfully stolen clues evolve your NFT and boost your faction!</li>
            </ul>
          </div>
          
          {clues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clues.map((clueId) => (
                <div key={clueId} className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 backdrop-blur-sm">
                  <h3 className="font-bold text-white text-xl mb-4">NFT #{clueId}</h3>
                  
                  {revealedClues[clueId] ? (
                    <div className="space-y-4">
                      <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-lg">
                        <p className="text-green-400 font-semibold mb-2">🎉 Clue Extracted!</p>
                        <p className="text-gray-300 text-sm">{revealedClues[clueId][0]}</p>
                      </div>
                      
                      <button
                        onClick={() => stealClue(clueId)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-red-500/50 font-bold"
                      >
                        Claim This Treasure (0.001 ETH)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        onClick={() => revealClue(clueId)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-blue-500/50 font-bold"
                      >
                        Extract Hidden Clue
                      </button>
                      
                      <p className="text-gray-400 text-xs text-center">
                        Find the steganographic image first!
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No treasures yet. Start your hunt!</p>
              <p className="text-gray-500 text-sm">Mint a clue NFT below and hide it in an image for others to find.</p>
            </div>
          )}
        </div>

        {/* Tier Selection & Minting */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-purple-500/20 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            🏆 Choose Your Tier & Mint NFT
          </h2>

          {/* Tier Selection */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Select Clue Tier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`p-4 sm:p-6 rounded-xl text-white transition-all duration-300 transform hover:scale-105 border-2 text-sm sm:text-base ${
                    selectedTier === tier.id
                      ? `${tier.color} ring-4 ring-white/50 scale-105 shadow-2xl border-white/50`
                      : `${tier.color} hover:shadow-2xl border-transparent hover:border-white/30`
                  } backdrop-blur-sm`}
                >
                  <h3 className="font-bold text-lg sm:text-xl mb-2">{tier.name}</h3>
                  <p className="text-yellow-300 font-bold text-lg mb-2">{tier.price}</p>
                  <p className="text-xs sm:text-sm opacity-90">{tier.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Clue Input & Mint */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-white text-sm sm:text-base font-semibold mb-2">
                Enter Your Secret Clue
              </label>
              <textarea
                value={clueText}
                onChange={(e) => setClueText(e.target.value)}
                placeholder="Enter the secret message you want to hide in your NFT..."
                className="w-full h-24 sm:h-32 bg-gray-800/60 text-white rounded-xl px-4 py-3 border border-gray-600/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none backdrop-blur-sm"
                maxLength={500}
              />
              <p className="text-gray-400 text-xs mt-1">
                {clueText.length}/500 characters
              </p>
            </div>

            {selectedFaction !== null && (
              <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-300 font-semibold">Mint Summary:</span>
                  <span className="text-yellow-400 font-bold">{TIERS[selectedTier].price}</span>
                </div>
                <p className="text-gray-300 text-sm">
                  {FACTIONS[selectedFaction].name} Faction • {TIERS[selectedTier].name} Tier • Difficulty: 5
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={mintNFT}
                disabled={!selectedFaction || !clueText.trim() || isProcessingStego}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-purple-500/50 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessingStego ? '🪄 Minting NFT...' : `🪄 Mint ${TIERS[selectedTier].name} NFT`}
              </button>
              {(!selectedFaction || !clueText.trim()) && (
                <p className="text-gray-400 text-sm mt-2">
                  {!selectedFaction ? 'Select a faction' : 'Enter a clue'} to mint
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Steganography Integration */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-cyan-500/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
              🎨 Hide Your Clue in Images
            </h2>
            <button
              onClick={() => setShowStegHideSection(!showStegHideSection)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 text-sm font-semibold"
            >
              {showStegHideSection ? 'Hide Section' : 'Show Tools'}
            </button>
          </div>

          {showStegHideSection && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-400 font-bold text-lg mb-2">🎭 Complete Workflow:</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• <strong>Step 1:</strong> Mint a clue NFT with your secret message (above)</li>
                  <li>• <strong>Step 2:</strong> Embed your clue in an image using steganography (below)</li>
                  <li>• <strong>Step 3:</strong> Share the image - other players hunt for your hidden clue!</li>
                  <li>• <strong>Step 4:</strong> Defend your clues or steal from opponents</li>
                </ul>
              </div>

              <StegHideEmbed 
                clueText={clueText}
                onImageGenerated={(imageData) => {
                  setStegoImage(imageData);
                  setSuccessMessage('Steganographic image created! Share it to start the hunt!');
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 5000);
                }}
              />
              
              {stegoImage && (
                <div className="mt-6 p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <h4 className="text-green-400 font-semibold mb-2">🎨 Steganographic Image Ready!</h4>
                  <img 
                    src={stegoImage} 
                    alt="Steganographic image" 
                    className="w-full max-h-64 rounded-lg border border-gray-600 mb-4" 
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = stegoImage;
                        link.download = 'hidden-clue.png';
                        link.click();
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 text-sm font-semibold"
                    >
                      💾 Download Image
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(window.location.origin + '/gallery')}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 text-sm font-semibold"
                    >
                      🔗 Share Gallery Link
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center text-gray-400 text-sm">
                <p>💡 <strong>Pro Tip:</strong> High-quality PNG images work best for steganography. Share your creations in the gallery!</p>
              </div>
            </div>
          )}
        </div>

        {/* Reveal Mechanisms */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            🎭 Strategic Reveals
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Random Reveal */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 backdrop-blur-sm">
              <h3 className="font-bold text-white text-xl mb-4">🔮 Random Reveal</h3>
              <p className="text-gray-300 text-sm mb-6">Peek at opponents' clues (scales with quantity/duration)</p>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div>
                    <label className="block text-white text-sm mb-2">Number of Reveals</label>
                    <select
                      value={numReveals}
                      onChange={(e) => setNumReveals(Number(e.target.value))}
                      className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm mb-2">Duration (hours)</label>
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
                    >
                      {[1,6,12,24,48,72].map(h => <option key={h} value={h}>{h}h</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-yellow-400 font-bold mb-4">
                    Fee: {revealFee !== undefined && revealFee !== null ? (Number(revealFee) / 1e18).toFixed(4) : 'Calculating...'} ETH
                    {revealFee === 0n && <span className="text-red-400 text-sm block">(Contract may not be deployed or function not available)</span>}
                  </p>
                  <p className="text-gray-400 text-xs mb-2">
                    {numReveals} reveal(s) for {durationHours} hour(s)
                  </p>
                  {selectedFaction !== null && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-sm">
                        🔥 Red Faction Perk: 20% cheaper reveals (aggressive advantage!)
                      </p>
                    </div>
                  )}
                  <button
                    onClick={randomReveal}
                    disabled={isLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-purple-500/50 font-bold text-lg disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Random Reveal'}
                  </button>
                </div>
              </div>
            </div>

            {/* Block Reveal */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 backdrop-blur-sm">
              <h3 className="font-bold text-white text-xl mb-4">🛡️ Block Reveal</h3>
              <p className="text-gray-300 text-sm mb-6">Prevent others from seeing your clues</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm mb-2">Protection Duration (hours)</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 w-full"
                  >
                    {[1,6,12,24,48,72].map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                </div>
                
                <div className="text-center">
                  <p className="text-yellow-400 font-bold mb-4">
                    Fee: {blockFee !== undefined && blockFee !== null ? (Number(blockFee) / 1e18).toFixed(4) : 'Calculating...'} ETH
                    {blockFee === 0n && <span className="text-red-400 text-sm block">(Contract may not be deployed or function not available)</span>}
                  </p>
                  <p className="text-gray-400 text-xs mb-2">
                    Block reveals for {durationHours} hour(s)
                  </p>
                  {selectedFaction !== null && (
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        🛡️ Blue Faction Perk: 20% cheaper blocks + 20% longer duration (defensive advantage!)
                      </p>
                    </div>
                  )}
                  <button
                    onClick={blockReveal}
                    disabled={isLoading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-green-500/50 font-bold text-lg disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Block Reveal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            🧭 Navigate the Empire
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a
              href="/warroom"
              className="group p-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-600/30 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">⚔️</span>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">War Room</h3>
                  <p className="text-gray-300 text-sm">Faction communication and strategy</p>
                </div>
              </div>
            </a>
            
            <a
              href="/gallery"
              className="group p-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-600/30 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">🎨</span>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Gallery</h3>
                  <p className="text-gray-300 text-sm">NFT showcase and steganographic art</p>
                </div>
              </div>
            </a>

            <a
              href="/analytics"
              className="group p-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-600/30 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">📊</span>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Analytics</h3>
                  <p className="text-gray-300 text-sm">Game insights and faction stats</p>
                </div>
              </div>
            </a>

            <a
              href="/spectator"
              className="group p-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-600/30 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">👁️</span>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Spectator Mode</h3>
                  <p className="text-gray-300 text-sm">Watch live battles and faction wars</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Lore Modal */}
        <LoreModal 
          isOpen={showLoreModal} 
          onClose={() => setShowLoreModal(false)}
          factionScores={factionScores}
        />

        {/* Achievement Popup */}
        <AchievementPopup 
          achievement={currentAchievement}
          onClose={handleAchievementClose}
        />
      </div>
    </div>
  );
}

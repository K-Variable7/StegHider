import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';
import FactionChat from './FactionChat';
import NostrFeed from './NostrFeed';
import LoreModal from './LoreModal';
import NFTGallery from './NFTGallery';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia, baseSepolia } from 'wagmi/chains';
import { useNostrWalletConnect, useZapManager, useNostrNFTMetadata, useNostrLeaderboard, useRelayListManager, ZAP_REACTIONS } from '../utils/nostrEcosystem';
import { ethers } from 'ethers';

// DynamicClueNFT ABI
const CLUE_NFT_ABI = DYNAMIC_CLUE_NFT_ABI;

const CONTRACT_ADDRESS = "0x9AaD4AC1113A3ecb6FBacB0212bD01422Cf8eb6f"; // DynamicClueNFT on Base Sepolia

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
  const [numReveals, setNumReveals] = useState(1);
  const [durationHours, setDurationHours] = useState(24);
  const [revealedClues, setRevealedClues] = useState<{[key: number]: string[]}>({});
  const [nostrBroadcast, setNostrBroadcast] = useState<((type: 'random' | 'block', duration: number, fee: string, numReveals?: number) => void) | null>(null);
  const [nostrLeaderboard, setNostrLeaderboard] = useState<{[faction: string]: number}>({});

  // New state for enhanced UI
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [stegoImage, setStegoImage] = useState<string | null>(null);
  const [clueText, setClueText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessingStego, setIsProcessingStego] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{[key: number]: {blocked: boolean, until: number}}>({});
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [selectedZapReaction, setSelectedZapReaction] = useState<string>('');
  const [zapLeaderboard, setZapLeaderboard] = useState<Array<{pubkey: string, totalZaps: number, topReaction?: string}>>([]);

  // Nostr ecosystem hooks
  const { connect: connectNWC, requestPayment } = useNostrWalletConnect();
  const { connectLightningAddress, sendZap, createZapEvent, publishZapReaction, getZapLeaderboard } = useZapManager();
  const { storeMetadata, getMetadata } = useNostrNFTMetadata();
  const { publishScore, getFactionScores } = useNostrLeaderboard();
  const { publishRelayList, getRecommendedRelays } = useRelayListManager();
  const [lastRevealType, setLastRevealType] = useState<'random' | 'block' | null>(null);
  const [lastRevealParams, setLastRevealParams] = useState<{duration: number, fee: string, numReveals?: number} | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

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

  // Read faction pots
  const { data: redPot } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionPot',
    args: [0]
  });

  const { data: bluePot } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionPot',
    args: [1]
  });

  const { data: greenPot } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionPot',
    args: [2]
  });

  const { data: goldPot } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getFactionPot',
    args: [3]
  });

  // Read player clues
  const { data: playerClues } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLUE_NFT_ABI,
    functionName: 'getPlayerClues',
    args: [address]
  });

  // Calculate fees
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

  useEffect(() => {
    if (playerClues) {
      setClues(playerClues as number[]);
    }
  }, [playerClues]);

  // Process faction data
  const factionScores = [
    { name: 'Red', score: redScore || 0, pot: redPot || 0 },
    { name: 'Blue', score: blueScore || 0, pot: bluePot || 0 },
    { name: 'Green', score: greenScore || 0, pot: greenPot || 0 },
    { name: 'Gold', score: goldScore || 0, pot: goldPot || 0 }
  ];

  const totalSolved = factionScores.reduce((sum, f) => sum + Number(f.score), 0);
  const solvesUntilNextDifficulty = 50 - (totalSolved % 50);

  const revealClue = async (clueId: number) => {
    // In real implementation, this would verify ownership and reveal the clue
    loadClueDetails(clueId);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Simulate extracting clue from steganographic image
    // In real app, this would get the image data from IPFS/contract
    const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    try {
      const extractedClue = await extractClueFromImage(mockImageData);
      setRevealedClues(prev => ({
        ...prev,
        [clueId]: [extractedClue]
      }));
      
      setSuccessMessage(`Revealed NFT #${clueId} — clue extracted: "${extractedClue}"`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (error) {
      setSuccessMessage(`Revealed NFT #${clueId} — extraction failed`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    }
  };

  const stealClue = (clueId: number) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    if (selectedFaction === null) {
      alert('Please select a faction first');
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CLUE_NFT_ABI,
      functionName: 'stealClue',
      args: [clueId, selectedFaction],
      value: BigInt('1000000000000000'), // 0.001 ETH in wei
      chain: baseSepolia,
      account: address
    });
  };

  const performRandomReveal = () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setLastRevealType('random');
    setLastRevealParams({ duration: durationHours, fee: (Number(revealFee) / 1e18).toFixed(6), numReveals });

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CLUE_NFT_ABI,
      functionName: 'randomReveal',
      args: [numReveals, durationHours],
      value: revealFee || BigInt(0),
      chain: baseSepolia,
      account: address
    });
  };

  // Broadcast to Nostr when transaction succeeds
  useEffect(() => {
    if (isSuccess && nostrBroadcast && lastRevealType && lastRevealParams) {
      if (lastRevealType === 'random') {
        nostrBroadcast('random', lastRevealParams.duration, lastRevealParams.fee, lastRevealParams.numReveals);
        setSuccessMessage(`Random reveal activated! ${lastRevealParams.numReveals}x reveals for ${lastRevealParams.duration}h`);
      } else if (lastRevealType === 'block') {
        nostrBroadcast('block', lastRevealParams.duration, lastRevealParams.fee);
        setSuccessMessage(`Block activated! Protected for ${lastRevealParams.duration}h`);
      }
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
      
      // Reset after broadcasting
      setLastRevealType(null);
      setLastRevealParams(null);
    }
  }, [isSuccess, nostrBroadcast, lastRevealType, lastRevealParams]);

  const performBlockReveal = () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    setLastRevealType('block');
    setLastRevealParams({ duration: durationHours, fee: (Number(blockFee) / 1e18).toFixed(6) });

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CLUE_NFT_ABI,
      functionName: 'blockReveal',
      args: [durationHours],
      value: blockFee || BigInt(0),
      chain: baseSepolia,
      account: address
    });
  };

  const loadClueDetails = async (clueId: number) => {
    // This would call the contract to get encrypted clues and decrypt them
    // For now, just simulate loading
    console.log(`Loading details for clue ${clueId}`);
  };

  // Nostr ecosystem functions
  const handleZapPlayer = async (lightningAddress: string, amount: number = 1000, reaction?: string) => {
    try {
      // Connect to lightning address first
      await connectLightningAddress(lightningAddress);

      const zapRequest = {
        amount,
        recipient: lightningAddress,
        message: reaction ? `${reaction} Zap for clever play in VaultWars!` : `Zap for clever play in VaultWars!`,
        reaction
      };

      const success = await sendZap(zapRequest);
      if (success) {
        const reactionText = reaction ? ` with ${reaction}` : '';
        alert(`Zap sent! ${amount} sats tipped${reactionText}.`);
        // Update leaderboard
        updateZapLeaderboard();
      } else {
        alert('Failed to send zap. Please try again.');
      }
    } catch (error) {
      console.error('Zap failed:', error);
      alert('Zap failed. Make sure you have a Lightning wallet connected.');
    }
  };

  const updateZapLeaderboard = async () => {
    try {
      const leaderboard = getZapLeaderboard();
      setZapLeaderboard(leaderboard);
    } catch (error) {
      console.error('Failed to update zap leaderboard:', error);
    }
  };

  const updateNostrLeaderboard = async () => {
    try {
      // Publish current faction scores to Nostr
      if (selectedFaction !== null && address) {
        const factionName = FACTIONS[selectedFaction].name;
        const factionScore = factionScores.find(f => f.name === factionName)?.score || 0;

        // This would require the user's Nostr private key
        // For now, just fetch existing scores
        const scores = await getFactionScores();
        setNostrLeaderboard(scores);
      }
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  };

  const storeCluePreview = async (tokenId: number) => {
    try {
      // Store encrypted clue preview on Nostr
      const preview = {
        tokenId,
        name: `VaultWars Clue #${tokenId}`,
        description: 'Encrypted clue preview - solve to reveal!',
        attributes: {
          faction: selectedFaction !== null ? FACTIONS[selectedFaction].name : 'Unknown',
          revealCount: 0,
          encryptedPreview: 'ENCRYPTED_PREVIEW_DATA' // Would be actual encrypted data
        }
      };

      // This would require user's Nostr private key
      console.log('Would store metadata:', preview);
    } catch (error) {
      console.error('Failed to store clue preview:', error);
    }
  };

  // Enhanced UI functions
  const calculateRiskPreview = () => {
    const totalClues = clues.length;
    const estimatedTargets = Math.min(numReveals * 2, totalClues); // Rough estimate
    const exposureChance = Math.min((numReveals / Math.max(totalClues, 1)) * 100, 100);
    return { estimatedTargets, exposureChance };
  };

  const getEthToUsdRate = () => 2500; // Mock rate - in real app, fetch from API

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setStegoImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const embedClueInImage = async () => {
    if (!selectedImage || !clueText) {
      alert('Please select an image and enter clue text');
      return;
    }

    setIsProcessingStego(true);
    try {
      // For demo purposes, we'll simulate steganography
      // In production, you'd use a proper steganography library
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        // Simulate LSB steganography by slightly modifying the image
        // This is a placeholder - real implementation would use proper stego
        const simulatedStegoImage = base64Image; // In real app, this would be modified
        
        setStegoImage(simulatedStegoImage);
        
        // Here you would upload to IPFS and call collectClue contract function
        console.log('Stego simulation complete. Clue embedded:', clueText);
        
        setIsProcessingStego(false);
        setSuccessMessage('Clue embedded successfully! Upload to IPFS to mint NFT.');
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Failed to embed clue:', error);
      alert('Failed to embed clue in image');
      setIsProcessingStego(false);
    }
  };

  const extractClueFromImage = async (imageData: string) => {
    try {
      // Mock extraction - in real implementation, this would extract from LSB
      // For demo, return a simulated clue
      return "Hidden clue extracted from image pixels using LSB steganography!";
    } catch (error) {
      console.error('Failed to extract clue:', error);
      return 'Failed to extract clue';
    }
  };

  const mintNFT = async () => {
    if (!address || !selectedFaction || !stegoImage) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CLUE_NFT_ABI,
        functionName: 'mintClue',
        args: [address, selectedFaction, 5, ethers.keccak256(ethers.toUtf8Bytes(clueText))], // difficulty 5 for now
        value: ethers.parseEther('0.01'), // 0.01 ETH mint price
        chain: baseSepolia,
        account: address
      });
      setSuccessMessage('NFT mint transaction submitted! Check your wallet.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (error) {
      console.error('Mint failed:', error);
      alert('Mint failed. Check console for details.');
    }
  };

  const checkBlockStatus = async (tokenId: number) => {
    if (!address) return;
    
    try {
      const { data: blockedUntil } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CLUE_NFT_ABI,
        functionName: 'revealBlockedUntil',
        args: [tokenId]
      });
      
      const now = Math.floor(Date.now() / 1000);
      const isBlocked = blockedUntil ? Number(blockedUntil) > now : false;
      
      setBlockStatus(prev => ({
        ...prev,
        [tokenId]: { blocked: isBlocked, until: Number(blockedUntil) || 0 }
      }));
    } catch (error) {
      console.error('Failed to check block status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {showConfetti && <Confetti />}
        
        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl border border-green-500/30 z-50 animate-pulse backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎉</span>
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Header with Lore Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowLoreModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white font-bold text-lg rounded-xl hover:from-red-500 hover:via-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-red-500/50 hover:border-red-400/70 hover:shadow-red-500/25"
          >
            📜 Read the Emperor's Legend
          </button>
        </div>
        
        {/* Faction Selection */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Choose Your Faction</h2>
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

        {/* Leaderboard */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Faction Leaderboard</h2>
            <div className="text-center bg-gradient-to-br from-yellow-900/50 to-orange-900/50 p-4 rounded-xl border border-yellow-500/30">
              <p className="text-yellow-400 text-sm font-semibold">Next Difficulty Increase</p>
              <p className="text-white font-bold text-2xl">{solvesUntilNextDifficulty} solves</p>
            </div>
          </div>
          <div className="space-y-3">
            {factionScores
              .sort((a, b) => Number(b.score) - Number(a.score))
              .map((faction, index) => (
                <div key={faction.name} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-bold text-white text-xl">{faction.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">{Number(faction.score)} pts</div>
                    <div className="text-sm text-green-400 font-semibold">{Number(faction.pot) / 1e18} ETH pot</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Player Clues */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Your Clues</h2>
          {clues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clues.map((clueId) => {
                const status = blockStatus[clueId];
                const isBlocked = status?.blocked;
                const blockedUntil = status?.until;
                
                return (
                  <div key={clueId} className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 backdrop-blur-sm relative overflow-hidden">
                    {isBlocked && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-red-500/50">
                        Blocked until {new Date(blockedUntil * 1000).toLocaleString()}
                      </div>
                    )}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
                    <h3 className="font-bold text-white text-xl mb-2">Clue #{clueId}</h3>
                    <p className="text-gray-300 text-sm mb-4">Click to reveal hidden message</p>
                    <div className="flex space-x-3">
                      <button 
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={() => revealClue(clueId)}
                        disabled={isBlocked}
                      >
                        Reveal
                      </button>
                      <button className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg border border-red-500/50" onClick={() => stealClue(clueId)}>
                        Steal (0.001 ETH)
                      </button>
                    </div>
                    {revealedClues[clueId] && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-black/60 to-gray-900/60 rounded-lg border border-green-500/30">
                        <p className="font-bold text-green-400 mb-2">Revealed Messages:</p>
                        {revealedClues[clueId].map((msg, idx) => (
                          <p key={idx} className="text-white text-sm">• {msg}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No clues found. Join a hunt to get started!</p>
            </div>
          )}
        </div>

        {/* Reveal Mechanics */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Reveal Mechanics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Random Reveal */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 backdrop-blur-sm">
              <h3 className="font-bold text-white text-xl mb-4">Random Reveal</h3>
              <p className="text-gray-300 text-sm mb-6">Pay to randomly reveal clues from other players. Higher numbers = better odds, longer duration = more time to act.</p>
              
              {/* Sliders */}
              <div className="space-y-6 mb-6">
                <div>
                  <label className="block text-white text-sm mb-3 font-semibold">Number of Reveals: <span className="text-blue-400">{numReveals}</span></label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={numReveals}
                    onChange={(e) => setNumReveals(Number(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-3 font-semibold">Duration: <span className="text-blue-400">{durationHours}h</span></label>
                  <input
                    type="range"
                    min="1"
                    max="72"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>1h</span>
                    <span>72h</span>
                  </div>
                </div>
              </div>

              {/* Live Fee Preview */}
              <div className="bg-gradient-to-br from-black/60 to-gray-900/60 p-4 rounded-xl mb-6 border border-yellow-500/30">
                <div className="text-yellow-400 text-lg font-bold">
                  Fee: {revealFee ? (Number(revealFee) / 1e18).toFixed(6) : '0.000000'} ETH
                </div>
                <div className="text-gray-300 text-sm">
                  ≈ ${(revealFee ? (Number(revealFee) / 1e18) * getEthToUsdRate() : 0).toFixed(2)} USD
                </div>
              </div>

              {/* Risk Preview */}
              <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 p-4 rounded-xl mb-6 border border-red-500/30">
                <h4 className="text-red-400 text-lg font-bold mb-3">Risk Preview</h4>
                <div className="space-y-2 text-sm text-white">
                  <div>Estimated targets: <span className="text-red-300 font-semibold">{calculateRiskPreview().estimatedTargets}</span></div>
                  <div>Your exposure chance: <span className="text-red-300 font-semibold">{calculateRiskPreview().exposureChance.toFixed(1)}%</span></div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full shadow-lg" 
                      style={{width: `${calculateRiskPreview().exposureChance}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              <button
                onClick={performRandomReveal}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-purple-500/50 disabled:opacity-50 font-bold text-lg"
              >
                {isLoading ? 'Processing...' : 'Random Reveal'}
              </button>
            </div>

            {/* Block Reveal */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 backdrop-blur-sm">
              <h3 className="font-bold text-white text-xl mb-4">Block Reveal</h3>
              <p className="text-gray-300 text-sm mb-6">Pay to block all reveals for a period. Strategic defense against random reveals.</p>
              
              {/* Duration Slider */}
              <div className="mb-6">
                <label className="block text-white text-sm mb-3 font-semibold">Block Duration: <span className="text-red-400">{durationHours}h</span></label>
                <input
                  type="range"
                  min="1"
                  max="72"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>1h</span>
                  <span>72h</span>
                </div>
              </div>

              {/* Live Fee Preview */}
              <div className="bg-gradient-to-br from-black/60 to-gray-900/60 p-4 rounded-xl mb-6 border border-yellow-500/30">
                <div className="text-yellow-400 text-lg font-bold">
                  Fee: {blockFee ? (Number(blockFee) / 1e18).toFixed(6) : '0.000000'} ETH
                </div>
                <div className="text-gray-300 text-sm">
                  ≈ ${(blockFee ? (Number(blockFee) / 1e18) * getEthToUsdRate() : 0).toFixed(2)} USD
                </div>
              </div>

              <button
                onClick={performBlockReveal}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-red-500/50 disabled:opacity-50 font-bold text-lg"
              >
                {isLoading ? 'Processing...' : 'Block Reveals'}
              </button>
            </div>
          </div>
        </div>

        {/* Steganography Tools */}
        <div className="bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-red-500/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">🔍 LSB Steganography Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Embed Clue */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 backdrop-blur-sm">
              <h3 className="font-bold text-white text-xl mb-4">Embed Clue in Image</h3>
              <p className="text-gray-300 text-sm mb-6">Hide your clue messages in image pixels using LSB steganography</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm mb-2 font-semibold">Base Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 bg-black/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-2 font-semibold">Clue Text</label>
                  <textarea
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value)}
                    placeholder="Enter your secret clue message..."
                    className="w-full px-4 py-3 bg-black/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none h-24 resize-none transition-all duration-300"
                  />
                </div>
                
                <button
                  onClick={embedClueInImage}
                  disabled={isProcessingStego || !selectedImage || !clueText}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-green-500/50 disabled:opacity-50 font-bold text-lg"
                >
                  {isProcessingStego ? 'Processing...' : 'Embed & Generate Stego-Image'}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 rounded-xl border border-gray-600/30 backdrop-blur-sm">
              <h3 className="font-bold text-white text-xl mb-4">Preview & Extract</h3>
              <p className="text-gray-300 text-sm mb-6">Preview your steganographic image and test extraction</p>
              
              {stegoImage && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-black/60 to-gray-900/60 p-4 rounded-xl border border-gray-500/30">
                    <img src={stegoImage} alt="Stego image" className="w-full h-32 object-cover rounded-lg" />
                  </div>
                  
                  <div className="text-xs text-gray-400 bg-gradient-to-br from-black/60 to-gray-900/60 p-4 rounded-xl border border-yellow-500/30">
                    <p className="font-bold mb-2 text-yellow-400">Pixel Analysis:</p>
                    <p className="mb-1">Before: Original image pixels</p>
                    <p className="mb-2">After: LSB modified with clue data</p>
                    <p className="text-yellow-400 font-semibold">Difference: ~0.1% pixel variation (invisible to human eye)</p>
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (stegoImage) {
                        const extracted = await extractClueFromImage(stegoImage);
                        alert(`Extracted clue: "${extracted}"`);
                      }
                    }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-blue-500/50 font-bold text-lg"
                  >
                    Test Extraction
                  </button>

                  <button
                    onClick={mintNFT}
                    disabled={!address || selectedFaction === null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-purple-500/50 disabled:opacity-50 font-bold text-lg"
                  >
                    Mint NFT (0.01 ETH)
                  </button>
                </div>
              )}
              
              {!stegoImage && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">Upload an image and embed a clue to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Faction Chat */}
      <FactionChat factionId={selectedFaction || 0} />

      {/* Nostr Feed */}
      {selectedFaction !== null && (
        <NostrFeed 
          faction={FACTIONS[selectedFaction].name} 
          onBroadcastReady={setNostrBroadcast}
        />
      )}

      {/* NFT Evolution Gallery */}
      <NFTGallery />

      {/* Lore Modal */}
      <LoreModal 
        isOpen={showLoreModal} 
        onClose={() => setShowLoreModal(false)}
        factionScores={factionScores.map(f => ({
          name: f.name,
          score: Number(f.score),
          pot: Number(f.pot)
        }))}
      />
    </div>
    </div>
  );
}

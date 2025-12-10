'use client';

import { useState } from 'react';
import { audioManager } from '../utils/audioUtils';

interface SocialShareProps {
  achievement?: {
    title: string;
    description: string;
    rarity: string;
    points: number;
  };
  reveal?: {
    clueId: number;
    clueText: string;
  };
  evolution?: {
    level: number;
    tokenId: number;
  };
  className?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({
  achievement,
  reveal,
  evolution,
  className = ''
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showZapPrompt, setShowZapPrompt] = useState(false);

  const generateShareText = () => {
    if (achievement) {
      return `🏆 Just unlocked "${achievement.title}" in VaultWars! ${achievement.description} (+${achievement.points} points) #VaultWars #Web3Gaming`;
    }
    if (reveal) {
      return `🔍 Cracked the code! Just revealed a hidden clue in VaultWars. The hunt continues! #VaultWars #Steganography`;
    }
    if (evolution) {
      return `🌌 COSMIC EVOLUTION! My NFT #${evolution.tokenId} just reached Level ${evolution.level} in VaultWars! The transformation is real! #VaultWars #NFT`;
    }
    return 'Playing VaultWars - the ultimate steganography battle arena! #VaultWars #Web3Gaming';
  };

  const generateShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (evolution) {
      return `${baseUrl}/gallery?tokenId=${evolution.tokenId}`;
    }
    return baseUrl;
  };

  const handleNostrShare = async () => {
    setIsSharing(true);
    try {
      const shareText = generateShareText();
      const shareUrl = generateShareUrl();

      // Create Nostr event
      const event = {
        kind: 1,
        content: `${shareText}\n\n${shareUrl}`,
        tags: [
          ['t', 'vaultwars'],
          ['t', 'web3gaming'],
          ['t', 'nft'],
          ['r', shareUrl]
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: '', // Would be filled by Nostr extension
        id: '',
        sig: ''
      };

      // Check if Nostr extension is available
      if (typeof window !== 'undefined' && (window as any).nostr) {
        await (window as any).nostr.signEvent(event);
        audioManager.playLevelUp(); // Success sound
        setShowZapPrompt(true);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert('Nostr not available. Share text copied to clipboard!');
      }
    } catch (error) {
      console.error('Nostr sharing failed:', error);
      alert('Sharing failed. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleTwitterShare = () => {
    const shareText = generateShareText();
    const shareUrl = generateShareUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=VaultWars,Web3Gaming`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleZapPrompt = () => {
    setShowZapPrompt(true);
  };

  const handleZap = (amount: number) => {
    // In a real implementation, this would integrate with a Nostr wallet
    alert(`Zapping ${amount} sats! (This would integrate with your Nostr wallet)`);
    setShowZapPrompt(false);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Nostr Share */}
      <button
        onClick={handleNostrShare}
        disabled={isSharing}
        className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-all duration-200 text-sm font-medium"
      >
        <span>{isSharing ? '📡' : '🟣'}</span>
        <span>{isSharing ? 'Sharing...' : 'Nostr'}</span>
      </button>

      {/* Twitter Share */}
      <button
        onClick={handleTwitterShare}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 text-sm font-medium"
      >
        <span>🐦</span>
        <span>Twitter</span>
      </button>

      {/* Zap Button */}
      <button
        onClick={handleZapPrompt}
        className="flex items-center space-x-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-200 text-sm font-medium"
      >
        <span>⚡</span>
        <span>Zap</span>
      </button>

      {/* Zap Prompt Modal */}
      {showZapPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowZapPrompt(false)} />
          <div className="relative bg-gradient-to-br from-yellow-900/90 to-orange-900/90 rounded-2xl p-6 border border-yellow-500/30 shadow-2xl pointer-events-auto max-w-sm mx-4">
            <h3 className="text-yellow-400 font-bold text-lg mb-4 text-center">
              ⚡ Send a Zap!
            </h3>
            <p className="text-yellow-200 text-sm mb-4 text-center">
              Support the creator and show your appreciation!
            </p>
            <div className="flex gap-2 justify-center">
              {[21, 100, 500, 1000].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleZap(amount)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  {amount}⚡
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowZapPrompt(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialShare;

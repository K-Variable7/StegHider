'use client';

import { useState, useEffect } from 'react';
import { audioManager } from '../utils/audioUtils';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Play achievement sound
      audioManager.playLevelUp();
      
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 500); // Wait for exit animation
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement || !isVisible) return null;

  const rarityColors = {
    common: 'from-gray-400 to-gray-600 border-gray-400',
    rare: 'from-blue-400 to-blue-600 border-blue-400',
    epic: 'from-purple-400 to-purple-600 border-purple-400',
    legendary: 'from-yellow-400 to-yellow-600 border-yellow-400'
  };

  const rarityGlow = {
    common: 'shadow-gray-400/50',
    rare: 'shadow-blue-400/50',
    epic: 'shadow-purple-400/50',
    legendary: 'shadow-yellow-400/50'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Achievement Card */}
      <div 
        className={`
          relative max-w-sm sm:max-w-md mx-auto pointer-events-auto
          transform transition-all duration-500 ease-out
          ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-8'}
        `}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r ${rarityColors[achievement.rarity]} opacity-30`} />
        
        <div className={`
          relative bg-gradient-to-br ${rarityColors[achievement.rarity]}
          rounded-2xl p-4 sm:p-6 border-2 shadow-2xl ${rarityGlow[achievement.rarity]}
          transform transition-all duration-300
        `}>
          {/* Header */}
          <div className="text-center mb-3 sm:mb-4">
            <div className="text-4xl sm:text-6xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">
              Achievement Unlocked!
            </h2>
            <div className="inline-block px-2 sm:px-3 py-1 bg-black/20 rounded-full text-xs sm:text-sm text-white font-medium">
              {achievement.rarity.toUpperCase()}
            </div>
          </div>

          {/* Achievement Details */}
          <div className="text-center mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              {achievement.title}
            </h3>
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
              {achievement.description}
            </p>
          </div>

          {/* Points */}
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <span className="text-yellow-300 text-base sm:text-lg">⭐</span>
            <span className="text-white font-bold text-base sm:text-lg">
              +{achievement.points} Points
            </span>
          </div>

          {/* Progress bar animation */}
          <div className="w-full bg-black/20 rounded-full h-2 mb-3 sm:mb-4 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: isAnimating ? '100%' : '0%' }}
            />
          </div>

          {/* Close hint */}
          <div className="text-center text-white/60 text-xs">
            Auto-closing in a few seconds...
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${20 + i * 12}%`,
                top: `${10 + (i % 2) * 60}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_MINT: {
    id: 'first_mint',
    title: 'Vault Initiate',
    description: 'Mint your first clue NFT and join the VaultWars!',
    icon: '🗝️',
    rarity: 'common' as const,
    points: 10
  },
  FIRST_REVEAL: {
    id: 'first_reveal',
    title: 'Mystery Solver',
    description: 'Successfully reveal your first hidden clue!',
    icon: '🔍',
    rarity: 'common' as const,
    points: 25
  },
  FIRST_STEAL: {
    id: 'first_steal',
    title: 'Shadow Thief',
    description: 'Execute your first successful clue theft!',
    icon: '🗡️',
    rarity: 'rare' as const,
    points: 50
  },
  LEVEL_5: {
    id: 'level_5',
    title: 'Rising Champion',
    description: 'Reach level 5 and prove your dedication!',
    icon: '⭐',
    rarity: 'rare' as const,
    points: 100
  },
  FACTION_CHAMPION: {
    id: 'faction_champion',
    title: 'Faction Champion',
    description: 'Lead your faction to victory in a tournament!',
    icon: '👑',
    rarity: 'epic' as const,
    points: 500
  },
  VAULT_MASTER: {
    id: 'vault_master',
    title: 'Vault Master',
    description: 'Collect 100 clues and master the art of steganography!',
    icon: '🎖️',
    rarity: 'legendary' as const,
    points: 1000
  }
};

export default AchievementPopup;

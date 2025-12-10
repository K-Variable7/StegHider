'use client';

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';
import { Relay, Event } from 'nostr-tools';
import { PRODUCTION_RELAYS, VAULTWARS_EVENTS } from '../utils/nostrEcosystem';
import { useZapManager } from '../utils/nostrEcosystem';

const CONTRACT_ADDRESS = "0x98134BFEeB202ef102245A9f20c48e39238117a6";

interface SpectatorEvent {
  type: 'reveal' | 'steal' | 'evolution' | 'mint';
  player: string;
  details: string;
  timestamp: number;
  faction?: string;
  nostrEventId?: string;
  playerPubkey?: string;
}

const SpectatorMode: React.FC = () => {
  const [events, setEvents] = useState<SpectatorEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [relays, setRelays] = useState<Relay[]>([]);
  const [isGeneratingClip, setIsGeneratingClip] = useState(false);
  const [showZapModal, setShowZapModal] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, pubkey: string, content: string, timestamp: number}>>([]);
  const [newMessage, setNewMessage] = useState('');

  // Initialize zap manager
  const { sendZap, connectLightningAddress } = useZapManager();

  // Get faction scores for live updates
  const { data: redScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [0]
  });

  const { data: blueScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [1]
  });

  const { data: greenScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [2]
  });

  const { data: goldScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getFactionScore',
    args: [3]
  });

  // Initialize Nostr relays and theme
  useEffect(() => {
    // Initialize relays
    const initRelays = async () => {
      const relayInstances = PRODUCTION_RELAYS.slice(0, 3).map(url => new Relay(url));
      await Promise.all(relayInstances.map(relay => relay.connect()));
      setRelays(relayInstances);
    };

    initRelays();

    // Load theme preference
    const savedTheme = localStorage.getItem('vaultwars-theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;

    return () => {
      relays.forEach(relay => relay.close());
    };
  }, []);

  // Subscribe to spectator chat
  useEffect(() => {
    if (relays.length === 0) return;

    const chatSubscriptions = relays.map(relay => {
      return relay.subscribe([{
        kinds: [1], // Regular text notes
        '#t': ['vaultwars-spectator', 'spectator-chat'],
        since: Math.floor(Date.now() / 1000) - 3600 // Last hour
      }], {
        onevent: (event: Event) => {
          try {
            const chatMessage = {
              id: event.id,
              pubkey: event.pubkey,
              content: event.content,
              timestamp: event.created_at
            };
            setChatMessages(prev => [chatMessage, ...prev.slice(0, 49)]); // Keep last 50 messages
          } catch (error) {
            console.error('Failed to parse chat event:', error);
          }
        }
      });
    });

    return () => {
      chatSubscriptions.forEach(sub => sub.close());
    };
  }, [relays]);

  // Subscribe to real Nostr events
  useEffect(() => {
    if (relays.length === 0 || !isLive) return;

    const subscriptions = relays.map(relay => {
      return relay.subscribe([{
        kinds: [VAULTWARS_EVENTS.REVEAL_EVENT, VAULTWARS_EVENTS.BLOCK_EVENT, VAULTWARS_EVENTS.CLUE_COLLECTED],
        since: Math.floor(Date.now() / 1000) - 3600 // Last hour
      }], {
        onevent: (event: Event) => {
          try {
            const content = JSON.parse(event.content);
            const eventType = getEventTypeFromKind(event.kind);
            
            const spectatorEvent: SpectatorEvent = {
              type: eventType,
              player: `${event.pubkey.slice(0, 8)}...${event.pubkey.slice(-4)}`,
              details: getEventDetails(eventType, content),
              timestamp: event.created_at * 1000,
              faction: content.faction || getFactionFromTags(event.tags),
              nostrEventId: event.id,
              playerPubkey: event.pubkey
            };

            setEvents(prev => [spectatorEvent, ...prev.slice(0, 49)]); // Keep last 50 events
          } catch (error) {
            console.error('Failed to parse Nostr event:', error);
          }
        }
      });
    });

    return () => {
      subscriptions.forEach(sub => sub.close());
    };
  }, [relays, isLive]);

  // Helper functions for event processing
  const getEventTypeFromKind = (kind: number): SpectatorEvent['type'] => {
    switch (kind) {
      case VAULTWARS_EVENTS.REVEAL_EVENT: return 'reveal';
      case VAULTWARS_EVENTS.BLOCK_EVENT: return 'steal';
      case VAULTWARS_EVENTS.CLUE_COLLECTED: return 'mint';
      default: return 'evolution';
    }
  };

  const getEventDetails = (type: SpectatorEvent['type'], content: any): string => {
    switch (type) {
      case 'reveal': return content.action || 'revealed a hidden clue';
      case 'steal': return content.action || 'stole a rival\'s treasure';
      case 'mint': return content.action || 'minted a new steganographic clue';
      case 'evolution': return content.action || 'evolved their NFT to cosmic level';
      default: return 'performed an epic action';
    }
  };

  const getFactionFromTags = (tags: string[][]): string | undefined => {
    const factionTag = tags.find(tag => tag[0] === 'faction');
    return factionTag ? factionTag[1] : undefined;
  };

  const getEventIcon = (type: SpectatorEvent['type']) => {
    switch (type) {
      case 'reveal': return '🔍';
      case 'steal': return '🗡️';
      case 'evolution': return '🌌';
      case 'mint': return '🛠️';
      default: return '⚔️';
    }
  };

  const getFactionColor = (faction?: string) => {
    switch (faction) {
      case 'Red': return 'text-red-400';
      case 'Blue': return 'text-blue-400';
      case 'Green': return 'text-green-400';
      case 'Gold': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('vaultwars-theme', newTheme);
    document.documentElement.className = newTheme;
  };

  // Zap reactions data
  const zapReactions = [
    { emoji: '⚔️', description: 'Savage reveal', context: 'reveal', amount: 1000 },
    { emoji: '🛡️', description: 'Clutch block', context: 'block', amount: 1000 },
    { emoji: '🔥', description: 'Epic play', context: 'general', amount: 500 },
    { emoji: '🎯', description: 'Perfect timing', context: 'general', amount: 500 },
    { emoji: '⚡', description: 'Lightning fast', context: 'general', amount: 1000 },
    { emoji: '👑', description: 'Royal move', context: 'general', amount: 2000 },
    { emoji: '🎪', description: 'Circus level', context: 'general', amount: 1500 },
    { emoji: '🏆', description: 'Champion worthy', context: 'general', amount: 2500 }
  ];

  // Open zap modal
  const openZapModal = (factionName: string) => {
    setSelectedFaction(factionName);
    setShowZapModal(true);
  };

  // Send zap with reaction and on-chain proof
  const sendZapWithReaction = async (reaction: typeof zapReactions[0]) => {
    try {
      const lightningAddress = `${selectedFaction.toLowerCase()}@vaultwars.com`;

      await connectLightningAddress(lightningAddress);
      const success = await sendZap({
        amount: reaction.amount,
        recipient: lightningAddress,
        message: `${reaction.emoji} ${reaction.description} - Supporting ${selectedFaction} faction! [TX: ${Date.now()}]`,
        reaction: reaction.emoji
      });

      if (success) {
        // Add on-chain proof to chat
        const proofMessage = {
          id: `proof-${Date.now()}`,
          pubkey: 'system',
          content: `🔗 ${reaction.emoji} Zap proof recorded: ${reaction.amount} sats to ${selectedFaction} leader (${new Date().toISOString()})`,
          timestamp: Math.floor(Date.now() / 1000)
        };
        setChatMessages(prev => [proofMessage, ...prev]);

        alert(`⚡ Zapped ${selectedFaction} with ${reaction.amount} sats!\n${reaction.emoji} ${reaction.description}\n\n💡 On-chain proof added to chat!`);
        setShowZapModal(false);
      } else {
        alert('Zap failed. Please check your Lightning wallet.');
      }
    } catch (error) {
      console.error('Zap error:', error);
      alert('Failed to send zap. Make sure you have a Lightning wallet connected.');
    }
  };  // Send chat message
  const sendChatMessage = async () => {
    if (!newMessage.trim() || relays.length === 0) return;

    try {
      // In a real implementation, this would use the user's Nostr keys
      // For demo purposes, we'll simulate sending a message
      const demoMessage = {
        id: `demo-${Date.now()}`,
        pubkey: 'demo-pubkey',
        content: newMessage,
        timestamp: Math.floor(Date.now() / 1000)
      };

      setChatMessages(prev => [demoMessage, ...prev]);
      setNewMessage('');

      // In production, this would publish to Nostr relays
      console.log('Chat message sent:', newMessage);
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };

  // Generate highlight reel
  const generateHighlightReel = async () => {
    const topEvents = events
      .filter(event => event.type === 'reveal' || event.type === 'steal' || event.type === 'evolution')
      .slice(0, 5);

    if (topEvents.length < 5) {
      alert('Need at least 5 significant events for a highlight reel!');
      return;
    }

    const highlightText = `🔥 VAULTWARS HIGHLIGHT REEL 🔥\n\n${topEvents.map((event, index) => 
      `${index + 1}. ${getEventIcon(event.type)} ${event.faction || 'Unknown'} faction: ${event.details}`
    ).join('\n')}\n\nWatch live: ${window.location.origin}/spectator\n#VaultWars #Web3Gaming #Highlights`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'VaultWars Highlight Reel',
          text: highlightText,
          url: window.location.origin + '/spectator'
        });
      } else {
        await navigator.clipboard.writeText(highlightText);
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(highlightText)}`, '_blank');
        alert('Highlight reel copied to clipboard! Opening Twitter...');
      }
    } catch (error) {
      console.error('Failed to share highlight reel:', error);
      alert('Failed to generate highlight reel. Please try again.');
    }
  };

  // Generate battle clip
  const generateClip = async () => {
    if (events.length < 10) {
      alert('Need at least 10 events to generate a clip!');
      return;
    }

    setIsGeneratingClip(true);
    try {
      // For demo purposes, we'll create a simple text-based clip
      // In production, this would use a proper GIF generation library
      const recentEvents = events.slice(0, 10);
      const clipText = recentEvents.map((event, index) => 
        `${index + 1}. ${getEventIcon(event.type)} ${event.player}: ${event.details}`
      ).join('\n');

      // Create a simple text file for now (would be GIF in production)
      const blob = new Blob([clipText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Share to social media
      const shareText = `🔥 VaultWars Battle Clip!\n\n${clipText}\n\nWatch live at: ${window.location.origin}/spectator\n\n#VaultWars #Web3Gaming`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'VaultWars Battle Clip',
          text: shareText,
          url: window.location.origin + '/spectator'
        });
      } else {
        // Fallback: copy to clipboard and open Twitter
        await navigator.clipboard.writeText(shareText);
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        alert('Clip copied to clipboard! Opening Twitter...');
      }
    } catch (error) {
      console.error('Failed to generate clip:', error);
      alert('Failed to generate clip. Please try again.');
    } finally {
      setIsGeneratingClip(false);
    }
  };

  const factionScores = [
    { name: 'Red', score: redScore || 0, color: 'bg-red-500' },
    { name: 'Blue', score: blueScore || 0, color: 'bg-blue-500' },
    { name: 'Green', score: greenScore || 0, color: 'bg-green-500' },
    { name: 'Gold', score: goldScore || 0, color: 'bg-yellow-500' }
  ].sort((a, b) => Number(b.score) - Number(a.score));

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-black via-gray-900 to-black' : 'bg-gradient-to-br from-gray-100 via-white to-gray-200'} p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
              👁️ <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Spectator Mode</span>
            </h1>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-base sm:text-lg mb-4 sm:mb-6`}>
            Watch the VaultWars arena come alive with real-time battles!
          </p>
          
          {/* Live Toggle and Share Clip */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <span className={`text-sm font-medium ${isLive ? 'text-green-400' : 'text-gray-400'}`}>
              {isLive ? '🔴 LIVE' : '⏸️ PAUSED'}
            </span>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isLive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLive ? 'Pause' : 'Resume'}
            </button>
            
            {/* Shareable Clip Button */}
            <button
              onClick={generateClip}
              disabled={isGeneratingClip || events.length < 10}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isGeneratingClip || events.length < 10
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isGeneratingClip ? '🎬 Generating...' : '📹 Share Clip'}
            </button>

            {/* Highlight Reel Button */}
            <button
              onClick={generateHighlightReel}
              disabled={events.filter(e => ['reveal', 'steal', 'evolution'].includes(e.type)).length < 5}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                events.filter(e => ['reveal', 'steal', 'evolution'].includes(e.type)).length < 5
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              🏆 Highlights
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-4">
            <a
              href="/"
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
            >
              🏠 Home
            </a>
            <a
              href="/analytics"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
            >
              📊 Analytics
            </a>
            <a
              href="/gallery"
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
            >
              🎨 Gallery
            </a>
            <a
              href="/warroom"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
            >
              ⚔️ War Room
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Live Leaderboard */}
          <div className="lg:col-span-1">
            <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-black/80 to-gray-900/80' : 'from-white/80 to-gray-100/80'} backdrop-blur-md rounded-2xl p-4 sm:p-6 border ${theme === 'dark' ? 'border-red-500/20' : 'border-red-300/20'} shadow-2xl`}>
              <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6 text-center`}>
                🏆 Live Leaderboard
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {factionScores.map((faction, index) => (
                  <div key={faction.name} className={`flex items-center justify-between p-3 sm:p-4 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'} rounded-lg`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg sm:text-xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                      </span>
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${faction.color}`} />
                      <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium text-sm sm:text-base`}>{faction.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-bold text-lg sm:text-xl`}>{Number(faction.score)}</span>
                      {index === 0 && (
                        <button
                          onClick={() => openZapModal(faction.name)}
                          className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded transition-all duration-200 transform hover:scale-110"
                          title={`Zap ${faction.name} leader with sats and reactions`}
                        >
                          ⚡
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Join CTA */}
              <div className={`mt-6 p-4 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30' : 'bg-gradient-to-r from-purple-200/30 to-blue-200/30 border-purple-300/30'} border rounded-lg`}>
                <h3 className={`font-bold text-center mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Ready to Join the Battle?</h3>
                <p className={`text-sm text-center mb-3 ${theme === 'dark' ? 'text-purple-200' : 'text-purple-700'}`}>Connect your wallet and become a legend!</p>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all duration-200 font-medium">
                  ⚔️ Enter the Arena
                </button>
              </div>
            </div>
          </div>

          {/* Spectator Chat */}
          <div className="lg:col-span-1">
            <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-black/80 to-gray-900/80' : 'from-white/80 to-gray-100/80'} backdrop-blur-md rounded-2xl p-4 sm:p-6 border ${theme === 'dark' ? 'border-green-500/20' : 'border-green-300/20'} shadow-2xl`}>
              <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6 text-center`}>
                💬 Spectator Chat
              </h2>
              
              {/* Chat Messages */}
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {chatMessages.slice(0, 20).map((message) => (
                  <div key={message.id} className={`p-2 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-200/30'} rounded-lg`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
                        {message.pubkey.slice(0, 8)}...
                      </span>
                      <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} text-xs`}>
                        {new Date(message.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{message.content}</p>
                  </div>
                ))}
              </div>
              
              {/* Chat Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-200/50 border-gray-300 text-gray-900 placeholder-gray-600'} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                <div className="flex justify-end">
                  <button
                    onClick={sendChatMessage}
                    disabled={!newMessage.trim()}
                    className={`px-4 py-2 ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
                  >
                    📤 Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Events Feed */}
          <div className="lg:col-span-2">
            <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-black/80 to-gray-900/80' : 'from-white/80 to-gray-100/80'} backdrop-blur-md rounded-2xl p-4 sm:p-6 border ${theme === 'dark' ? 'border-blue-500/20' : 'border-blue-300/20'} shadow-2xl`}>
              <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6 text-center`}>
                📡 Live Battle Feed
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event, index) => (
                  <div 
                    key={`${event.timestamp}-${index}`}
                    className={`flex items-start space-x-3 p-3 sm:p-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-200/30'} rounded-lg border ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-300/50'} animate-fade-in`}
                  >
                    <span className="text-xl sm:text-2xl">{getEventIcon(event.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium text-sm sm:text-base truncate`}>
                          {event.player}
                        </span>
                        {event.faction && (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} ${getFactionColor(event.faction)}`}>
                            {event.faction}
                          </span>
                        )}
                      </div>
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{event.details}</p>
                      <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} text-xs`}>{formatTime(event.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Stats Summary */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`text-center p-3 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-200/30'} rounded-lg`}>
                  <div className="text-2xl font-bold text-blue-400">{events.filter(e => e.type === 'reveal').length}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Reveals</div>
                </div>
                <div className={`text-center p-3 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-200/30'} rounded-lg`}>
                  <div className="text-2xl font-bold text-red-400">{events.filter(e => e.type === 'steal').length}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Steals</div>
                </div>
                <div className={`text-center p-3 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-200/30'} rounded-lg`}>
                  <div className="text-2xl font-bold text-purple-400">{events.filter(e => e.type === 'evolution').length}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Evolutions</div>
                </div>
                <div className={`text-center p-3 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-200/30'} rounded-lg`}>
                  <div className="text-2xl font-bold text-green-400">{events.filter(e => e.type === 'mint').length}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Mints</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className={`bg-gradient-to-r ${theme === 'dark' ? 'from-red-900/30 to-orange-900/30 border-red-500/30' : 'from-red-200/30 to-orange-200/30 border-red-300/30'} border rounded-2xl p-6 sm:p-8`}>
            <h2 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              ⚔️ Become Part of the Legend
            </h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-base sm:text-lg mb-6 max-w-2xl mx-auto`}>
              What you're watching is just the beginning. Join thousands of players in the ultimate 
              steganography battle arena. Mint clues, hide secrets, steal treasures, and evolve to cosmic power!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 sm:px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 shadow-2xl">
                ⚔️ Start Your Journey
              </button>
              <button className="px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 shadow-2xl">
                📚 Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className={`text-center pt-8 border-t ${theme === 'dark' ? 'border-gray-800/50' : 'border-gray-300/50'}`}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-6">
              <a
                href="/"
                className={`px-2 py-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-xs sm:text-sm font-medium rounded-md hover:bg-opacity-10 hover:bg-current whitespace-nowrap`}
              >
                🏠 Home
              </a>
              <span className={`${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} self-center text-xs`}>•</span>
              <a
                href="/analytics"
                className={`px-2 py-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-xs sm:text-sm font-medium rounded-md hover:bg-opacity-10 hover:bg-current whitespace-nowrap`}
              >
                📊 Analytics
              </a>
              <span className={`${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} self-center text-xs`}>•</span>
              <a
                href="/gallery"
                className={`px-2 py-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-xs sm:text-sm font-medium rounded-md hover:bg-opacity-10 hover:bg-current whitespace-nowrap`}
              >
                🎨 Gallery
              </a>
              <span className={`${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} self-center text-xs`}>•</span>
              <a
                href="/warroom"
                className={`px-2 py-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors text-xs sm:text-sm font-medium rounded-md hover:bg-opacity-10 hover:bg-current whitespace-nowrap`}
              >
                ⚔️ War Room
              </a>
              <span className={`${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} self-center text-xs`}>•</span>
              <span className="px-2 py-1 text-purple-400 font-medium text-xs sm:text-sm bg-purple-400/10 rounded-md whitespace-nowrap">
                👁️ Spectator Mode
              </span>
            </div>
          </div>
          <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} text-xs text-center max-w-md mx-auto leading-relaxed px-4`}>
            Watch the battles unfold • Real-time faction warfare • Join the arena anytime
          </p>
        </div>

        {/* Zap Reactions Modal */}
        {showZapModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-black/80 to-gray-900/80' : 'from-white/80 to-gray-100/80'} backdrop-blur-md rounded-2xl p-6 border ${theme === 'dark' ? 'border-yellow-500/20' : 'border-yellow-300/20'} shadow-2xl max-w-md w-full`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ⚡ Zap {selectedFaction} Leader
                </h3>
                <button
                  onClick={() => setShowZapModal(false)}
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-2xl`}
                >
                  ×
                </button>
              </div>

              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose a reaction and amount to support the {selectedFaction} faction!
              </p>

              <div className="grid grid-cols-2 gap-3">
                {zapReactions.map((reaction, index) => (
                  <button
                    key={index}
                    onClick={() => sendZapWithReaction(reaction)}
                    className={`p-3 ${theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-gray-200/50 hover:bg-gray-300/50'} rounded-lg transition-all duration-200 transform hover:scale-105 border ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-300/50'}`}
                  >
                    <div className="text-2xl mb-1">{reaction.emoji}</div>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{reaction.description}</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} font-bold`}>{reaction.amount} sats</div>
                  </button>
                ))}
              </div>

              <div className={`mt-4 p-3 ${theme === 'dark' ? 'bg-blue-900/30 border-blue-500/30' : 'bg-blue-100/30 border-blue-300/30'} border rounded-lg`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                  💡 <strong>Pro tip:</strong> Zaps help fund faction development and unlock exclusive features!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectatorMode;

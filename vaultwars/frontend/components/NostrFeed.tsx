'use client';

import { useEffect, useState } from 'react';
import { Relay, Event, getPublicKey, finalizeEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils.js';
import { useAccount } from 'wagmi';
import { useNostrIdentity } from '../utils/nostrIdentity';
import { VAULTWARS_EVENTS, PRODUCTION_RELAYS } from '../utils/nostrEcosystem';

interface NostrFeedProps {
  faction: string;
  onBroadcastReady?: (broadcastFn: (type: 'random' | 'block', duration: number, fee: string, numReveals?: number) => void) => void;
}

export default function NostrFeed({ faction, onBroadcastReady }: NostrFeedProps) {
  const { address } = useAccount();
  const { deriveNostrKeyFromWallet } = useNostrIdentity();
  const [publicKey, setPublicKey] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [revealEvents, setRevealEvents] = useState<Event[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [relay, setRelay] = useState<Relay | null>(null);
  const [message, setMessage] = useState('');
  const [isDerivingKeys, setIsDerivingKeys] = useState(false);
  const [keysDerived, setKeysDerived] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const connectToRelay = async () => {
      let connectedRelay: Relay | null = null;

      for (const relayUrl of PRODUCTION_RELAYS.slice(0, 3)) { // Try first 3 relays
        try {
          const r = new Relay(relayUrl);
          await r.connect();
          connectedRelay = r;
          setRelay(r);
          console.log(`Connected to Nostr relay: ${relayUrl}`);

          // Subscribe to faction events using standardized schema
          const sub = r.subscribe([{
            kinds: [VAULTWARS_EVENTS.GAME_EVENT, VAULTWARS_EVENTS.REVEAL_EVENT, VAULTWARS_EVENTS.BLOCK_EVENT],
            '#t': ['vaultwars']
          }], {
            onevent: (event: Event) => {
              console.log('Received Nostr event:', event);

              // Check if this event is for our faction
              const hasFactionTag = event.tags.some(tag =>
                tag[0] === 't' && tag[1] === faction.toLowerCase()
              );

              // Only process events that are either for our faction or general vaultwars events
              if (!hasFactionTag && !event.tags.some(tag => tag[0] === 't' && tag[1] === 'vaultwars')) {
                return; // Skip events that don't match our filters
              }

              // Check if it's a reveal/block event using standardized tags
              const isRevealEvent = event.tags.some(tag =>
                tag[0] === 't' && (tag[1] === 'reveal' || tag[1] === 'random-reveal' || tag[1] === 'block-reveal')
              );

              if (isRevealEvent) {
                setRevealEvents(prev => [event, ...prev.slice(0, 4)]);
              } else {
                setEvents(prev => [event, ...prev.slice(0, 9)]);
              }
            }
          });
          break; // Successfully connected, stop trying other relays
        } catch (error) {
          console.warn(`Failed to connect to ${relayUrl}:`, error);
        }
      }

      if (!connectedRelay) {
        console.error('Failed to connect to any Nostr relay');
      }

      return connectedRelay;
    };

    // Connect to relay
    connectToRelay();

    // Return cleanup function from useEffect
    return () => {
      if (relay) {
        relay.close();
      }
    };
  }, [address, faction]);

  const deriveKeysIfNeeded = async () => {
    if (keysDerived) return true; // Already have keys
    if (isDerivingKeys) return false; // Already deriving

    try {
      setIsDerivingKeys(true);
      setKeyError(null);
      console.log('Deriving Nostr keys from wallet...');

      const keys = await deriveNostrKeyFromWallet();
      if (keys) {
        setPrivateKey(keys.privateKey);
        setPublicKey(keys.publicKey);
        setKeysDerived(true);
        console.log('Nostr keys derived successfully');
        return true;
      } else {
        setKeyError('Failed to derive Nostr keys');
        return false;
      }
    } catch (error) {
      console.error('Key derivation failed:', error);
      setKeyError('MetaMask signature required for Nostr messaging');
      return false;
    } finally {
      setIsDerivingKeys(false);
    }
  };

  const postMessage = async () => {
    if (!relay || !message.trim()) return;

    // Derive keys if we don't have them yet
    const keysReady = await deriveKeysIfNeeded();
    if (!keysReady || !privateKey) return;

    const eventTemplate = {
      kind: VAULTWARS_EVENTS.GAME_EVENT,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'vaultwars'],
        ['t', faction],
        ['game', 'vaultwars'],
        ['faction', faction]
      ],
      content: message,
    };

    const event = finalizeEvent(eventTemplate, hexToBytes(privateKey));
    await relay.publish(event);
    setMessage('');
  };

  const postTestEvents = async () => {
    if (!relay) return;

    // Derive keys if we don't have them yet
    const keysReady = await deriveKeysIfNeeded();
    if (!keysReady || !privateKey) return;

    const testMessages = [
      `🏰 Welcome to the ${faction} faction war room! Coordinate your steganographic hunts here.`,
      `🎯 ${faction} faction is assembling! Ready to hunt for hidden clues in images?`,
      `⚔️ ${faction} warriors: Remember to use StegHide to extract clues from images you find!`,
      `🎨 Pro tip: High-quality PNG images work best for steganography. Share your finds!`
    ];

    for (const testMsg of testMessages) {
      const eventTemplate = {
        kind: VAULTWARS_EVENTS.GAME_EVENT,
        pubkey: publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['t', 'vaultwars'],
          ['t', faction.toLowerCase()],
          ['game', 'vaultwars'],
          ['faction', faction.toLowerCase()]
        ],
        content: testMsg,
      };

      const event = finalizeEvent(eventTemplate, hexToBytes(privateKey));
      await relay.publish(event);
      
      // Small delay between posts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const broadcastRevealEvent = async (type: 'random' | 'block', duration: number, fee: string, numReveals?: number) => {
    if (!relay) return;

    // Derive keys if we don't have them yet
    const keysReady = await deriveKeysIfNeeded();
    if (!keysReady || !privateKey) return;

    const eventKind = type === 'random' ? VAULTWARS_EVENTS.REVEAL_EVENT : VAULTWARS_EVENTS.BLOCK_EVENT;
    const content = type === 'random' 
      ? `🚨 RANDOM REVEAL ALERT! ${numReveals} clues exposed for ${duration}h! Fee: ${fee} ETH. Stay vigilant, ${faction}!`
      : `🛡️ BLOCK REVEAL ACTIVATED! All reveals blocked for ${duration}h. Fee: ${fee} ETH. Strategic defense by ${faction}!`;

    const eventTemplate = {
      kind: eventKind,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'vaultwars'],
        ['t', faction],
        ['t', 'reveal'],
        ['t', type === 'random' ? 'random-reveal' : 'block-reveal'],
        ['faction', faction],
        ['duration', duration.toString()],
        ['fee', fee],
        ['game', 'vaultwars'],
        ['network', 'base-sepolia']
      ],
      content,
    };

    if (type === 'random' && numReveals) {
      eventTemplate.tags.push(['num-reveals', numReveals.toString()]);
    }

    const event = finalizeEvent(eventTemplate, hexToBytes(privateKey));
    await relay.publish(event);
  };

  // Expose broadcast function to parent component
  useEffect(() => {
    if (onBroadcastReady && relay && keysDerived && privateKey) {
      onBroadcastReady(broadcastRevealEvent);
    }
  }, [onBroadcastReady, relay, keysDerived, privateKey]);

  if (!address) return <div className="text-white">Connect wallet to access faction feed</div>;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-4">{faction} War Room (Nostr)</h3>
      
      {/* Reveal Alerts */}
      {revealEvents.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-red-400 mb-3">🚨 Reveal Alerts</h4>
          <div className="space-y-2">
            {revealEvents.map((event, i) => (
              <div key={i} className="bg-red-900/50 border border-red-500 p-3 rounded text-white animate-pulse">
                <p className="text-sm">{event.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(event.created_at * 1000).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post Message */}
      <div className="mb-4">
        {/* Key Status */}
        {keyError && (
          <div className="mb-3 p-3 bg-red-900/50 border border-red-500/50 rounded text-red-300 text-sm">
            ⚠️ {keyError}
          </div>
        )}
        
        {isDerivingKeys && (
          <div className="mb-3 p-3 bg-blue-900/50 border border-blue-500/50 rounded text-blue-300 text-sm">
            🔄 Generating Nostr keys from your wallet...
          </div>
        )}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Post a taunt or strategy..."
          className="w-full p-3 bg-black/50 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            onClick={postMessage}
            disabled={isDerivingKeys}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDerivingKeys ? '🔄' : 'Post to War Room'}
          </button>
          <button
            onClick={postTestEvents}
            disabled={isDerivingKeys}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            {isDerivingKeys ? '🔄' : 'Populate Test Feed'}
          </button>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <h4 className="text-lg font-semibold text-white mb-2">Recent Messages</h4>
        {events.length > 0 ? events.map((event, i) => (
          <div key={i} className="bg-white/5 p-3 rounded text-white">
            <p className="text-sm">{event.content}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(event.created_at * 1000).toLocaleTimeString()}
            </p>
          </div>
        )) : (
          <p className="text-gray-400 text-sm">No messages yet. Be the first to taunt your rivals!</p>
        )}
      </div>
    </div>
  );
}
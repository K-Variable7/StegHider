// utils/nostrEcosystem.ts
import { useState, useEffect } from 'react';
import { Relay, Event, finalizeEvent, getPublicKey } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils.js';
import { Invoice, LightningAddress, generateZapEvent } from '@getalby/lightning-tools';

export interface NostrWalletConnection {
  relay: string;
  secret: string;
  pubkey: string;
}

export interface ZapRequest {
  amount: number; // in sats
  recipient: string; // nostr pubkey
  message?: string;
  eventId?: string; // for zapping specific events
  reaction?: string; // emoji reaction for zaps
}

export interface ZapReaction {
  emoji: string;
  description: string;
  context: 'reveal' | 'block' | 'general';
}

export interface NFTMetadata {
  tokenId: number;
  name: string;
  description: string;
  image?: string;
  attributes: {
    faction: string;
    revealCount: number;
    lastReveal?: number;
    encryptedPreview?: string;
  };
}

// Standardized Nostr Event Kinds for VaultWars
export const VAULTWARS_EVENTS = {
  GAME_EVENT: 1, // Regular text note with game context
  REVEAL_EVENT: 30001, // Reveal action (parameterized replaceable)
  BLOCK_EVENT: 30002, // Block action (parameterized replaceable)
  CLUE_COLLECTED: 30003, // New clue minted
  FACTION_UPDATE: 30004, // Faction score updates
  ZAP_REACTION: 7, // Reaction to zaps (kind 7)
  ZAP_REQUEST: 9734, // Zap request
  ZAP_RECEIPT: 9735, // Zap receipt
  NFT_METADATA: 32123, // NIP-99 NFT metadata
  LEADERBOARD: 30078, // Custom leaderboard
  RELAY_LIST: 10002, // NIP-65 relay list
} as const;

// Battle-tested relays for production
export const PRODUCTION_RELAYS = [
  'wss://relay.damus.io',
  'wss://nostr.wine',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.current.fyi'
];

// Zap reaction presets
export const ZAP_REACTIONS: ZapReaction[] = [
  { emoji: '💀', description: 'Savage reveal', context: 'reveal' },
  { emoji: '🛡️', description: 'Clutch block', context: 'block' },
  { emoji: '🔥', description: 'Epic play', context: 'general' },
  { emoji: '🎯', description: 'Perfect timing', context: 'general' },
  { emoji: '⚡', description: 'Lightning fast', context: 'general' },
  { emoji: '👑', description: 'Royal move', context: 'general' },
  { emoji: '🎪', description: 'Circus level', context: 'general' },
  { emoji: '🏆', description: 'Champion worthy', context: 'general' }
];

// Nostr Wallet Connect implementation
export class NostrWalletConnect {
  private relay: Relay | null = null;
  private connection: NostrWalletConnection | null = null;

  async connect(relayUrl: string, walletPubkey: string): Promise<NostrWalletConnection> {
    this.relay = new Relay(relayUrl);

    // Generate a connection secret
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const secretHex = Array.from(secret).map(b => b.toString(16).padStart(2, '0')).join('');

    this.connection = {
      relay: relayUrl,
      secret: secretHex,
      pubkey: walletPubkey
    };

    await this.relay.connect();
    return this.connection;
  }

  async requestPayment(amount: bigint, description: string): Promise<string> {
    if (!this.relay || !this.connection) {
      throw new Error('Not connected to wallet');
    }

    // Create NWC payment request
    const request = {
      method: 'pay_invoice',
      params: {
        amount: amount.toString(),
        description
      }
    };

    // This would be sent to the wallet via Nostr DM
    // For now, return a placeholder
    return `nostr+walletauth://${this.connection.relay}?relay=${encodeURIComponent(this.connection.relay)}&secret=${this.connection.secret}`;
  }

  disconnect() {
    if (this.relay) {
      this.relay.close();
      this.relay = null;
    }
    this.connection = null;
  }
}

// Zaps implementation with reactions
export class ZapManager {
  private lightningAddress?: LightningAddress;
  private relay: Relay;
  private zapLeaderboard: Map<string, { totalZaps: number; reactions: Map<string, number> }> = new Map();

  constructor(relayUrl: string = PRODUCTION_RELAYS[0]) {
    this.relay = new Relay(relayUrl);
  }

  async connect() {
    await this.relay.connect();
  }

  async connectLightningAddress(address: string) {
    this.lightningAddress = new LightningAddress(address);
    await this.lightningAddress.fetch();
  }

  async sendZap(zapRequest: ZapRequest): Promise<boolean> {
    try {
      if (!this.lightningAddress) {
        throw new Error('Lightning address not connected');
      }

      // Create zap invoice with reaction context
      const message = zapRequest.reaction
        ? `${zapRequest.reaction} ${zapRequest.message || `Zap for ${zapRequest.recipient}`}`
        : zapRequest.message || `Zap for ${zapRequest.recipient}`;

      const invoice = await this.lightningAddress.requestInvoice({
        satoshi: zapRequest.amount,
        comment: message,
      });

      // Track zap for leaderboard
      this.trackZap(zapRequest.recipient, zapRequest.amount, zapRequest.reaction);

      // In a real implementation, this would open the invoice in a wallet
      console.log('Zap invoice created:', invoice);
      window.open(`lightning:${invoice.paymentRequest}`, '_blank');

      return true;
    } catch (error) {
      console.error('Failed to send zap:', error);
      return false;
    }
  }

  private trackZap(recipient: string, amount: number, reaction?: string) {
    const current = this.zapLeaderboard.get(recipient) || { totalZaps: 0, reactions: new Map() };
    current.totalZaps += amount;

    if (reaction) {
      const reactionCount = current.reactions.get(reaction) || 0;
      current.reactions.set(reaction, reactionCount + 1);
    }

    this.zapLeaderboard.set(recipient, current);
  }

  getZapLeaderboard(): Array<{ pubkey: string; totalZaps: number; topReaction?: string }> {
    return Array.from(this.zapLeaderboard.entries())
      .map(([pubkey, data]) => ({
        pubkey,
        totalZaps: data.totalZaps,
        topReaction: Array.from(data.reactions.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0]
      }))
      .sort((a, b) => b.totalZaps - a.totalZaps);
  }

  async createZapEvent(recipient: string, amount: number, message?: string, reaction?: string, privateKey?: string): Promise<Event | null> {
    if (!privateKey) return null;

    // Create a zap request event (kind 9734) with reaction support
    const zapEvent = {
      kind: VAULTWARS_EVENTS.ZAP_REQUEST,
      pubkey: getPublicKey(hexToBytes(privateKey)),
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', recipient],
        ['amount', (amount * 1000).toString()], // convert to millisats
        ['relays', ...PRODUCTION_RELAYS],
        ['t', 'vaultwars-zap']
      ],
      content: reaction ? `${reaction} ${message || `Zap of ${amount} sats`}` : message || `Zap of ${amount} sats`
    };

    // Add reaction tag if present
    if (reaction) {
      zapEvent.tags.push(['reaction', reaction]);
    }

    // Sign the event
    const signedEvent = finalizeEvent(zapEvent, hexToBytes(privateKey));
    return signedEvent;
  }

  async publishZapReaction(targetEventId: string, reaction: string, privateKey: string): Promise<string> {
    const reactionEvent = {
      kind: VAULTWARS_EVENTS.ZAP_REACTION,
      pubkey: getPublicKey(hexToBytes(privateKey)),
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['e', targetEventId],
        ['p', getPublicKey(hexToBytes(privateKey))], // self-reaction for now
        ['t', 'vaultwars-reaction']
      ],
      content: reaction
    };

    const signedEvent = finalizeEvent(reactionEvent, hexToBytes(privateKey));
    await this.relay.publish(signedEvent);
    return signedEvent.id;
  }

  disconnect() {
    this.relay.close();
  }
}

// NFT Metadata storage on Nostr with standardized schema
export class NostrNFTMetadata {
  private relays: Relay[] = [];

  constructor(relayUrls: string[] = PRODUCTION_RELAYS.slice(0, 3)) {
    this.relays = relayUrls.map(url => new Relay(url));
  }

  async connect() {
    await Promise.all(this.relays.map(relay => relay.connect()));
  }

  async storeMetadata(tokenId: number, metadata: NFTMetadata, privateKey: string): Promise<string> {
    const eventTemplate = {
      kind: VAULTWARS_EVENTS.NFT_METADATA,
      pubkey: getPublicKey(hexToBytes(privateKey)),
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', tokenId.toString()],
        ['t', 'nft-metadata'],
        ['t', 'vaultwars'],
        ['faction', metadata.attributes.faction],
        ['game', 'vaultwars'],
        ['network', 'base-sepolia']
      ],
      content: JSON.stringify({
        ...metadata,
        game: 'VaultWars',
        network: 'Base Sepolia',
        standard: 'NIP-99'
      })
    };

    const event = finalizeEvent(eventTemplate, hexToBytes(privateKey));

    // Publish to multiple relays for redundancy
    await Promise.all(this.relays.map(relay => relay.publish(event)));

    return event.id;
  }

  async getMetadata(tokenId: number): Promise<NFTMetadata | null> {
    return new Promise((resolve) => {
      let found = false;

      const subscriptions = this.relays.map(relay => {
        const sub = relay.subscribe([{
          kinds: [VAULTWARS_EVENTS.NFT_METADATA],
          '#d': [tokenId.toString()],
          '#t': ['vaultwars']
        }], {
          onevent: (event: Event) => {
            if (!found) {
              try {
                const metadata = JSON.parse(event.content);
                resolve(metadata);
                found = true;
                subscriptions.forEach(s => s.close());
              } catch (error) {
                console.error('Failed to parse metadata:', error);
              }
            }
          }
        });
        return sub;
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!found) {
          resolve(null);
          subscriptions.forEach(s => s.close());
        }
      }, 5000);
    });
  }

  disconnect() {
    this.relays.forEach(relay => relay.close());
  }
}

// Leaderboard aggregator with standardized events
export class NostrLeaderboard {
  private relays: Relay[] = [];

  constructor(relayUrls: string[] = PRODUCTION_RELAYS.slice(0, 3)) {
    this.relays = relayUrls.map(url => new Relay(url));
  }

  async connect() {
    await Promise.all(this.relays.map(relay => relay.connect()));
  }

  async publishScore(faction: string, score: number, privateKey: string): Promise<string> {
    const eventTemplate = {
      kind: VAULTWARS_EVENTS.LEADERBOARD,
      pubkey: getPublicKey(hexToBytes(privateKey)),
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', `faction-${faction}`], // parameterized replaceable
        ['t', 'leaderboard'],
        ['t', 'vaultwars'],
        ['faction', faction],
        ['score', score.toString()],
        ['game', 'vaultwars']
      ],
      content: JSON.stringify({
        faction,
        score,
        timestamp: Date.now(),
        game: 'VaultWars',
        network: 'Base Sepolia'
      })
    };

    const event = finalizeEvent(eventTemplate, hexToBytes(privateKey));

    // Publish to multiple relays
    await Promise.all(this.relays.map(relay => relay.publish(event)));

    return event.id;
  }

  async getFactionScores(): Promise<{[faction: string]: number}> {
    return new Promise((resolve) => {
      const scores: {[faction: string]: number} = {};
      let completedRelays = 0;

      this.relays.forEach(relay => {
        const sub = relay.subscribe([{
          kinds: [VAULTWARS_EVENTS.LEADERBOARD],
          '#t': ['vaultwars', 'leaderboard']
        }], {
          onevent: (event: Event) => {
            try {
              const data = JSON.parse(event.content);
              const currentScore = scores[data.faction] || 0;
              scores[data.faction] = Math.max(currentScore, data.score);
            } catch (error) {
              console.error('Failed to parse leaderboard event:', error);
            }
          },
          oneose: () => {
            completedRelays++;
            if (completedRelays === this.relays.length) {
              resolve(scores);
            }
          }
        });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(scores);
      }, 5000);
    });
  }

  disconnect() {
    this.relays.forEach(relay => relay.close());
  }
}

// NIP-65 Relay List Manager
export class RelayListManager {
  private relay: Relay;

  constructor(relayUrl: string = PRODUCTION_RELAYS[0]) {
    this.relay = new Relay(relayUrl);
  }

  async connect() {
    await this.relay.connect();
  }

  async publishRelayList(privateKey: string): Promise<string> {
    const relayList = PRODUCTION_RELAYS.map(url => ['r', url]);

    const eventTemplate = {
      kind: VAULTWARS_EVENTS.RELAY_LIST,
      pubkey: getPublicKey(hexToBytes(privateKey)),
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'vaultwars-relays'],
        ...relayList
      ],
      content: 'VaultWars recommended relay list for optimal game experience'
    };

    const event = finalizeEvent(eventTemplate, hexToBytes(privateKey));
    await this.relay.publish(event);

    return event.id;
  }

  async getRecommendedRelays(): Promise<string[]> {
    return new Promise((resolve) => {
      const sub = this.relay.subscribe([{ kinds: [VAULTWARS_EVENTS.RELAY_LIST], '#t': ['vaultwars-relays'] }], {
        onevent: (event: Event) => {
          const relayTags = event.tags.filter(tag => tag[0] === 'r').map(tag => tag[1]);
          resolve(relayTags.length > 0 ? relayTags : PRODUCTION_RELAYS);
          sub.close();
        },
        oneose: () => {
          resolve(PRODUCTION_RELAYS);
        }
      });

      // Timeout after 3 seconds
      setTimeout(() => {
        sub.close();
        resolve(PRODUCTION_RELAYS);
      }, 3000);
    });
  }

  disconnect() {
    this.relay.close();
  }
}

// React hooks for the ecosystem features
export function useNostrWalletConnect() {
  const [nwc] = useState(() => new NostrWalletConnect());

  return {
    connect: nwc.connect.bind(nwc),
    requestPayment: nwc.requestPayment.bind(nwc),
    disconnect: nwc.disconnect.bind(nwc)
  };
}

export function useZapManager() {
  const [zapManager] = useState(() => new ZapManager());

  useEffect(() => {
    zapManager.connect();
    return () => zapManager.disconnect();
  }, [zapManager]);

  return {
    connectLightningAddress: zapManager.connectLightningAddress.bind(zapManager),
    sendZap: zapManager.sendZap.bind(zapManager),
    createZapEvent: zapManager.createZapEvent.bind(zapManager),
    publishZapReaction: zapManager.publishZapReaction.bind(zapManager),
    getZapLeaderboard: zapManager.getZapLeaderboard.bind(zapManager)
  };
}

export function useNostrNFTMetadata() {
  const [metadataManager] = useState(() => new NostrNFTMetadata());

  useEffect(() => {
    metadataManager.connect();
    return () => metadataManager.disconnect();
  }, [metadataManager]);

  return {
    storeMetadata: metadataManager.storeMetadata.bind(metadataManager),
    getMetadata: metadataManager.getMetadata.bind(metadataManager)
  };
}

export function useNostrLeaderboard() {
  const [leaderboard] = useState(() => new NostrLeaderboard());

  useEffect(() => {
    leaderboard.connect();
    return () => leaderboard.disconnect();
  }, [leaderboard]);

  return {
    publishScore: leaderboard.publishScore.bind(leaderboard),
    getFactionScores: leaderboard.getFactionScores.bind(leaderboard)
  };
}

export function useRelayListManager() {
  const [relayManager] = useState(() => new RelayListManager());

  useEffect(() => {
    relayManager.connect();
    return () => relayManager.disconnect();
  }, [relayManager]);

  return {
    publishRelayList: relayManager.publishRelayList.bind(relayManager),
    getRecommendedRelays: relayManager.getRecommendedRelays.bind(relayManager)
  };
}
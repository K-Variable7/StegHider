import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { RelayPool } from 'nostr-relaypool';
import { getPublicKey, getEventHash, signEvent } from 'nostr-tools';

// Configuration
const CONTRACT_ADDRESS = '0x98134BFEeB202ef102245A9f20c48e39238117a6';
const RPC_URL = 'https://sepolia.base.org'; // Base Sepolia RPC
const RELAYS = [
  'wss://nostr.wine',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

// Bot private key (generate a new one for production!)
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || 'your-private-key-here';
const BOT_PUBLIC_KEY = getPublicKey(BOT_PRIVATE_KEY);

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL)
});

const relayPool = new RelayPool(RELAYS);

// Contract ABI for events
const LEVEL_UP_EVENT = parseAbiItem('event NFTEvolved(uint256 indexed tokenId, uint256 newLevel, uint256 newExperience)');

// Generate evolved SVG based on level
function generateEvolvedSVG(tokenId: bigint, level: number, experience: bigint, cluesCollected: number, revealsSurvived: number, stealsSuccessful: number) {
  const baseHeight = 200;
  const baseWidth = 300;
  const levelBonus = level * 10;
  const colosseumHeight = baseHeight + levelBonus;
  const colosseumWidth = baseWidth + (levelBonus / 2);

  // Faction colors (simplified - you'd get this from contract)
  const factionColors = ['#DC143C', '#4169E1', '#228B22', '#FFD700'];
  const factionColor = factionColors[Math.floor(Math.random() * factionColors.length)];

  const svg = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#98FB98;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#sky)"/>
  <rect x="${(400 - colosseumWidth) / 2}" y="${400 - colosseumHeight - 50}" width="${colosseumWidth}" height="${colosseumHeight}" fill="${factionColor}" stroke="#8B4513" stroke-width="3"/>
  <text x="200" y="30" text-anchor="middle" font-family="serif" font-size="24" fill="#FFD700">Level ${level}</text>
  <text x="200" y="370" text-anchor="middle" font-family="serif" font-size="12" fill="#000">Exp: ${experience.toString()}</text>
  <text x="200" y="385" text-anchor="middle" font-family="serif" font-size="12" fill="#000">Clues: ${cluesCollected} | Survived: ${revealsSurvived} | Steals: ${stealsSuccessful}</text>
</svg>`;

  return svg.trim();
}

// Publish metadata to Nostr
async function publishMetadata(tokenId: bigint, level: number, experience: bigint, cluesCollected: number, revealsSurvived: number, stealsSuccessful: number) {
  const svg = generateEvolvedSVG(tokenId, level, experience, cluesCollected, revealsSurvived, stealsSuccessful);

  const metadata = {
    name: `VaultWars Colosseum #${tokenId.toString()}`,
    description: `Dynamic NFT evolving with gameplay. Level ${level} - Experience: ${experience.toString()}`,
    image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    attributes: [
      { trait_type: 'Level', value: level },
      { trait_type: 'Experience', value: experience.toString() },
      { trait_type: 'Clues Collected', value: cluesCollected },
      { trait_type: 'Reveals Survived', value: revealsSurvived },
      { trait_type: 'Successful Steals', value: stealsSuccessful }
    ]
  };

  // NIP-106: Replaceable JSON metadata event
  const event = {
    kind: 1063, // Replaceable metadata
    pubkey: BOT_PUBLIC_KEY,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', `vaultwars-nft-${tokenId.toString()}`], // 'd' tag for replaceable events
      ['t', 'nft-metadata'],
      ['t', 'vaultwars']
    ],
    content: JSON.stringify(metadata)
  };

  event.id = getEventHash(event);
  event.sig = signEvent(event, BOT_PRIVATE_KEY);

  console.log(`Publishing metadata for token ${tokenId.toString()} at level ${level}`);

  // Publish to multiple relays
  await relayPool.publish(event, RELAYS);
}

// Listen for LevelUp events
async function listenForLevelUps() {
  console.log('Starting LevelUp event listener...');

  publicClient.watchEvent({
    address: CONTRACT_ADDRESS,
    event: LEVEL_UP_EVENT,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { tokenId, newLevel, newExperience } = log.args;

        console.log(`LevelUp detected: Token ${tokenId.toString()} reached level ${newLevel.toString()}`);

        try {
          // Get full evolution state
          const evolutionState = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: [parseAbiItem('function evolutionStates(uint256) view returns (uint256,uint256,uint256,uint256,uint256,uint256,string)')],
            functionName: 'evolutionStates',
            args: [tokenId]
          });

          const [level, experience, cluesCollected, revealsSurvived, stealsSuccessful] = evolutionState;

          // Publish updated metadata
          await publishMetadata(tokenId, Number(level), experience, Number(cluesCollected), Number(revealsSurvived), Number(stealsSuccessful));

          // Also broadcast level-up announcement
          const announcementEvent = {
            kind: 1, // Text note
            pubkey: BOT_PUBLIC_KEY,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
              ['t', 'vaultwars'],
              ['t', 'level-up'],
              ['e', `nft-${tokenId.toString()}`]
            ],
            content: `🏛️ VaultWars Colosseum #${tokenId.toString()} evolved to Level ${level}! Experience: ${experience.toString()} ⚡`
          };

          announcementEvent.id = getEventHash(announcementEvent);
          announcementEvent.sig = signEvent(announcementEvent, BOT_PRIVATE_KEY);

          await relayPool.publish(announcementEvent, RELAYS);

        } catch (error) {
          console.error(`Error processing LevelUp for token ${tokenId.toString()}:`, error);
        }
      }
    }
  });
}

// Start the bot
async function main() {
  console.log('VaultWars dNFT Bot starting...');
  console.log(`Bot public key: ${BOT_PUBLIC_KEY}`);

  try {
    await listenForLevelUps();
  } catch (error) {
    console.error('Bot error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
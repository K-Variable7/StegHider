import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { RelayPool } from 'nostr-relaypool';

// Configuration
const CONTRACT_ADDRESS = '0x98134BFEeB202ef102245A9f20c48e39238117a6';
const RPC_URL = 'https://sepolia.base.org';
const RELAYS = [
  'wss://nostr.wine',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL)
});

const relayPool = new RelayPool(RELAYS);

// Cache for metadata (5 minutes)
const metadataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenId } = req.query;

  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId parameter required' });
  }

  try {
    const tokenIdNum = BigInt(tokenId);

    // Check cache first
    const cacheKey = tokenId.toString();
    const cached = metadataCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.status(200).json(cached.metadata);
    }

    // Get level from contract
    const level = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: [{
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'levelOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'levelOf',
      args: [tokenIdNum]
    });

    // Get evolution state
    const evolutionState = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: [{
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'evolutionStates',
        outputs: [
          { internalType: 'uint256', name: 'level', type: 'uint256' },
          { internalType: 'uint256', name: 'experience', type: 'uint256' },
          { internalType: 'uint256', name: 'cluesCollected', type: 'uint256' },
          { internalType: 'uint256', name: 'revealsSurvived', type: 'uint256' },
          { internalType: 'uint256', name: 'stealsSuccessful', type: 'uint256' },
          { internalType: 'uint256', name: 'lastEvolution', type: 'uint256' },
          { internalType: 'string', name: 'nostrMetadataURI', type: 'string' }
        ],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'evolutionStates',
      args: [tokenIdNum]
    });

    const [currentLevel, experience, cluesCollected, revealsSurvived, stealsSuccessful, lastEvolution, nostrMetadataURI] = evolutionState;

    // Try to get latest metadata from Nostr
    let nostrMetadata = null;
    if (nostrMetadataURI) {
      try {
        // Query Nostr relays for latest metadata
        const filter = {
          kinds: [1063], // NIP-1063 replaceable metadata
          '#d': [`vaultwars-nft-${tokenId.toString()}`],
          limit: 1
        };

        const events = await relayPool.querySync(RELAYS, filter);
        if (events.length > 0) {
          const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
          nostrMetadata = JSON.parse(latestEvent.content);
        }
      } catch (error) {
        console.error('Error fetching Nostr metadata:', error);
      }
    }

    // Generate on-chain SVG as fallback
    const baseHeight = 200;
    const baseWidth = 300;
    const levelBonus = Number(currentLevel) * 10;
    const colosseumHeight = baseHeight + levelBonus;
    const colosseumWidth = baseWidth + (levelBonus / 2);

    const factionColors = ['#DC143C', '#4169E1', '#228B22', '#FFD700'];
    const factionColor = factionColors[Math.floor(Math.random() * factionColors.length)];

    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#98FB98;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#sky)"/>
  <rect x="${(400 - colosseumWidth) / 2}" y="${400 - colosseumHeight - 50}" width="${colosseumWidth}" height="${colosseumHeight}" fill="${factionColor}" stroke="#8B4513" stroke-width="3"/>
  <text x="200" y="30" text-anchor="middle" font-family="serif" font-size="24" fill="#FFD700">Level ${currentLevel.toString()}</text>
  <text x="200" y="370" text-anchor="middle" font-family="serif" font-size="12" fill="#000">Exp: ${experience.toString()}</text>
  <text x="200" y="385" text-anchor="middle" font-family="serif" font-size="12" fill="#000">Clues: ${cluesCollected.toString()} | Survived: ${revealsSurvived.toString()} | Steals: ${stealsSuccessful.toString()}</text>
</svg>`;

    // Use Nostr metadata if available, otherwise generate on-chain
    const metadata = nostrMetadata || {
      name: `VaultWars Colosseum #${tokenId.toString()}`,
      description: `Dynamic NFT evolving with gameplay. Level ${currentLevel.toString()} - Experience: ${experience.toString()}`,
      image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      attributes: [
        { trait_type: 'Level', value: Number(currentLevel) },
        { trait_type: 'Experience', value: experience.toString() },
        { trait_type: 'Clues Collected', value: Number(cluesCollected) },
        { trait_type: 'Reveals Survived', value: Number(revealsSurvived) },
        { trait_type: 'Successful Steals', value: Number(stealsSuccessful) }
      ]
    };

    // Cache the result
    metadataCache.set(cacheKey, {
      metadata,
      timestamp: Date.now()
    });

    res.status(200).json(metadata);

  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    res.status(500).json({ error: 'Failed to fetch NFT metadata' });
  }
}
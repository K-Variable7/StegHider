# VaultWars Dynamic NFT (dNFT) System

This system implements evolving NFTs that grow visually based on gameplay progress in VaultWars.

## 🎯 Paid Mint: 0.01 ETH

VaultWars uses a **paid mint model** at **0.01 ETH (~$31 USD at $3100 ETH)** to align with Base ecosystem trends and provide sustainable treasury for operations.

### Why Paid Mint?
- **Perceived Value**: Creates committed holders vs. free mint floods
- **Treasury Building**: Funds VRF/LINK costs, marketing, and development
- **Anti-Spam**: Prevents bot farms and ensures quality players
- **Base Alignment**: Matches successful games like Rainbow Mogs, Base Penguins
- **Gas Efficiency**: Base Sepolia gas is ~$0.01-0.05 per transaction

### Mint Process
1. User embeds clue in image using steganography
2. Tests extraction to verify
3. Clicks "Mint NFT (0.01 ETH)" button
4. Pays mint fee + gas, receives evolving Colosseum NFT
5. NFT starts at Level 1, grows with gameplay achievements

### Treasury Management
- **Revenue Split**: 50% faction pots, 30% treasury (VRF funding), 20% dev
- **VRF Funding**: Owner can call `fundVRF(amount)` to maintain randomness
- **Dev Withdrawals**: `withdrawDevShare()` for development funding
- **Faction Pots**: Automatic distribution to faction reward pools

### Supply & Phases
- **Max Supply**: 10,000 NFTs for scarcity
- **Phases**: Whitelist first (Nostr/X testers), then public mint
- **Scarcity**: Limited supply creates value for evolutions/leaderboards

## 🏛️ NFT Theme: Evolving Colosseum

The NFT represents a **Roman Colosseum that evolves** with gameplay achievements, symbolizing the battle arena where factions compete.

### Evolution Mechanics
- **Level 1**: Basic colosseum structure in faction colors
- **Higher Levels**: Adds architectural details (taller walls, more columns)
- **Achievements**: Mosaics for reveals survived, victory arches for successful steals
- **Faction Styling**: Each faction has unique architectural elements
  - **Red Faction**: Crimson (#DC143C) base with red victory arches
  - **Blue Faction**: Royal blue (#4169E1) base with blue victory arches  
  - **Green Faction**: Forest green (#228B22) base with green victory arches
  - **Gold Faction**: Golden (#FFD700) base with gold victory arches
- **Mosaic Colors**: Alternating faction color and gold for reveals survived
- **COSMIC EVOLUTION**: Level 10+ transforms into cosmic colosseum with stars, nebulae, and energy fields

### Why Colosseum?
- **Iconic**: Perfect fit for VaultWars theme
- **Evolutionary**: Natural progression (construction/growth)
- **Symbolic**: Represents the competitive battle arena
- **Visual**: Clear faction colors and achievement indicators
- **Scalable**: Can add infinite detail levels

### Alternative Considered
While Roman soldiers could work, the Colosseum better represents:
- The game's competitive nature
- Faction warfare in a shared arena
- Progressive construction metaphor
- Clear visual evolution path

## 🌌 COSMIC EVOLUTION: Level 10+

When an NFT reaches **Level 10**, it undergoes a spectacular transformation into a **COSMIC COLOSSEUM** - the ultimate evolution tier!

### Cosmic Features
- **Starry Background**: Deep space with scattered stars and nebulae
- **Faction Nebula**: Cosmic clouds in faction colors
- **Energy Glow**: Glowing effects around all structures
- **Golden Accents**: Enhanced gold elements with energy filters
- **Floating Arches**: Victory arches that appear to float in space
- **Cosmic Stats**: Enhanced display with golden text and glow effects

### Achievement Requirements
- **Level 10+**: Requires extensive gameplay and experience accumulation
- **Rare Status**: Only the most dedicated players will achieve cosmic evolution
- **Prestige Item**: Cosmic NFTs become highly coveted collector's items

### Cosmic Visual Elements
- **Background**: Radial gradient from deep space black to cosmic blue
- **Nebula Effects**: Faction-colored cosmic clouds
- **Star Field**: Scattered white stars across the background
- **Energy Fields**: Glowing auras around the colosseum structure
- **Enhanced Architecture**: Larger, more detailed cosmic structures

## Architecture

### Hybrid On-Chain + Off-Chain Approach
- **On-Chain**: Level tracking, experience points, evolution state
- **Off-Chain**: Nostr-based metadata storage for zero-gas updates
- **Gateway**: Vercel API routes for OpenSea compatibility

### Components

1. **Smart Contract** (`DynamicClueNFT.sol`)
   - Tracks evolution state (level, experience, stats)
   - On-chain SVG generation as fallback
   - `levelOf()` mapping for easy access
   - `tokenURI()` returns gateway URL

2. **Nostr Bot** (`scripts/dnft-bot.js`)
   - Listens for `NFTEvolved` events
   - Generates evolved SVG metadata
   - Publishes NIP-1063 replaceable events to multiple relays

3. **Metadata Gateway** (`api/nft/[tokenId].js`)
   - Resolves tokenURI to latest metadata
   - Queries chain state + Nostr relays
   - 5-minute caching for performance

## Setup Instructions

### 1. Deploy Contract
```bash
cd contracts
npm install
npx hardhat run scripts/deploy-dynamic.js --network baseSepolia
```

Update the contract address in:
- `frontend/components/FactionDashboard.tsx`
- `scripts/dnft-bot.js`
- `api/nft/[tokenId].js`

### 2. Run the Bot
```bash
cd vaultwars
npm install viem nostr-relaypool nostr-tools

# Set your bot private key
export BOT_PRIVATE_KEY="your-nostr-private-key-hex"

# Run the bot
node scripts/dnft-bot.js
```

### 3. Deploy Gateway
```bash
# The API routes are automatically deployed with Vercel
vercel --prod
```

### 4. Update Frontend
The frontend automatically uses the new contract ABI and address.

## How It Works

1. **Leveling Up**: Players earn experience through gameplay (solving clues, surviving reveals, successful steals)

2. **Automatic Evolution**: When enough XP is gained, NFTs auto-level up on-chain

3. **Metadata Updates**: Bot detects `NFTEvolved` events and publishes updated metadata to Nostr

4. **OpenSea Compatibility**: `tokenURI()` returns gateway URL that serves latest metadata with caching

## Key Features

- **Zero-Gas Updates**: Metadata stored off-chain via Nostr
- **Decentralized**: Multiple relays ensure availability
- **Marketplace Compatible**: Gateway provides ERC-721 standard interface
- **Visual Evolution**: Colosseum grows taller, adds mosaics, victory arches based on achievements
- **Real-time**: Bot responds instantly to on-chain events

## Configuration

### Bot Settings
- `BOT_PRIVATE_KEY`: Nostr private key for signing events
- `CONTRACT_ADDRESS`: Deployed contract address
- `RELAYS`: List of Nostr relays for redundancy

### Gateway Settings
- `CONTRACT_ADDRESS`: Same as bot
- `CACHE_DURATION`: 5 minutes default
- `RPC_URL`: Base Sepolia endpoint

## Testing

1. Mint an NFT using the frontend
2. Play the game to gain experience
3. Watch the NFT evolve visually on OpenSea/test marketplaces
4. Check Nostr relays for metadata events

## Gotchas Handled

- **OpenSea Caching**: Version parameter in tokenURI forces refresh
- **Relay Sync**: Publishes to 5+ relays for redundancy
- **Rate Limiting**: Bot processes events sequentially
- **Fallback**: On-chain SVG if Nostr fails
- **Caching**: 5-minute cache on gateway for performance
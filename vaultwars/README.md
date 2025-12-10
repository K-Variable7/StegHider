# VaultWars - Dynamic Blockchain Scavenger Hunt

A sophisticated NFT-based scavenger hunt game that leverages StegHider's steganography for hidden clues, with dynamic difficulty scaling, oracle-driven randomness, and faction-based teamwork.

## 🎮 Game Features

### Dynamic Difficulty Scaling
- **Automated Scaling**: Difficulty increases based on player performance and participation
- **Oracle Integration**: Chainlink VRF ensures fair randomness for clue solving
- **Performance-Based**: Factions that solve faster trigger global difficulty increases

### Faction System
- **Four Factions**: Red (Aggressive), Blue (Strategic), Green (Explorers), Gold (Elite)
- **Teamwork Focus**: Faction-specific chat and collaborative clue solving
- **Competitive Scoring**: Points awarded based on difficulty × multiplier × global scaling

### Decentralized Social Layer (Nostr Integration)
- **Faction Feeds**: Public relays for war rooms, memes, and strategy sharing
- **Global Announcements**: Oracle-triggered events broadcast to all players
- **Cross-Faction Taunts**: Censorship-resistant posts for rivalries and boasts
- **Privacy Tie-In**: Embed clues in Nostr-posted images using StegHider extension

### Minimal On-Chain Metadata
- **Privacy-First**: Only stores faction ID, multiplier, and clue hash on-chain
- **Ownership Verification**: Frontend verifies NFT ownership before revealing clues
- **Decentralized Storage**: Full clue data stored off-chain (IPFS) with hash verification

### Oracle Automation
- **Chainlink VRF**: Random clue assignments and solving verification
- **Participation Tracking**: Automatic scaling based on active player count
- **Fair Distribution**: Prevents manipulation of game mechanics

## 🏗️ Architecture

### Smart Contracts
```
contracts/
├── ClueNFT.sol          # Main NFT contract with VRF integration
├── RewardPot.sol        # Prize pool distribution
└── FactionManager.sol   # Team coordination and chat
```

### Frontend Dashboard
```
frontend/
├── components/
│   ├── FactionDashboard.tsx    # Main game interface
│   ├── ClueRevealer.tsx        # StegHider integration
│   └── FactionChat.tsx         # XMTP-powered chat
├── app/
│   ├── page.tsx               # Landing page
│   └── faction/[id]/          # Faction-specific pages
└── providers/                 # Web3 configuration
```

### Automation Scripts
```
scripts/
├── generate_hunt.py       # Clue generation with StegHider
├── ipfs_uploader.py       # Decentralized storage
└── oracle_keeper.py       # Chainlink automation
```

## 🚀 Getting Started

### Deploy Contracts
```bash
cd contracts
npm install
npx hardhat run scripts/deploy.js --network sepolia
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### Generate Hunt
```bash
cd scripts
python generate_hunt.py --num_clues 10 --password mysecret
```

## 🔧 Technical Integration

### StegHider Integration
- Core library imported for client-side clue embedding/extraction
- Robustness features ensure clues survive social media compression
- Browser extension provides metadata wiping and local storage

### Oracle Workflow
1. Player requests to solve clue → VRF randomness generated
2. Randomness determines which clue to solve fairly
3. Contract updates scores and scales difficulty
4. Frontend reveals decrypted clue content

### Faction Chat
- XMTP protocol for decentralized messaging
- Faction-specific rooms with encryption
- Integration with NFT ownership verification

## 🎯 Game Mechanics

### Clue Lifecycle
1. **Minting**: Admin generates stego-images with embedded clues
2. **Distribution**: NFTs dropped to players via random selection
3. **Solving**: Players request VRF-powered fair solving
4. **Revelation**: Ownership-verified clue decryption
5. **Scoring**: Points calculated with dynamic multipliers

### Dynamic Scaling Rules
- **Participation**: Every 10 new players → +1 difficulty
- **Performance**: Every 50 solves → +1 global multiplier
- **Faction Balance**: Underperforming factions get bonus multipliers

### Reward Distribution
- **Prize Pool**: ETH accumulated from entry fees
- **Winner Takes All**: Top faction splits the pot
- **NFT Bonuses**: Rare clues provide extra rewards

## 🔒 Security Considerations

- **Oracle Reliance**: Chainlink VRF prevents front-running
- **Hash Verification**: On-chain hashes ensure clue integrity
- **Ownership Checks**: Double-verification prevents unauthorized reveals
- **Rate Limiting**: Prevents spam solving attempts

## 📊 Analytics & Monitoring

- **On-Chain Metrics**: Real-time faction scores and difficulty levels
- **Participation Tracking**: Oracle-fed player count updates
- **Performance Analytics**: Solve rates and multiplier effectiveness

## 💰 Monetary Structure

### Sustainable Monetary Structure for VaultWars: My Opinion
In my view, VaultWars— with its unique blend of steganography puzzles, faction warfare, oracle-driven fairness, and betrayal mechanics like the steal claw— is positioned to thrive in the 2025 Web3 gaming landscape, where sustainability is key to avoiding the hype crashes of past cycles. Drawing from current trends in Web3 game economics, the project needs a hybrid monetization model that balances player incentives (e.g., play-to-earn elements) with developer revenue, while incorporating deflationary mechanics and community governance to ensure long-term scaling. This isn't just about covering costs like Chainlink oracle fees, server maintenance, and marketing; it's about creating a self-reinforcing ecosystem where growth funds more growth.
The goal: Keep the project "afloat" by generating consistent revenue to hit break-even (e.g., $50k–$100k/month initially for a small team), then scale upwards by reinvesting into bigger prize pots, feature expansions (e.g., AI-generated hunts), and player acquisition. Based on models from successful games like Pirate Nation (guild alliances with sustainable pots) and emerging P2E trends, here's the structure I'd recommend.

#### Core Principles for Sustainability and Scaling

Player-First but Revenue-Smart: Avoid high entry barriers (e.g., expensive upfront NFTs) that deter casual players, as seen in many failed Web3 games. Instead, focus on low-friction microtransactions that feel rewarding, not exploitative.
Deflationary and Incentive-Aligned: Use burns and staking to create scarcity, driving value without infinite token emissions.
Diversified Streams: Don't rely solely on NFT sales (volatile); mix with recurring fees and premium features for stability.
Community Governance: Incorporate DAOs for pot allocation decisions, fostering loyalty and reducing centralization risks.
Reinvestment Loop: 50–70% of revenues back into prize pots/marketing to attract more players; scale from 50-player alphas to 10k+ seasons.

#### Recommended Monetary Structure: A 4-Pillar Hybrid Model

**Pillar 1: Microtransactions & Entry Fees**
- Low-friction entry: Free basic hunts with optional upgrades (e.g., 0.01 ETH for premium stego-robustness or AI-generated clues).
- Steal claw fees: 0.001 ETH per attempt, funding faction pots and treasury (scales with participation).
- Dynamic pricing: Fees adjust based on oracle data (e.g., higher during peak times to manage load).

**Pillar 2: NFT Bonuses & Collectibles**
- Bonus multiplier NFTs: Mintable post-season for top performers (e.g., +2x permanent boost, royalty-sharing).
- Champion Claw NFTs: Derivative NFTs for steal leaders, with secondary market royalties (5-10% to treasury).
- Limited editions: Rare faction-themed NFTs unlocked via gameplay, sold at auction.

**Pillar 3: $VAULT Tokenomics**
- Utility token: Earned through gameplay (solving clues, successful steals), used for premium features or governance.
- Deflationary mechanics: Burns on failed steals or expired hunts to increase scarcity.
- Treasury allocation: 50% of token sales/rewards fund prize pots, 30% marketing, 20% development.
- Custom Swap & Dynamic Tokenomics: Build proprietary AMM for $VAULT/native swaps. Collect native tokens (ETH/Base) instead of $VAULT to accelerate treasury growth, reduce selling pressure, and enable buybacks based on volume/game metrics (e.g., auto-buyback 1% of treasury on high participation days).

**Pillar 4: Community & Grants**
- Crowdfunding: Launch on platforms like Juicebox or Gitcoin for initial treasury (target $50k-$100k seed).
- Grants: Apply to Web3 gaming grants (e.g., Polygon, Avalanche) for oracle costs and marketing.
- Partnerships: Collaborate with stego tools or NFT projects for cross-promotion.

This creates a self-regulating, fair, and engaging scavenger hunt that scales automatically while maintaining privacy and decentralization.
- Chainlink for randomness and automation
- IPFS for decentralized image storage

## Development

This is part of the StegHider monorepo. The game logic is kept separate to maintain StegHider's focus on privacy tools.
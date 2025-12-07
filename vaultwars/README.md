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

This creates a self-regulating, fair, and engaging scavenger hunt that scales automatically while maintaining privacy and decentralization.
- Chainlink for randomness and automation
- IPFS for decentralized image storage

## Development

This is part of the StegHider monorepo. The game logic is kept separate to maintain StegHider's focus on privacy tools.
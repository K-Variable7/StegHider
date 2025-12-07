# VaultWars - StegHider Scavenger Hunt Game

A blockchain-based scavenger hunt game built on top of StegHider's steganography technology. Players embed and discover hidden clues in images, competing in factions for NFT rewards.

## Project Structure

- `contracts/` - Solidity smart contracts for NFTs, reward pots, and oracle logic
- `frontend/` - Next.js game dashboard with faction chat and leaderboards
- `scripts/` - Automation scripts for clue generation and embedding
- `oracle-keeper/` - Node.js service that monitors participation and triggers Chainlink oracles
- `extension-bridge/` - Browser extension overlay for seamless integration with StegHider

## Getting Started

1. Install dependencies for each component
2. Deploy contracts to your preferred network
3. Set up the oracle keeper
4. Run the frontend locally

## Game Mechanics

- **Clues**: Encrypted messages hidden in images using LSB steganography
- **Factions**: Competing teams with unique themes and multipliers
- **Rewards**: NFT drops and ETH pots distributed via Chainlink VRF
- **Social**: Integrated with Nostr/XMTP for faction communication

## Dependencies

- StegHider core library (imported from parent repo)
- Web3 libraries (ethers.js, web3.js)
- Chainlink for randomness and automation
- IPFS for decentralized image storage

## Development

This is part of the StegHider monorepo. The game logic is kept separate to maintain StegHider's focus on privacy tools.
#!/usr/bin/env node

/**
 * Batch Mint Script for VaultWars Alpha
 * Airdrops Clue NFTs to initial players
 */

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Contract details
  const CONTRACT_ADDRESS = "0xfD9843CAf0B488D824408D6770d7b3D819Ecc3bb"; // Sepolia
  const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID;

  // Load hunt info
  const huntInfo = require("./hunt_clues_50/hunt_info.json");

  // Alpha player addresses (replace with real wallets)
  const alphaPlayers = [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Gold faction commander
    "0x1234567890123456789012345678901234567890", // Test player 1
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", // Test player 2
    "0x1111111111111111111111111111111111111111", // Test player 3
    "0x2222222222222222222222222222222222222222", // Test player 4
  ];

  // Faction assignment (rotate through factions)
  const factions = [0, 1, 2, 3]; // Red, Blue, Green, Gold

  console.log("Starting VaultWars Alpha Airdrop...");
  console.log(`Minting ${huntInfo.length} clues to ${alphaPlayers.length} players`);

  // Get contract
  const ClueNFT = await ethers.getContractFactory("ClueNFT");
  const clueNFT = ClueNFT.attach(CONTRACT_ADDRESS);

  // Batch mint clues
  for (let i = 0; i < huntInfo.length; i++) {
    const clue = huntInfo[i];
    const playerIndex = i % alphaPlayers.length;
    const player = alphaPlayers[playerIndex];
    const faction = factions[playerIndex % factions.length];

    // Use IPFS URI from hunt info
    const tokenURI = clue.ipfs_uri;

    console.log(`Minting Clue #${clue.clue_number} to ${player} (Faction ${faction})`);

    try {
      const tx = await clueNFT.mintClue(
        player,
        tokenURI,
        faction,
        clue.clue_number * 10, // difficulty based on clue number
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(clue.clue_text)) // clueHash
      );

      await tx.wait();
      console.log(`✅ Minted Clue #${clue.clue_number}`);
    } catch (error) {
      console.error(`❌ Failed to mint Clue #${clue.clue_number}:`, error.message);
    }
  }

  console.log("\n🎉 Alpha airdrop complete!");
  console.log("Players can now start solving and stealing clues.");
  console.log("Gold faction: Ready for betrayal. 🏴‍☠️");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
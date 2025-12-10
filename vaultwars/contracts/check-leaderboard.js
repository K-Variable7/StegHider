const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x98134BFEeB202ef102245A9f20c48e39238117a6";

  // Get the contract instance
  const DynamicClueNFT = await ethers.getContractFactory("DynamicClueNFT");
  const contract = DynamicClueNFT.attach(contractAddress);

  console.log("🏆 Checking current faction leaderboard...\n");

  const factions = ["Red", "Blue", "Green", "Gold"];

  for (let i = 0; i < factions.length; i++) {
    try {
      const score = await contract.getFactionScore(i);
      console.log(`${factions[i]} Faction: ${score.toString()} points`);
    } catch (error) {
      console.log(`${factions[i]} Faction: Error fetching score`);
    }
  }

  console.log("\n🎯 Visit http://localhost:3000/spectator to watch the battles live!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VaultWars ClueNFT contract...");

  const ClueNFT = await ethers.getContractFactory("ClueNFT");
  const clueNFT = await ClueNFT.deploy();

  await clueNFT.deployed();

  console.log("ClueNFT deployed to:", clueNFT.address);

  // Verify contract on Etherscan (if on mainnet/sepolia)
  if (network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await clueNFT.deployTransaction.wait(6);

    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: clueNFT.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
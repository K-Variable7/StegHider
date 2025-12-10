const { ethers } = require("hardhat");
require("dotenv").config();
console.log("SEPOLIA_RPC_URL:", `"${process.env.SEPOLIA_RPC_URL}"`);
console.log("PRIVATE_KEY length:", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : "Not set");
console.log("VRF_SUBSCRIPTION_ID:", process.env.VRF_SUBSCRIPTION_ID);

async function main() {
  console.log("Deploying VaultWars ClueNFT contract...");

  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID;
  if (!subscriptionId) {
    throw new Error("Please set VRF_SUBSCRIPTION_ID in .env file");
  }

  const ClueNFT = await ethers.getContractFactory("ClueNFT");
  const clueNFT = await ClueNFT.deploy(subscriptionId);

  await clueNFT.waitForDeployment();
  const address = await clueNFT.getAddress();

  console.log("ClueNFT deployed to:", address);

  // Verify contract on Etherscan (if on mainnet/sepolia)
  if (network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await clueNFT.deploymentTransaction().wait(6);

    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [subscriptionId],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: address,
    subscriptionId: subscriptionId,
    network: network.name,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
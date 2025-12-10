const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying DynamicClueNFT contract to Base Sepolia...");

  // Get the contract factory
  const DynamicClueNFT = await ethers.getContractFactory("DynamicClueNFT");

  // Get the subscription ID from deployment.json or use a default
  let subscriptionId = 12498; // Default from existing deployment
  try {
    const deploymentData = JSON.parse(fs.readFileSync("./deployment.json", "utf8"));
    subscriptionId = deploymentData.subscriptionId;
  } catch (error) {
    console.log("Using default subscription ID:", subscriptionId);
  }

  // Deploy the contract
  const dynamicClueNFT = await DynamicClueNFT.deploy(subscriptionId);

  console.log("DynamicClueNFT deployed to:", await dynamicClueNFT.getAddress());

  // Update deployment.json
  const deploymentInfo = {
    contractAddress: await dynamicClueNFT.getAddress(),
    subscriptionId: subscriptionId,
    network: "baseSepolia",
    deployedAt: new Date().toISOString(),
    contractType: "DynamicClueNFT"
  };

  fs.writeFileSync("./deployment-dynamic.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment-dynamic.json");

  // Wait for a few block confirmations
  console.log("Waiting for confirmations...");
  await dynamicClueNFT.deploymentTransaction().wait(5);

  console.log("DynamicClueNFT deployment completed!");
  console.log("Contract address:", await dynamicClueNFT.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
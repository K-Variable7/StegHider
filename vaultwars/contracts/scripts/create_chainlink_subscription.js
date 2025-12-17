const { ethers } = require("hardhat");

// Usage:
// npx hardhat run scripts/create_chainlink_subscription.js --network baseSepolia
// or set CHAINLINK_REGISTRY and CONSUMER_ADDRESS env vars and run with hardhat

async function main() {
  const registryAddress = process.env.CHAINLINK_REGISTRY;
  if (!registryAddress) {
    throw new Error("Set CHAINLINK_REGISTRY env var to the v2.0 registry address for your network");
  }

  const signer = (await ethers.getSigners())[0];
  console.log("Using account:", signer.address);
  console.log("Registry:", registryAddress);

  const registryAbi = [
    "function createSubscription() external returns (uint64)",
    "function addConsumer(uint64 subscriptionId, address consumer) external",
    "event SubscriptionCreated(uint64 indexed subscriptionId, address owner)"
  ];

  const registry = new ethers.Contract(registryAddress, registryAbi, signer);

  console.log("Creating subscription...");
  const tx = await registry.createSubscription();
  console.log("tx sent:", tx.hash);
  const receipt = await tx.wait();

  // Try to decode SubscriptionCreated event
  let subscriptionId = null;
  for (const ev of receipt.events || []) {
    try {
      // event signature: SubscriptionCreated(uint64 indexed subscriptionId, address owner)
      if (ev.event === "SubscriptionCreated" && ev.args && ev.args.subscriptionId) {
        subscriptionId = ev.args.subscriptionId.toString();
        break;
      }
    } catch (e) {
      // ignore
    }
  }

  // Fallback: parse logs manually
  if (!subscriptionId) {
    const iface = new ethers.utils.Interface(registryAbi);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed.name === "SubscriptionCreated") {
          subscriptionId = parsed.args.subscriptionId.toString();
          break;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!subscriptionId) {
    console.error("Failed to find SubscriptionCreated event in receipt. Receipt logs:", receipt.logs);
    process.exit(1);
  }

  console.log("Subscription created:", subscriptionId);

  const consumer = process.env.CONSUMER_ADDRESS;
  if (consumer) {
    console.log(`Adding consumer ${consumer} to subscription ${subscriptionId}...`);
    const tx2 = await registry.addConsumer(subscriptionId, consumer);
    console.log("addConsumer tx:", tx2.hash);
    await tx2.wait();
    console.log("Consumer added.");
  }

  console.log("Done. Fund the subscription via the Chainlink UI (Billing -> Fund).");
  console.log("Subscription ID:", subscriptionId);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
const { ethers } = require("hardhat");

// Usage:
// npx hardhat run scripts/add_subscription_consumer.js --network baseSepolia --subscription <id> --consumer <address>
// or set SUBSCRIPTION_ID and CONSUMER_ADDRESS env vars and run with hardhat

async function main() {
  const registryAddress = process.env.CHAINLINK_REGISTRY;
  if (!registryAddress) {
    throw new Error("Set CHAINLINK_REGISTRY env var to the v2.0 registry address for your network");
  }

  let subscriptionId = process.env.SUBSCRIPTION_ID;
  let consumerAddress = process.env.CONSUMER_ADDRESS;

  // simple arg parsing
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--subscription' && args[i+1]) { subscriptionId = args[i+1]; i++; }
    if (args[i] === '--consumer' && args[i+1]) { consumerAddress = args[i+1]; i++; }
  }

  if (!subscriptionId) throw new Error('Subscription id required via env SUBSCRIPTION_ID or --subscription');
  if (!consumerAddress) throw new Error('Consumer address required via env CONSUMER_ADDRESS or --consumer');

  const signer = (await ethers.getSigners())[0];
  console.log('Using account:', signer.address);
  console.log('Registry:', registryAddress);
  console.log('Subscription:', subscriptionId);
  console.log('Consumer:', consumerAddress);

  const registryAbi = [
    'function addConsumer(uint64 subscriptionId, address consumer) external',
    'event SubscriptionConsumerAdded(uint64 indexed subscriptionId, address consumer)'
  ];

  const registry = new ethers.Contract(registryAddress, registryAbi, signer);

  const tx = await registry.addConsumer(subscriptionId, consumerAddress);
  console.log('tx sent:', tx.hash);
  await tx.wait();
  console.log('Consumer added.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
const { ethers } = require("hardhat");
require("dotenv").config();
const { DYNAMIC_CLUE_NFT_ABI } = require("../frontend/utils/dynamicClueNftAbi");

async function testSeasonalEvents() {
  console.log("Testing Seasonal Events functionality...");

  // Get signer
  const [signer] = await ethers.getSigners();

  // Contract address from deployment
  const contractAddress = "0x9AaD4AC1113A3ecb6FBacB0212bD01422Cf8eb6f";

  // Get contract instance using the full ABI
  const contract = new ethers.Contract(contractAddress, DYNAMIC_CLUE_NFT_ABI, signer);

  try {
    // Test connection first
    console.log("Testing contract connection...");
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    console.log("Signer address:", await signer.getAddress());

    if (owner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
      console.log("❌ Not the contract owner, cannot create events");
      return;
    }

    // Test 2: Get active event first
    console.log("Getting active event...");
    const initialActiveEvent = await contract.getActiveEvent();
    console.log("Active event:", initialActiveEvent);

    // Test 1: Create a seasonal event
    console.log("Creating seasonal event...");
    const createTx = await contract.createSeasonalEvent(
      "Winter Wonderland", // name
      "A magical winter event with bonus rewards!", // theme
      Math.floor(Date.now() / 1000) + 3600 * 24, // startTime (1 day from now)
      Math.floor(Date.now() / 1000) + 3600 * 24 * 7, // endTime (1 week)
      200, // tournamentMultiplier (2x)
      150, // challengeMultiplier (1.5x)
      120, // stakingMultiplier (1.2x)
      100 // maxSpecialNFTs
    );
    await createTx.wait();
    console.log("✅ Seasonal event created successfully");

    // Test 2: Get active event
    console.log("Getting active event...");
    const activeEvent = await contract.getActiveEvent();
    console.log("Active event:", activeEvent);

    // Test 3: Activate the event
    console.log("Activating seasonal event...");
    const activateTx = await contract.activateEvent(1); // Event ID 1
    await activateTx.wait();
    console.log("✅ Seasonal event activated successfully");

    // Test 4: Check active event again
    const activeEventAfter = await contract.getActiveEvent();
    console.log("Active event after activation:", activeEventAfter);

    console.log("🎉 All seasonal events tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testSeasonalEvents();
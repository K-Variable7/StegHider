const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ClueNFT", function () {
  let clueNFT;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const ClueNFT = await ethers.getContractFactory("ClueNFT");
    clueNFT = await ClueNFT.deploy();
    await clueNFT.deployed();
  });

  it("Should mint a clue NFT", async function () {
    const tokenURI = "ipfs://QmTest123";
    const faction = 0; // Red
    const difficulty = 5;

    await expect(clueNFT.mintClue(player1.address, tokenURI, faction, difficulty))
      .to.emit(clueNFT, "ClueMinted")
      .withArgs(0, owner.address, faction, difficulty);

    expect(await clueNFT.ownerOf(0)).to.equal(player1.address);
    expect(await clueNFT.tokenURI(0)).to.equal(tokenURI);
  });

  it("Should solve a clue and update scores", async function () {
    // Mint a clue
    await clueNFT.mintClue(player1.address, "ipfs://QmTest123", 0, 5);

    // Solve it
    await expect(clueNFT.solveClue(0, player2.address))
      .to.emit(clueNFT, "ClueSolved")
      .withArgs(0, player2.address, 5); // difficulty * multiplier = 5 * 1 = 5

    const clue = await clueNFT.getClue(0);
    expect(clue.isActive).to.be.false;

    expect(await clueNFT.getFactionScore(0)).to.equal(5); // Red faction score
  });

  it("Should not allow solving your own clue", async function () {
    await clueNFT.mintClue(player1.address, "ipfs://QmTest123", 0, 5);

    await expect(clueNFT.solveClue(0, player1.address)).to.be.revertedWith("Cannot solve your own clue");
  });
});
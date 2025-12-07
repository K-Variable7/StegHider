// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ClueNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Faction enum
    enum Faction { Red, Blue, Green, Gold }

    struct Clue {
        uint256 tokenId;
        Faction faction;
        uint256 difficulty;
        uint256 multiplier;
        bool isActive;
        address creator;
        uint256 createdAt;
    }

    mapping(uint256 => Clue) public clues;
    mapping(address => uint256[]) public playerClues;
    mapping(Faction => uint256) public factionScores;

    event ClueMinted(uint256 indexed tokenId, address indexed creator, Faction faction, uint256 difficulty);
    event ClueSolved(uint256 indexed tokenId, address indexed solver, uint256 points);

    constructor() ERC721("VaultWars Clue", "CLUE") {}

    function mintClue(
        address to,
        string memory tokenURI,
        Faction faction,
        uint256 difficulty
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        uint256 multiplier = _calculateMultiplier(faction, difficulty);

        clues[tokenId] = Clue({
            tokenId: tokenId,
            faction: faction,
            difficulty: difficulty,
            multiplier: multiplier,
            isActive: true,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        playerClues[to].push(tokenId);

        emit ClueMinted(tokenId, msg.sender, faction, difficulty);
        return tokenId;
    }

    function solveClue(uint256 tokenId, address solver) public onlyOwner {
        require(clues[tokenId].isActive, "Clue already solved");
        require(ownerOf(tokenId) != solver, "Cannot solve your own clue");

        Clue storage clue = clues[tokenId];
        clue.isActive = false;

        uint256 points = clue.difficulty * clue.multiplier;
        factionScores[clue.faction] += points;

        emit ClueSolved(tokenId, solver, points);
    }

    function _calculateMultiplier(Faction faction, uint256 difficulty) internal pure returns (uint256) {
        uint256 baseMultiplier = 1;

        // Faction bonuses
        if (faction == Faction.Gold) baseMultiplier += 1;
        if (faction == Faction.Red) baseMultiplier += 0;

        // Difficulty scaling
        return baseMultiplier + (difficulty / 10);
    }

    function getFactionScore(Faction faction) public view returns (uint256) {
        return factionScores[faction];
    }

    function getPlayerClues(address player) public view returns (uint256[] memory) {
        return playerClues[player];
    }

    function getClue(uint256 tokenId) public view returns (Clue memory) {
        return clues[tokenId];
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract ClueNFT is ERC721, ERC721URIStorage, Ownable, VRFConsumerBaseV2 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    VRFCoordinatorV2Interface COORDINATOR;

    // Chainlink VRF Configuration
    uint64 s_subscriptionId;
    address vrfCoordinator = 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625; // Sepolia
    bytes32 keyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56cn7; // Sepolia 30 gwei
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

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
        bytes32 clueHash; // Hash of the embedded clue for verification
    }

    mapping(uint256 => Clue) public clues;
    mapping(address => uint256[]) public playerClues;
    mapping(Faction => uint256) public factionScores;
    mapping(uint256 => address) public requestToSolver; // VRF request to solver

    uint256 public globalDifficulty = 1;
    uint256 public participationThreshold = 10;
    uint256 public activePlayers = 0;

    event ClueMinted(uint256 indexed tokenId, address indexed creator, Faction faction, uint256 difficulty);
    event ClueSolved(uint256 indexed tokenId, address indexed solver, uint256 points);
    event DifficultyScaled(uint256 newDifficulty);
    event RandomnessRequested(uint256 indexed requestId, address indexed solver);

    constructor(uint64 subscriptionId) ERC721("VaultWars Clue", "CLUE") VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
    }

    function mintClue(
        address to,
        string memory tokenURI,
        Faction faction,
        uint256 difficulty,
        bytes32 clueHash
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
            createdAt: block.timestamp,
            clueHash: clueHash
        });

        playerClues[to].push(tokenId);

        emit ClueMinted(tokenId, msg.sender, faction, difficulty);
        return tokenId;
    }

    function requestSolveClue(uint256 tokenId) public returns (uint256 requestId) {
        require(clues[tokenId].isActive, "Clue already solved");
        require(ownerOf(tokenId) != msg.sender, "Cannot solve your own clue");

        // Request randomness for fair solving
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestToSolver[requestId] = msg.sender;

        emit RandomnessRequested(requestId, msg.sender);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address solver = requestToSolver[requestId];
        uint256 randomValue = randomWords[0];

        // Use randomness to determine which clue to solve (for dynamic hunts)
        // For now, just solve a random active clue owned by the solver
        uint256[] memory playerClueIds = playerClues[solver];
        require(playerClueIds.length > 0, "No clues to solve");

        uint256 clueIndex = randomValue % playerClueIds.length;
        uint256 tokenId = playerClueIds[clueIndex];

        _solveClue(tokenId, solver);
    }

    function _solveClue(uint256 tokenId, address solver) internal {
        Clue storage clue = clues[tokenId];
        require(clue.isActive, "Clue already solved");

        clue.isActive = false;

        uint256 points = clue.difficulty * clue.multiplier * globalDifficulty;
        factionScores[clue.faction] += points;

        // Scale difficulty based on performance
        _scaleDifficulty();

        emit ClueSolved(tokenId, solver, points);
    }

    function _scaleDifficulty() internal {
        // Simple scaling: increase difficulty every N solves
        uint256 totalSolved = 0;
        for (uint256 i = 0; i < 4; i++) {
            totalSolved += factionScores[Faction(i)];
        }

        if (totalSolved % 50 == 0 && totalSolved > 0) {
            globalDifficulty += 1;
            emit DifficultyScaled(globalDifficulty);
        }
    }

    function _calculateMultiplier(Faction faction, uint256 difficulty) internal view returns (uint256) {
        uint256 baseMultiplier = 1;

        // Faction bonuses
        if (faction == Faction.Gold) baseMultiplier += 1;

        // Global difficulty scaling
        baseMultiplier += (globalDifficulty - 1);

        // Difficulty scaling
        return baseMultiplier + (difficulty / 10);
    }

    function updateParticipation(uint256 newCount) public onlyOwner {
        activePlayers = newCount;

        // Scale difficulty based on participation
        if (activePlayers > participationThreshold) {
            globalDifficulty += 1;
            emit DifficultyScaled(globalDifficulty);
        }
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

    function getGlobalDifficulty() public view returns (uint256) {
        return globalDifficulty;
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
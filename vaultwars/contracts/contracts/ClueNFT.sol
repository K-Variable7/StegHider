// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract ClueNFT is ERC721, ERC721URIStorage, Ownable, VRFConsumerBaseV2, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    VRFCoordinatorV2Interface COORDINATOR;

    // Chainlink VRF Configuration
    uint64 s_subscriptionId;
    address vrfCoordinator = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE; // Base Sepolia
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    // Faction enum
    enum Faction {
        Red,
        Blue,
        Green,
        Gold
    }
    enum RequestType {
        Solve,
        Steal,
        Reveal
    }

    struct VRFRequest {
        RequestType requestType;
        address requester;
        uint256 targetTokenId;
        Faction targetFaction;
        Faction thiefFaction;
    }

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

    mapping(uint256 => string[]) private tokenClues; // Encrypted clues per token
    mapping(uint256 => uint256) public revealUntil; // Timestamp when clues are revealed until
    mapping(uint256 => uint256) public revealBlockedUntil; // Timestamp when reveals are blocked until
    mapping(address => uint256) public playerToken; // Player's primary token ID
    mapping(uint256 => Clue) public clues;
    mapping(address => uint256[]) public playerClues;
    mapping(Faction => uint256) public factionScores;
    mapping(Faction => uint256) public factionPots; // ETH pots for factions
    mapping(uint256 => VRFRequest) public requestDetails; // VRF request details

    uint256 public globalDifficulty = 1;
    uint256 public participationThreshold = 10;
    uint256 public activePlayers = 0;
    uint256 public constant STEAL_FEE = 0.001 ether;
    uint256 public constant STEAL_SUCCESS_RATE = 25; // 25% success rate

    event ClueMinted(uint256 indexed tokenId, address indexed creator, Faction faction, uint256 difficulty);
    event ClueSolved(uint256 indexed tokenId, address indexed solver, uint256 points);
    event DifficultyScaled(uint256 newDifficulty);
    event RandomnessRequested(uint256 indexed requestId, address indexed requester);
    event ClueStolen(
        uint256 indexed tokenId, address indexed stealer, address indexed victim, uint256 stolenMultiplier
    );
    event StealFailed(uint256 indexed tokenId, address indexed stealer, address indexed victim);
    event PlayerRevealed(uint256 indexed tokenId, uint256 revealUntil);
    event RevealBlocked(uint256 indexed tokenId, uint256 blockedUntil);

    constructor(uint64 subscriptionId) ERC721("VaultWars Clue", "CLUE") VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        // Set keyHash for Base Sepolia
        keyHash = 0x00764c9050b7c4b0c7c9c6b0b7c9c6b0b7c9c6b0b7c9c6b0b7c9c6b0b7c9c6b0;
    }

    function mintClue(address to, string memory tokenURI, Faction faction, uint256 difficulty, bytes32 clueHash)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        playerToken[to] = tokenId; // Set primary token for player

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
        requestId =
            COORDINATOR.requestRandomWords(keyHash, s_subscriptionId, requestConfirmations, callbackGasLimit, numWords);

        requestDetails[requestId] = VRFRequest(RequestType.Solve, msg.sender, tokenId, Faction.Red, Faction.Red);

        emit RandomnessRequested(requestId, msg.sender);
        return requestId;
    }

    function stealClue(uint256 tokenId, Faction thiefFaction) public payable returns (uint256 requestId) {
        require(msg.value == STEAL_FEE, "Must pay exact steal fee");
        require(clues[tokenId].isActive, "Clue already solved");
        require(ownerOf(tokenId) != msg.sender, "Cannot steal your own clue");

        // Request randomness for steal attempt
        requestId =
            COORDINATOR.requestRandomWords(keyHash, s_subscriptionId, requestConfirmations, callbackGasLimit, numWords);

        requestDetails[requestId] =
            VRFRequest(RequestType.Steal, msg.sender, tokenId, clues[tokenId].faction, thiefFaction);

        // Store thief's faction for later use
        // Note: In a full implementation, validate this against frontend state
        // For now, trust the input (frontend should ensure correctness)

        emit RandomnessRequested(requestId, msg.sender);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        VRFRequest memory request = requestDetails[requestId];
        uint256 randomValue = randomWords[0];

        if (request.requestType == RequestType.Solve) {
            _handleSolveRequest(request, randomValue);
        } else if (request.requestType == RequestType.Steal) {
            _handleStealRequest(request, randomValue);
        } else if (request.requestType == RequestType.Reveal) {
            _handleRevealRequest(request, randomValue);
        }

        delete requestDetails[requestId];
    }

    function _handleSolveRequest(VRFRequest memory request, uint256 randomValue) internal {
        address solver = request.requester;

        // Use randomness to determine which clue to solve (for dynamic hunts)
        // For now, just solve a random active clue owned by the solver
        uint256[] memory playerClueIds = playerClues[solver];
        require(playerClueIds.length > 0, "No clues to solve");

        uint256 clueIndex = randomValue % playerClueIds.length;
        uint256 tokenId = playerClueIds[clueIndex];

        _solveClue(tokenId, solver);
    }

    function _handleStealRequest(VRFRequest memory request, uint256 randomValue) internal {
        address stealer = request.requester;
        uint256 tokenId = request.targetTokenId;
        Faction targetFaction = request.targetFaction;
        Faction thiefFaction = request.thiefFaction;

        // Determine success based on random value (25% success rate)
        bool stealSuccess = (randomValue % 100) < STEAL_SUCCESS_RATE;

        if (stealSuccess) {
            // Steal 20% of the target faction's total score
            uint256 stolenAmount = factionScores[targetFaction] / 5; // 20%
            factionScores[targetFaction] -= stolenAmount;

            // Transfer 10% to thief's faction (as suggested for better economics)
            uint256 toThief = stolenAmount / 2; // 10% of original
            factionScores[thiefFaction] += toThief;

            // The remaining 10% is effectively burned (removed from total scores)

            emit ClueStolen(tokenId, stealer, ownerOf(tokenId), stolenAmount);
        } else {
            // Transfer fee to target faction's pot
            factionPots[targetFaction] += STEAL_FEE;

            emit StealFailed(tokenId, stealer, ownerOf(tokenId));
        }
    }

    function _handleRevealRequest(VRFRequest memory request, uint256 randomValue) internal {
        uint256 totalTokens = _tokenIdCounter.current();
        require(totalTokens > 0, "No tokens exist");

        uint256 revealedTokenId = randomValue % totalTokens;
        // Ensure token exists and not blocked
        while (!_exists(revealedTokenId) || revealBlockedUntil[revealedTokenId] > block.timestamp) {
            revealedTokenId = (revealedTokenId + 1) % totalTokens;
        }

        uint256 duration = request.targetTokenId; // Stored duration in seconds
        revealUntil[revealedTokenId] = block.timestamp + duration;

        emit PlayerRevealed(revealedTokenId, revealUntil[revealedTokenId]);
    }

    function calculateFee(uint256 numReveals, uint256 durationHours) external pure returns (uint256) {
        uint256 baseFee = 0.001 ether;
        return baseFee * numReveals * (durationHours / 24 + 1);
    }

    function calculateBlockFee(uint256 durationHours) external pure returns (uint256) {
        uint256 baseBlockFee = 0.002 ether;
        return baseBlockFee * (durationHours / 24 + 1);
    }

    function blockReveal(uint256 durationHours) external payable {
        uint256 tokenId = playerToken[msg.sender];
        require(tokenId != 0, "No NFT owned");

        uint256 baseBlockFee = 0.002 ether;
        uint256 totalFee = baseBlockFee * (durationHours / 24 + 1);
        require(msg.value >= totalFee, "Insufficient block fee");

        revealBlockedUntil[tokenId] = block.timestamp + durationHours * 3600;

        emit RevealBlocked(tokenId, revealBlockedUntil[tokenId]);
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

    function getFactionPot(Faction faction) public view returns (uint256) {
        return factionPots[faction];
    }

    function withdrawFactionPot(Faction faction) public nonReentrant {
        // Require caller to own at least one clue to prevent wild west withdrawals
        require(balanceOf(msg.sender) > 0, "Must own clues to withdraw faction pot");
        uint256 amount = factionPots[faction];
        require(amount > 0, "No funds in pot");

        factionPots[faction] = 0;
        payable(msg.sender).transfer(amount);
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

    // New functions for clue collection and reveal
    function collectClue(uint256 tokenId, string memory encryptedClue) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        tokenClues[tokenId].push(encryptedClue);
    }

    function getClues(uint256 tokenId) external view returns (string[] memory) {
        if (
            revealUntil[tokenId] > block.timestamp || msg.sender == ownerOf(tokenId)
                || revealBlockedUntil[tokenId] < block.timestamp
        ) {
            return tokenClues[tokenId];
        } else {
            return new string[](0);
        }
    }

    function randomReveal(uint256 numReveals, uint256 durationHours) external payable {
        require(numReveals > 0 && numReveals <= 5, "1-5 reveals max");
        require(durationHours >= 1 && durationHours <= 72, "1-72 hours");
        uint256 totalTokens = _tokenIdCounter.current();
        require(totalTokens >= numReveals, "Not enough tokens");

        uint256 baseFee = 0.001 ether;
        uint256 totalFee = baseFee * numReveals * (durationHours / 24 + 1); // Scales with reveals and duration
        require(msg.value >= totalFee, "Insufficient fee");

        for (uint256 i = 0; i < numReveals; i++) {
            uint256 requestId = COORDINATOR.requestRandomWords(
                keyHash, s_subscriptionId, requestConfirmations, callbackGasLimit, numWords
            );

            requestDetails[requestId] =
                VRFRequest(RequestType.Reveal, msg.sender, durationHours * 3600, Faction.Red, Faction.Red);

            emit RandomnessRequested(requestId, msg.sender);
        }
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

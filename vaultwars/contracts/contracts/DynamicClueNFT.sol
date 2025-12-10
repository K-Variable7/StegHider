// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract DynamicClueNFT is ERC721, ERC721URIStorage, VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    VRFCoordinatorV2Interface COORDINATOR;

    // Chainlink VRF Configuration
    uint64 s_subscriptionId;
    address vrfCoordinator = 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE; // Base Sepolia
    bytes32 keyHash = 0x9e1344a1247c8a1785d0a6751e63be47de3e7b5c7fd7e0f24df0e0e1e3f0e8f8; // Base Sepolia
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

    // Tier enum for pricing
    enum Tier {
        Basic, // 0.001 ETH - Common clues
        Rare, // 0.005 ETH - Rare clues with better rewards
        Epic // 0.01 ETH - Epic clues with highest rewards
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
        Tier tier;
        uint256 difficulty;
        bytes32 clueHash;
        address creator;
        uint256 createdAt;
        bool solved;
        address solver;
        uint256 solvedAt;
        uint256 points;
    }

    struct EvolutionState {
        uint256 level;
        uint256 experience;
        uint256 cluesCollected;
        uint256 lastEvolution;
    }

    // State variables
    mapping(uint256 => Clue) public clues;
    mapping(uint256 => EvolutionState) public evolutionStates;
    mapping(uint256 => uint256) public s_requests;
    mapping(address => Faction) public playerFactions;
    mapping(Faction => uint256) public factionScores;
    mapping(address => uint256[]) public playerClues;
    mapping(address => uint256) public playerPoints;

    VRFRequest[] public vrfRequests;

    uint256 public constant MINT_PRICE_BASIC = 0.001 ether; // $2.50 - Accessible entry point
    uint256 public constant MINT_PRICE_RARE = 0.005 ether; // $12.50 - Premium clues
    uint256 public constant MINT_PRICE_EPIC = 0.01 ether; // $25 - Legendary clues
    uint256 public constant BASE_REVEAL_FEE = 0.001 ether;
    uint256 public constant BASE_BLOCK_FEE = 0.002 ether;
    uint256 public constant FACTION_DISCOUNT = 20; // 20% discount

    // Get mint price for a specific tier
    function getMintPrice(Tier tier) public pure returns (uint256) {
        if (tier == Tier.Basic) return MINT_PRICE_BASIC;
        if (tier == Tier.Rare) return MINT_PRICE_RARE;
        if (tier == Tier.Epic) return MINT_PRICE_EPIC;
        revert("Invalid tier");
    }

    event ClueMinted(uint256 indexed tokenId, address indexed creator, Faction faction, Tier tier, uint256 difficulty);
    event ClueSolved(uint256 indexed tokenId, address indexed solver, uint256 points);
    event ClueStolen(
        uint256 indexed tokenId, address indexed stealer, address indexed victim, uint256 stolenMultiplier
    );
    event DifficultyScaled(uint256 newDifficulty);
    event RandomRevealRequested(address indexed requester, uint256 numReveals, uint256 durationSeconds);
    event BlockRevealRequested(address indexed requester, uint256 durationSeconds);

    // Tournament System
    struct Tournament {
        uint256 id;
        string name;
        uint256 entryFee;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        address[] participants;
        bool active;
        address winner;
    }

    // Daily Challenge System
    struct DailyChallenge {
        uint256 day;
        string description;
        bytes32 solutionHash;
        uint256 reward;
        bool active;
        address winner;
        uint256 solvedAt;
    }

    // Marketplace Listing
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    // Staking Data
    struct Stake {
        uint256 tokenId;
        address staker;
        uint256 stakedAt;
        uint256 duration;
        uint256 rewardMultiplier;
    }

    // New state variables
    mapping(uint256 => Tournament) public tournaments;
    mapping(address => uint256[]) public userTournaments;
    mapping(uint256 => DailyChallenge) public dailyChallenges;
    mapping(address => uint256) public lastChallengeCompletion;
    mapping(address => address) public referrers; // referral system
    mapping(address => uint256) public referralRewards;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) public userStakes;

    // Seasonal Events System
    struct SeasonalEvent {
        uint256 id;
        string name;
        string theme;
        uint256 startTime;
        uint256 endTime;
        uint256 tournamentMultiplier; // e.g., 200 = 2x rewards
        uint256 challengeMultiplier; // e.g., 150 = 1.5x rewards
        uint256 stakingMultiplier; // e.g., 120 = 1.2x rewards
        bool active;
        uint256 specialNFTsMinted;
        uint256 maxSpecialNFTs;
    }

    struct EventParticipation {
        uint256 eventId;
        address participant;
        uint256 tournamentsJoined;
        uint256 challengesCompleted;
        uint256 nftsStaked;
        uint256 totalBonusEarned;
        bool claimedReward;
    }

    // Seasonal Events state
    mapping(uint256 => SeasonalEvent) public seasonalEvents;
    mapping(uint256 => mapping(address => EventParticipation)) public eventParticipations;
    uint256 public nextEventId = 1;
    uint256 public activeEventId = 0;

    uint256 public nextTournamentId = 1;
    uint256 public currentDay = 1;
    uint256 public constant STAKING_REWARD_RATE = 10; // 10% bonus per day
    uint256 public constant REFERRAL_REWARD = 0.001 ether;

    // New events
    event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee, uint256 endTime);
    event TournamentJoined(uint256 indexed tournamentId, address indexed participant);
    event TournamentEnded(uint256 indexed tournamentId, address indexed winner, uint256 prize);
    event DailyChallengeSolved(address indexed solver, uint256 day, uint256 reward);
    event ReferralReward(address indexed referrer, address indexed referee, uint256 reward);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event NFTStaked(uint256 indexed tokenId, address indexed staker, uint256 duration);
    event NFTUnstaked(uint256 indexed tokenId, address indexed staker, uint256 reward);

    constructor(uint64 subscriptionId) ERC721("DynamicClueNFT", "DCNFT") VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        keyHash = 0x9e1344a1247c8a1785d0a6751e63be47de3e7b5c7fd7e0f24df0e0e1e3f0e8f8;
    }

    // Fee calculation functions with user address parameter
    function calculateFee(uint256 numReveals, uint256 durationHours, address user) public view returns (uint256) {
        uint256 baseFee = BASE_REVEAL_FEE * numReveals * durationHours;
        Faction userFaction = playerFactions[user];

        // Apply Red faction discount (20% off reveals)
        if (userFaction == Faction.Red) {
            baseFee = (baseFee * (100 - FACTION_DISCOUNT)) / 100;
        }

        return baseFee;
    }

    function calculateBlockFee(uint256 durationHours, address user) public view returns (uint256) {
        uint256 baseFee = BASE_BLOCK_FEE * durationHours;
        Faction userFaction = playerFactions[user];

        // Apply Blue faction discount (20% off blocks)
        if (userFaction == Faction.Blue) {
            baseFee = (baseFee * (100 - FACTION_DISCOUNT)) / 100;
        }

        return baseFee;
    }

    // Mint function with tiered pricing
    function mintClue(address to, uint256 faction, uint256 tier, uint256 difficulty, bytes32 clueHash)
        public
        payable
        nonReentrant
    {
        require(faction <= 3, "Invalid faction");
        require(tier <= 2, "Invalid tier");

        Tier clueTier = Tier(tier);
        uint256 requiredPrice = getMintPrice(clueTier);
        require(msg.value >= requiredPrice, "Insufficient mint price");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);

        clues[tokenId] = Clue({
            tokenId: tokenId,
            faction: Faction(faction),
            tier: clueTier,
            difficulty: difficulty,
            clueHash: clueHash,
            creator: to,
            createdAt: block.timestamp,
            solved: false,
            solver: address(0),
            solvedAt: 0,
            points: 0
        });

        evolutionStates[tokenId] =
            EvolutionState({level: 1, experience: 0, cluesCollected: 0, lastEvolution: block.timestamp});

        playerFactions[to] = Faction(faction);
        playerClues[to].push(tokenId);

        emit ClueMinted(tokenId, to, Faction(faction), clueTier, difficulty);
    }

    // Backward compatibility - defaults to Basic tier
    function mintClue(address to, uint256 faction, uint256 difficulty, bytes32 clueHash) public payable nonReentrant {
        mintClue(to, faction, 0, difficulty, clueHash); // 0 = Basic tier
    }

    // Reveal functions
    function randomReveal(uint256 numReveals, uint256 durationSeconds) public payable {
        uint256 fee = calculateFee(numReveals, durationSeconds / 3600, msg.sender);
        require(msg.value >= fee, "Insufficient fee");

        uint256 requestId =
            COORDINATOR.requestRandomWords(keyHash, s_subscriptionId, requestConfirmations, callbackGasLimit, numWords);

        vrfRequests.push(
            VRFRequest({
                requestType: RequestType.Reveal,
                requester: msg.sender,
                targetTokenId: 0,
                targetFaction: Faction.Red,
                thiefFaction: Faction.Red
            })
        );

        s_requests[requestId] = vrfRequests.length - 1;

        emit RandomRevealRequested(msg.sender, numReveals, durationSeconds);
    }

    function blockReveal(uint256 durationSeconds) public payable {
        uint256 fee = calculateBlockFee(durationSeconds / 3600, msg.sender);
        require(msg.value >= fee, "Insufficient fee");

        // Block reveal logic would go here
        emit BlockRevealRequested(msg.sender, durationSeconds);
    }

    // VRF callback
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 requestIndex = s_requests[requestId];
        VRFRequest memory request = vrfRequests[requestIndex];

        if (request.requestType == RequestType.Reveal) {
            // Handle random reveal
            // Implementation would depend on game logic
        }
    }

    // View functions
    function getEvolutionState(uint256 tokenId) public view returns (EvolutionState memory) {
        return evolutionStates[tokenId];
    }

    function getFactionScore(uint256 faction) public view returns (uint256) {
        return factionScores[Faction(faction)];
    }

    function getPlayerClues(address player) public view returns (uint256[] memory) {
        return playerClues[player];
    }

    // Additional functions for testing and functionality
    function addExperience(uint256 tokenId, uint256 amount, string memory reason) public onlyOwner {
        evolutionStates[tokenId].experience += amount;

        // Simple leveling logic
        uint256 newLevel = evolutionStates[tokenId].experience / 100 + 1;
        if (newLevel > evolutionStates[tokenId].level) {
            evolutionStates[tokenId].level = newLevel;
            evolutionStates[tokenId].lastEvolution = block.timestamp;
        }
    }

    function playerToken(address player) public view returns (uint256) {
        require(playerClues[player].length > 0, "Player has no tokens");
        return playerClues[player][0]; // Return first token
    }

    function generateSVG(uint256 tokenId) public view returns (string memory) {
        Clue memory clue = clues[tokenId];
        EvolutionState memory evolution = evolutionStates[tokenId];

        string memory factionName;
        if (clue.faction == Faction.Red) {
            factionName = "Crimson Legion";
        } else if (clue.faction == Faction.Blue) {
            factionName = "Azure Order";
        } else if (clue.faction == Faction.Green) {
            factionName = "Verdant Alliance";
        } else {
            factionName = "Golden Dominion";
        }

        return string(
            abi.encodePacked(
                '{"name":"Dynamic Clue #',
                Strings.toString(tokenId),
                '","faction":"',
                factionName,
                '","level":',
                Strings.toString(evolution.level),
                ',"experience":',
                Strings.toString(evolution.experience),
                "}"
            )
        );
    }

    // Override tokenURI to return gateway URL
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return string(
            abi.encodePacked(
                "https://vaultwars.vercel.app/api/nft/",
                Strings.toString(tokenId),
                "?v=",
                Strings.toString(block.timestamp)
            )
        );
    }

    // ========== TOURNAMENT SYSTEM ==========

    function createTournament(string memory name, uint256 entryFee, uint256 durationHours) external onlyOwner {
        uint256 tournamentId = nextTournamentId++;
        uint256 endTime = block.timestamp + (durationHours * 3600);

        tournaments[tournamentId] = Tournament({
            id: tournamentId,
            name: name,
            entryFee: entryFee,
            startTime: block.timestamp,
            endTime: endTime,
            prizePool: 0,
            participants: new address[](0),
            active: true,
            winner: address(0)
        });

        emit TournamentCreated(tournamentId, name, entryFee, endTime);
    }

    function joinTournament(uint256 tournamentId) external payable nonReentrant {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.active, "Tournament not active");
        require(block.timestamp < tournament.endTime, "Tournament ended");
        require(msg.value >= tournament.entryFee, "Insufficient entry fee");

        // Check if already joined
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            require(tournament.participants[i] != msg.sender, "Already joined");
        }

        tournament.participants.push(msg.sender);
        tournament.prizePool += msg.value;
        userTournaments[msg.sender].push(tournamentId);

        // Apply event bonus if active
        if (activeEventId > 0 && seasonalEvents[activeEventId].active) {
            eventParticipations[activeEventId][msg.sender].tournamentsJoined++;
        }

        emit TournamentJoined(tournamentId, msg.sender);
    }

    function endTournament(uint256 tournamentId) external onlyOwner {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.active, "Tournament already ended");
        require(
            block.timestamp >= tournament.endTime || tournament.participants.length >= 10, "Tournament still running"
        );

        tournament.active = false;

        if (tournament.participants.length > 0) {
            // Simple winner selection (in production, use more sophisticated logic)
            uint256 winnerIndex =
                uint256(keccak256(abi.encodePacked(block.timestamp, tournamentId))) % tournament.participants.length;
            tournament.winner = tournament.participants[winnerIndex];

            // Transfer prize
            payable(tournament.winner).transfer(tournament.prizePool);

            emit TournamentEnded(tournamentId, tournament.winner, tournament.prizePool);
        }
    }

    // ========== DAILY CHALLENGES ==========

    function createDailyChallenge(string memory description, bytes32 solutionHash, uint256 reward) external onlyOwner {
        dailyChallenges[currentDay] = DailyChallenge({
            day: currentDay,
            description: description,
            solutionHash: solutionHash,
            reward: reward,
            active: true,
            winner: address(0),
            solvedAt: 0
        });
    }

    function solveDailyChallenge(string memory solution) external {
        DailyChallenge storage challenge = dailyChallenges[currentDay];
        require(challenge.active, "No active challenge");
        require(lastChallengeCompletion[msg.sender] < currentDay, "Already completed today");
        require(keccak256(abi.encodePacked(solution)) == challenge.solutionHash, "Wrong solution");

        challenge.active = false;
        challenge.winner = msg.sender;
        challenge.solvedAt = block.timestamp;
        lastChallengeCompletion[msg.sender] = currentDay;

        uint256 reward = challenge.reward;

        // Apply event bonus if active
        if (activeEventId > 0 && seasonalEvents[activeEventId].active) {
            reward = applyEventMultiplier(reward, seasonalEvents[activeEventId].challengeMultiplier);
            eventParticipations[activeEventId][msg.sender].challengesCompleted++;
            eventParticipations[activeEventId][msg.sender].totalBonusEarned += (reward - challenge.reward);
        }

        // Reward the solver
        payable(msg.sender).transfer(reward);

        emit DailyChallengeSolved(msg.sender, currentDay, reward);
    }

    function advanceDay() external onlyOwner {
        currentDay++;
    }

    // ========== REFERRAL SYSTEM ==========

    function setReferrer(address referee, address referrer) external onlyOwner {
        require(referrers[referee] == address(0), "Referrer already set");
        referrers[referee] = referrer;
    }

    function claimReferralReward() external {
        require(referrers[msg.sender] != address(0), "No referrer set");
        require(referralRewards[msg.sender] == 0, "Reward already claimed");

        referralRewards[msg.sender] = REFERRAL_REWARD;
        payable(msg.sender).transfer(REFERRAL_REWARD);

        emit ReferralReward(referrers[msg.sender], msg.sender, REFERRAL_REWARD);
    }

    // ========== MARKETPLACE ==========

    function listNFT(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be greater than 0");

        listings[tokenId] = Listing({tokenId: tokenId, seller: msg.sender, price: price, active: true});

        emit NFTListed(tokenId, msg.sender, price);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "NFT not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        // Transfer NFT
        _transfer(listing.seller, msg.sender, tokenId);

        // Pay seller
        payable(listing.seller).transfer(listing.price);

        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        // Remove listing
        listings[tokenId].active = false;

        emit NFTSold(tokenId, msg.sender, listing.seller, listing.price);
    }

    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        listings[tokenId].active = false;
    }

    // ========== STAKING SYSTEM ==========

    function stakeNFT(uint256 tokenId, uint256 durationDays) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(durationDays >= 1 && durationDays <= 365, "Invalid duration");

        uint256 rewardMultiplier = STAKING_REWARD_RATE * durationDays;

        // Apply event bonus if active
        if (activeEventId > 0 && seasonalEvents[activeEventId].active) {
            rewardMultiplier = applyEventMultiplier(rewardMultiplier, seasonalEvents[activeEventId].stakingMultiplier);
            eventParticipations[activeEventId][msg.sender].nftsStaked++;
        }

        stakes[tokenId] = Stake({
            tokenId: tokenId,
            staker: msg.sender,
            stakedAt: block.timestamp,
            duration: durationDays * 86400,
            rewardMultiplier: rewardMultiplier
        });

        userStakes[msg.sender].push(tokenId);

        emit NFTStaked(tokenId, msg.sender, durationDays);
    }

    function unstakeNFT(uint256 tokenId) external {
        Stake memory stake = stakes[tokenId];
        require(stake.staker == msg.sender, "Not staker");
        require(block.timestamp >= stake.stakedAt + stake.duration, "Staking period not complete");

        // Calculate rewards (simplified - in production use more complex logic)
        uint256 reward = (stake.rewardMultiplier * BASE_REVEAL_FEE) / 100;

        // Send reward
        payable(msg.sender).transfer(reward);

        // Clear stake
        delete stakes[tokenId];

        // Remove from user stakes array
        for (uint256 i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i] == tokenId) {
                userStakes[msg.sender][i] = userStakes[msg.sender][userStakes[msg.sender].length - 1];
                userStakes[msg.sender].pop();
                break;
            }
        }

        emit NFTUnstaked(tokenId, msg.sender, reward);
    }

    // ========== VIEW FUNCTIONS ==========

    function getTournamentParticipants(uint256 tournamentId) external view returns (address[] memory) {
        return tournaments[tournamentId].participants;
    }

    function getUserTournaments(address user) external view returns (uint256[] memory) {
        return userTournaments[user];
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256[] memory activeListings = new uint256[](100); // Simplified - in production use dynamic array
        uint256 count = 0;

        for (uint256 i = 1; i <= _tokenIdCounter.current() && count < 100; i++) {
            if (listings[i].active) {
                activeListings[count] = i;
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeListings[i];
        }

        return result;
    }

    function getUserStakes(address user) external view returns (uint256[] memory) {
        return userStakes[user];
    }

    // ===== SEASONAL EVENTS SYSTEM =====

    function createSeasonalEvent(
        string memory name,
        string memory theme,
        uint256 startTime,
        uint256 endTime,
        uint256 tournamentMultiplier,
        uint256 challengeMultiplier,
        uint256 stakingMultiplier,
        uint256 maxSpecialNFTs
    ) external onlyOwner {
        require(startTime < endTime, "Invalid time range");
        require(startTime > block.timestamp, "Start time must be in future");

        seasonalEvents[nextEventId] = SeasonalEvent({
            id: nextEventId,
            name: name,
            theme: theme,
            startTime: startTime,
            endTime: endTime,
            tournamentMultiplier: tournamentMultiplier,
            challengeMultiplier: challengeMultiplier,
            stakingMultiplier: stakingMultiplier,
            active: false,
            specialNFTsMinted: 0,
            maxSpecialNFTs: maxSpecialNFTs
        });

        nextEventId++;
    }

    function activateEvent(uint256 eventId) external onlyOwner {
        require(seasonalEvents[eventId].startTime > 0, "Event does not exist");
        require(block.timestamp >= seasonalEvents[eventId].startTime, "Event not started yet");
        require(block.timestamp <= seasonalEvents[eventId].endTime, "Event has ended");

        // Deactivate current event if any
        if (activeEventId > 0) {
            seasonalEvents[activeEventId].active = false;
        }

        seasonalEvents[eventId].active = true;
        activeEventId = eventId;
    }

    function getActiveEvent() external view returns (SeasonalEvent memory) {
        return seasonalEvents[activeEventId];
    }

    function getEventParticipation(uint256 eventId, address participant)
        external
        view
        returns (EventParticipation memory)
    {
        return eventParticipations[eventId][participant];
    }

    function claimEventReward(uint256 eventId) external nonReentrant {
        require(seasonalEvents[eventId].endTime < block.timestamp, "Event still active");
        require(eventParticipations[eventId][msg.sender].totalBonusEarned > 0, "No rewards to claim");
        require(!eventParticipations[eventId][msg.sender].claimedReward, "Reward already claimed");

        uint256 reward = eventParticipations[eventId][msg.sender].totalBonusEarned;
        eventParticipations[eventId][msg.sender].claimedReward = true;

        payable(msg.sender).transfer(reward);
    }

    function mintSpecialEventNFT(address to, uint256 eventId) external onlyOwner {
        require(seasonalEvents[eventId].active, "Event not active");
        require(
            seasonalEvents[eventId].specialNFTsMinted < seasonalEvents[eventId].maxSpecialNFTs,
            "Max special NFTs reached"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        seasonalEvents[eventId].specialNFTsMinted++;

        // Mint special themed NFT
        _mint(to, tokenId);
        clues[tokenId] = Clue({
            tokenId: tokenId,
            faction: Faction.Gold, // Special event faction
            tier: Tier.Epic, // Special event tier
            difficulty: 5, // Higher difficulty for special NFTs
            clueHash: keccak256(abi.encodePacked("Special Event NFT", eventId, tokenId)),
            creator: address(this),
            createdAt: block.timestamp,
            solved: false,
            solver: address(0),
            solvedAt: 0,
            points: 100 // Bonus points
        });

        playerClues[to].push(tokenId);

        emit ClueMinted(tokenId, address(this), Faction.Gold, Tier.Epic, 5);
    }

    // Internal function to apply event multipliers
    function applyEventMultiplier(uint256 baseAmount, uint256 multiplier) internal pure returns (uint256) {
        return (baseAmount * multiplier) / 100;
    }

    // ERC721 overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

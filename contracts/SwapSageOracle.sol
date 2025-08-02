// SPDX-License-Identifier: MIT
// This line specifies the license under which this code is released (MIT License)

pragma solidity ^0.8.24;
// This line specifies the Solidity compiler version to use (0.8.24 or higher)

import "@openzeppelin/contracts/access/Ownable.sol";
// Import the Ownable contract from OpenZeppelin for access control functionality

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// Import the ReentrancyGuard contract to prevent reentrancy attacks

/**
 * @title SwapSageOracle
 * @dev AI-powered oracle for providing price feeds and swap recommendations
 * 
 * This contract acts as a central oracle that provides:
 * - Price feeds for various tokens
 * - AI-powered swap recommendations
 * - Cross-chain price data
 * 
 * @author SwapSage AI Team
 */
contract SwapSageOracle is Ownable, ReentrancyGuard {
    // Define a contract that inherits from Ownable and ReentrancyGuard
    
    struct PriceFeed {
        // Define a struct to store price feed information
        address token;        // The token address (address(0) for ETH)
        uint256 price;        // Price in USD with 8 decimals (e.g., $2000 = 2000000000)
        uint256 timestamp;    // When this price was last updated
        bool isValid;         // Whether this price feed is currently valid
    }
    
    struct SwapRecommendation {
        // Define a struct to store AI-powered swap recommendations
        address fromToken;    // Source token address
        address toToken;      // Destination token address
        uint256 expectedAmount; // Expected output amount
        uint256 confidence;   // Confidence level (0-10000 basis points, 10000 = 100%)
        uint256 timestamp;    // When this recommendation was created
        bool isValid;         // Whether this recommendation is still valid
    }
    
    // Mapping from token address to price feed
    mapping(address => PriceFeed) public priceFeeds;
    // Public mapping that stores price feeds for each token address
    
    // Mapping from swap hash to recommendation
    mapping(bytes32 => SwapRecommendation) public swapRecommendations;
    // Public mapping that stores swap recommendations indexed by their hash
    
    // Events
    event PriceFeedUpdated(address indexed token, uint256 price, uint256 timestamp);
    // Event emitted when a price feed is updated
    // indexed token allows efficient filtering of events by token address
    
    event SwapRecommendationCreated(
        bytes32 indexed swapHash,
        address fromToken,
        address toToken,
        uint256 expectedAmount,
        uint256 confidence
    );
    // Event emitted when a new swap recommendation is created
    
    event OracleUpdated(address indexed oracle, bool isActive);
    // Event emitted when an oracle's authorization status is changed
    
    // State variables
    mapping(address => bool) public authorizedOracles;
    // Mapping to track which addresses are authorized to update price feeds
    
    uint256 public constant PRICE_DECIMALS = 8;
    // Constant defining the number of decimal places for price values (8 decimals)
    
    uint256 public constant CONFIDENCE_DECIMALS = 10000;
    // Constant defining the maximum confidence value (10000 = 100%)
    
    uint256 public minConfidence = 7000; // 70% minimum confidence
    // Minimum confidence threshold for swap recommendations (70%)
    
    modifier onlyAuthorizedOracle() {
        // Custom modifier to restrict access to authorized oracles only
        require(authorizedOracles[msg.sender] || msg.sender == owner(), "Not authorized");
        // Require that the caller is either an authorized oracle or the contract owner
        _;
        // Continue with the function execution if the requirement is met
    }
    
    constructor() Ownable(msg.sender) {
        // Constructor function that initializes the contract
        // Ownable(msg.sender) sets the contract deployer as the owner
        
        // Initialize with some default price feeds
        priceFeeds[address(0)] = PriceFeed({
            // Set up a default price feed for ETH (address(0))
            token: address(0),           // ETH token address
            price: 2000000000,           // $2000 USD (with 8 decimals)
            timestamp: block.timestamp,  // Current block timestamp
            isValid: true                // Mark as valid
        });
    }
    
    /**
     * @dev Update price feed for a token
     * @param token Token address (address(0) for ETH)
     * @param price Price in USD with 8 decimals
     */
    function updatePriceFeed(address token, uint256 price) 
        external 
        onlyAuthorizedOracle 
        nonReentrant 
    {
        // External function to update price feeds
        // onlyAuthorizedOracle: Only authorized oracles can call this
        // nonReentrant: Prevents reentrancy attacks
        
        require(price > 0, "Invalid price");
        // Ensure the price is greater than zero
        
        priceFeeds[token] = PriceFeed({
            // Update the price feed for the specified token
            token: token,                // Token address
            price: price,                // New price in USD (8 decimals)
            timestamp: block.timestamp,  // Current timestamp
            isValid: true                // Mark as valid
        });
        
        emit PriceFeedUpdated(token, price, block.timestamp);
        // Emit event to notify listeners of the price update
    }
    
    /**
     * @dev Create a swap recommendation
     * @param fromToken Source token address
     * @param toToken Destination token address
     * @param expectedAmount Expected output amount
     * @param confidence Confidence level (0-10000)
     */
    function createSwapRecommendation(
        address fromToken,
        address toToken,
        uint256 expectedAmount,
        uint256 confidence
    ) 
        external 
        onlyAuthorizedOracle 
        nonReentrant 
    {
        // External function to create AI-powered swap recommendations
        // onlyAuthorizedOracle: Only authorized oracles can call this
        // nonReentrant: Prevents reentrancy attacks
        
        require(fromToken != toToken, "Same tokens");
        // Ensure source and destination tokens are different
        
        require(expectedAmount > 0, "Invalid amount");
        // Ensure expected amount is greater than zero
        
        require(confidence <= CONFIDENCE_DECIMALS, "Invalid confidence");
        // Ensure confidence doesn't exceed maximum (10000)
        
        require(confidence >= minConfidence, "Low confidence");
        // Ensure confidence meets minimum threshold (70%)
        
        bytes32 swapHash = keccak256(
            abi.encodePacked(fromToken, toToken, expectedAmount, block.timestamp)
        );
        // Generate a unique hash for this swap recommendation
        // Uses keccak256 hash of encoded parameters
        
        swapRecommendations[swapHash] = SwapRecommendation({
            // Store the swap recommendation
            fromToken: fromToken,        // Source token
            toToken: toToken,            // Destination token
            expectedAmount: expectedAmount, // Expected output
            confidence: confidence,      // Confidence level
            timestamp: block.timestamp,  // Current timestamp
            isValid: true                // Mark as valid
        });
        
        emit SwapRecommendationCreated(
            swapHash,
            fromToken,
            toToken,
            expectedAmount,
            confidence
        );
        // Emit event to notify listeners of the new recommendation
    }
    
    /**
     * @dev Get current price for a token
     * @param token Token address
     * @return price Current price in USD with 8 decimals
     * @return timestamp Last update timestamp
     * @return isValid Whether the price feed is valid
     */
    function getPrice(address token) 
        external 
        view 
        returns (uint256 price, uint256 timestamp, bool isValid) 
    {
        // External view function to get current price information
        // view: This function doesn't modify state, only reads data
        
        PriceFeed memory feed = priceFeeds[token];
        // Get the price feed for the specified token
        
        return (feed.price, feed.timestamp, feed.isValid);
        // Return the price, timestamp, and validity status
    }
    
    /**
     * @dev Get swap recommendation
     * @param swapHash Hash of the swap parameters
     * @return recommendation The swap recommendation
     */
    function getSwapRecommendation(bytes32 swapHash) 
        external 
        view 
        returns (SwapRecommendation memory recommendation) 
    {
        // External view function to get swap recommendation details
        // view: This function doesn't modify state, only reads data
        
        return swapRecommendations[swapHash];
        // Return the swap recommendation for the specified hash
    }
    
    /**
     * @dev Add or remove authorized oracle
     * @param oracle Oracle address
     * @param isActive Whether to authorize or deauthorize
     */
    function setAuthorizedOracle(address oracle, bool isActive) 
        external 
        onlyOwner 
    {
        // External function to manage authorized oracles
        // onlyOwner: Only the contract owner can call this
        
        authorizedOracles[oracle] = isActive;
        // Set the oracle's authorization status
        
        emit OracleUpdated(oracle, isActive);
        // Emit event to notify listeners of the authorization change
    }
    
    /**
     * @dev Set minimum confidence threshold
     * @param newMinConfidence New minimum confidence (0-10000)
     */
    function setMinConfidence(uint256 newMinConfidence) 
        external 
        onlyOwner 
    {
        // External function to update minimum confidence threshold
        // onlyOwner: Only the contract owner can call this
        
        require(newMinConfidence <= CONFIDENCE_DECIMALS, "Invalid confidence");
        // Ensure new minimum doesn't exceed maximum confidence
        
        minConfidence = newMinConfidence;
        // Update the minimum confidence threshold
    }
    
    /**
     * @dev Emergency function to invalidate a price feed
     * @param token Token address
     */
    function invalidatePriceFeed(address token) 
        external 
        onlyOwner 
    {
        // Emergency function to mark a price feed as invalid
        // onlyOwner: Only the contract owner can call this
        
        priceFeeds[token].isValid = false;
        // Mark the price feed as invalid
    }
    
    /**
     * @dev Emergency function to invalidate a swap recommendation
     * @param swapHash Hash of the swap parameters
     */
    function invalidateSwapRecommendation(bytes32 swapHash) 
        external 
        onlyOwner 
    {
        // Emergency function to mark a swap recommendation as invalid
        // onlyOwner: Only the contract owner can call this
        
        swapRecommendations[swapHash].isValid = false;
        // Mark the swap recommendation as invalid
    }
} 
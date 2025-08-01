// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
    
    struct PriceFeed {
        address token;
        uint256 price; // Price in USD with 8 decimals
        uint256 timestamp;
        bool isValid;
    }
    
    struct SwapRecommendation {
        address fromToken;
        address toToken;
        uint256 expectedAmount;
        uint256 confidence; // 0-10000 (basis points)
        uint256 timestamp;
        bool isValid;
    }
    
    // Mapping from token address to price feed
    mapping(address => PriceFeed) public priceFeeds;
    
    // Mapping from swap hash to recommendation
    mapping(bytes32 => SwapRecommendation) public swapRecommendations;
    
    // Events
    event PriceFeedUpdated(address indexed token, uint256 price, uint256 timestamp);
    event SwapRecommendationCreated(
        bytes32 indexed swapHash,
        address fromToken,
        address toToken,
        uint256 expectedAmount,
        uint256 confidence
    );
    event OracleUpdated(address indexed oracle, bool isActive);
    
    // State variables
    mapping(address => bool) public authorizedOracles;
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant CONFIDENCE_DECIMALS = 10000;
    uint256 public minConfidence = 7000; // 70% minimum confidence
    
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Initialize with some default price feeds
        priceFeeds[address(0)] = PriceFeed({
            token: address(0),
            price: 2000000000, // ETH at $2000
            timestamp: block.timestamp,
            isValid: true
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
        require(price > 0, "Invalid price");
        
        priceFeeds[token] = PriceFeed({
            token: token,
            price: price,
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit PriceFeedUpdated(token, price, block.timestamp);
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
        require(fromToken != toToken, "Same tokens");
        require(expectedAmount > 0, "Invalid amount");
        require(confidence <= CONFIDENCE_DECIMALS, "Invalid confidence");
        require(confidence >= minConfidence, "Low confidence");
        
        bytes32 swapHash = keccak256(
            abi.encodePacked(fromToken, toToken, expectedAmount, block.timestamp)
        );
        
        swapRecommendations[swapHash] = SwapRecommendation({
            fromToken: fromToken,
            toToken: toToken,
            expectedAmount: expectedAmount,
            confidence: confidence,
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit SwapRecommendationCreated(
            swapHash,
            fromToken,
            toToken,
            expectedAmount,
            confidence
        );
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
        PriceFeed memory feed = priceFeeds[token];
        return (feed.price, feed.timestamp, feed.isValid);
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
        return swapRecommendations[swapHash];
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
        authorizedOracles[oracle] = isActive;
        emit OracleUpdated(oracle, isActive);
    }
    
    /**
     * @dev Set minimum confidence threshold
     * @param newMinConfidence New minimum confidence (0-10000)
     */
    function setMinConfidence(uint256 newMinConfidence) 
        external 
        onlyOwner 
    {
        require(newMinConfidence <= CONFIDENCE_DECIMALS, "Invalid confidence");
        minConfidence = newMinConfidence;
    }
    
    /**
     * @dev Emergency function to invalidate a price feed
     * @param token Token address
     */
    function invalidatePriceFeed(address token) 
        external 
        onlyOwner 
    {
        priceFeeds[token].isValid = false;
    }
    
    /**
     * @dev Emergency function to invalidate a swap recommendation
     * @param swapHash Hash of the swap parameters
     */
    function invalidateSwapRecommendation(bytes32 swapHash) 
        external 
        onlyOwner 
    {
        swapRecommendations[swapHash].isValid = false;
    }
} 
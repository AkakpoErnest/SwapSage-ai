// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title SwapSageOracle
 * @dev Price oracle for SwapSage AI using Chainlink price feeds
 * @author SwapSage AI Team
 */
contract SwapSageOracle is Ownable {
    
    struct PriceFeed {
        address aggregator;
        uint8 decimals;
        string description;
        bool isActive;
    }

    // Mapping from token address to price feed
    mapping(address => PriceFeed) public priceFeeds;
    
    // Supported tokens
    address[] public supportedTokens;
    
    // Events
    event PriceFeedAdded(address indexed token, address aggregator);
    event PriceFeedRemoved(address indexed token);
    event PriceFeedUpdated(address indexed token, address newAggregator);

    constructor() Ownable(msg.sender) {
        // Initialize with common tokens
        _addPriceFeed(
            0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE, // ETH
            0x694AA1769357215DE4FAC081bf1f309aDC325306, // ETH/USD on Sepolia
            8,
            "ETH / USD"
        );
        
        _addPriceFeed(
            0xA0b86a33E6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d, // USDC (mock address)
            0x1cDc4F51831F4d8a2C70b2e9A945978c5aB1d2e6, // USDC/USD on Sepolia
            8,
            "USDC / USD"
        );
    }

    /**
     * @dev Get the latest price for a token
     * @param token The token address
     * @return price The latest price in USD (with 8 decimals)
     * @return timestamp The timestamp of the price
     */
    function getLatestPrice(address token) 
        external 
        view 
        returns (uint256 price, uint256 timestamp) 
    {
        PriceFeed memory feed = priceFeeds[token];
        require(feed.isActive, "Price feed not available");
        
        AggregatorV3Interface aggregator = AggregatorV3Interface(feed.aggregator);
        
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            uint256 timeStamp,
            /*uint80 answeredInRound*/
        ) = aggregator.latestRoundData();
        
        require(answer > 0, "Invalid price");
        require(timeStamp > 0, "Invalid timestamp");
        
        return (uint256(answer), timeStamp);
    }

    /**
     * @dev Get price with custom decimals
     * @param token The token address
     * @param decimals The number of decimals for the price
     */
    function getPriceWithDecimals(address token, uint8 decimals) 
        external 
        view 
        returns (uint256) 
    {
        (uint256 price, ) = this.getLatestPrice(token);
        PriceFeed memory feed = priceFeeds[token];
        
        if (feed.decimals > decimals) {
            return price / (10 ** (feed.decimals - decimals));
        } else if (feed.decimals < decimals) {
            return price * (10 ** (decimals - feed.decimals));
        }
        
        return price;
    }

    /**
     * @dev Get the exchange rate between two tokens
     * @param tokenA The first token
     * @param tokenB The second token
     * @return rate The exchange rate (tokenA/tokenB)
     */
    function getExchangeRate(address tokenA, address tokenB) 
        external 
        view 
        returns (uint256 rate) 
    {
        (uint256 priceA, ) = this.getLatestPrice(tokenA);
        (uint256 priceB, ) = this.getLatestPrice(tokenB);
        
        require(priceB > 0, "Invalid price for token B");
        
        // Calculate rate with 18 decimals precision
        return (priceA * 1e18) / priceB;
    }

    /**
     * @dev Add a new price feed
     * @param token The token address
     * @param aggregator The Chainlink aggregator address
     * @param decimals The number of decimals for the price feed
     * @param description The description of the price feed
     */
    function addPriceFeed(
        address token,
        address aggregator,
        uint8 decimals,
        string calldata description
    ) external onlyOwner {
        _addPriceFeed(token, aggregator, decimals, description);
    }

    /**
     * @dev Remove a price feed
     * @param token The token address
     */
    function removePriceFeed(address token) external onlyOwner {
        require(priceFeeds[token].isActive, "Price feed not found");
        
        priceFeeds[token].isActive = false;
        
        // Remove from supported tokens array
        for (uint i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }
        
        emit PriceFeedRemoved(token);
    }

    /**
     * @dev Update an existing price feed
     * @param token The token address
     * @param newAggregator The new Chainlink aggregator address
     */
    function updatePriceFeed(address token, address newAggregator) external onlyOwner {
        require(priceFeeds[token].isActive, "Price feed not found");
        require(newAggregator != address(0), "Invalid aggregator address");
        
        priceFeeds[token].aggregator = newAggregator;
        
        emit PriceFeedUpdated(token, newAggregator);
    }

    /**
     * @dev Get all supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @dev Check if a token is supported
     * @param token The token address
     */
    function isTokenSupported(address token) external view returns (bool) {
        return priceFeeds[token].isActive;
    }

    /**
     * @dev Get price feed details
     * @param token The token address
     */
    function getPriceFeed(address token) external view returns (PriceFeed memory) {
        return priceFeeds[token];
    }

    /**
     * @dev Internal function to add a price feed
     */
    function _addPriceFeed(
        address token,
        address aggregator,
        uint8 decimals,
        string memory description
    ) internal {
        require(token != address(0), "Invalid token address");
        require(aggregator != address(0), "Invalid aggregator address");
        require(!priceFeeds[token].isActive, "Price feed already exists");
        
        priceFeeds[token] = PriceFeed({
            aggregator: aggregator,
            decimals: decimals,
            description: description,
            isActive: true
        });
        
        supportedTokens.push(token);
        
        emit PriceFeedAdded(token, aggregator);
    }
} 
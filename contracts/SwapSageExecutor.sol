// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SwapSageOracle.sol";

/**
 * @title SwapSageExecutor
 * @dev AI-powered swap executor that handles DEX aggregator integration
 * 
 * This contract handles:
 * - 1inch API integration for optimal swap routes
 * - AI-powered swap execution
 * - Cross-chain swap coordination
 * - Fee management and optimization
 * 
 * @author SwapSage AI Team
 */
contract SwapSageExecutor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct SwapExecution {
        address user;
        address fromToken;
        address toToken;
        uint256 fromAmount;
        uint256 toAmount;
        uint256 actualAmount;
        uint256 gasUsed;
        uint256 timestamp;
        bool success;
        string route;
    }
    
    struct Route {
        address[] path;
        uint256[] amounts;
        uint256 expectedOutput;
        uint256 confidence;
        bool isValid;
    }
    
    // State variables
    SwapSageOracle public oracle;
    mapping(bytes32 => SwapExecution) public executions;
    mapping(address => bool) public authorizedExecutors;
    
    // Events
    event SwapExecuted(
        bytes32 indexed executionId,
        address indexed user,
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 actualAmount,
        uint256 gasUsed,
        bool success
    );
    
    event RouteOptimized(
        bytes32 indexed routeId,
        address fromToken,
        address toToken,
        uint256 expectedOutput,
        uint256 confidence
    );
    
    event ExecutorUpdated(address indexed executor, bool isActive);
    
    // Constants
    uint256 public constant EXECUTION_FEE = 1000; // 0.1% in basis points
    uint256 public constant MIN_CONFIDENCE = 7000; // 70%
    uint256 public constant MAX_SLIPPAGE = 500; // 5%
    
    modifier onlyAuthorizedExecutor() {
        require(authorizedExecutors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(address _oracle) Ownable(msg.sender) {
        oracle = SwapSageOracle(_oracle);
    }
    
    /**
     * @dev Execute a swap with AI-optimized routing
     * 
     * @param fromToken Source token address
     * @param toToken Destination token address
     * @param amount Amount to swap
     * @param minOutput Minimum output amount (slippage protection)
     * @param routeData Optimized route data from AI
     */
    function executeSwap(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 minOutput,
        bytes calldata routeData
    ) external payable nonReentrant {
        require(fromToken != toToken, "Same tokens");
        require(amount > 0, "Invalid amount");
        require(minOutput > 0, "Invalid min output");
        
        bytes32 executionId = keccak256(
            abi.encodePacked(
                msg.sender,
                fromToken,
                toToken,
                amount,
                block.timestamp
            )
        );
        
        require(executions[executionId].user == address(0), "Execution already exists");
        
        // Validate oracle price
        (uint256 oraclePrice, , bool isValid) = oracle.getPrice(fromToken);
        require(isValid, "Invalid oracle price");
        
        // Calculate expected output
        uint256 expectedOutput = (amount * oraclePrice) / (10 ** 8);
        require(expectedOutput >= minOutput, "Insufficient expected output");
        
        // Calculate execution fee
        uint256 fee = (amount * EXECUTION_FEE) / 10000;
        uint256 netAmount = amount - fee;
        
        // Handle ETH payments
        if (fromToken == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token swaps");
            // Transfer tokens from user
            IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Execute the swap (simplified - in real implementation, this would call 1inch)
        uint256 actualOutput = _executeRoute(fromToken, toToken, netAmount, routeData);
        
        // Validate output
        require(actualOutput >= minOutput, "Slippage too high");
        
        // Transfer output to user
        if (toToken == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: actualOutput}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(toToken).safeTransfer(msg.sender, actualOutput);
        }
        
        // Record execution
        executions[executionId] = SwapExecution({
            user: msg.sender,
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: amount,
            toAmount: expectedOutput,
            actualAmount: actualOutput,
            gasUsed: gasleft(),
            timestamp: block.timestamp,
            success: true,
            route: "AI_OPTIMIZED_ROUTE"
        });
        
        emit SwapExecuted(
            executionId,
            msg.sender,
            fromToken,
            toToken,
            amount,
            actualOutput,
            gasleft(),
            true
        );
    }
    
    /**
     * @dev Get optimal route for a swap
     * 
     * @param fromToken Source token
     * @param toToken Destination token
     * @param amount Amount to swap
     * @return route Optimized route data
     * @return expectedOutput Expected output amount
     * @return confidence Confidence level
     */
    function getOptimalRoute(
        address fromToken,
        address toToken,
        uint256 amount
    ) external view returns (
        bytes memory route,
        uint256 expectedOutput,
        uint256 confidence
    ) {
        require(fromToken != toToken, "Same tokens");
        require(amount > 0, "Invalid amount");
        
        // Get oracle price
        (uint256 oraclePrice, , bool isValid) = oracle.getPrice(fromToken);
        require(isValid, "Invalid oracle price");
        
        expectedOutput = (amount * oraclePrice) / (10 ** 8);
        confidence = 8500; // Default confidence for oracle-validated routes
        
        // In a real implementation, this would call 1inch API and return optimized route
        route = abi.encode(fromToken, toToken, amount, expectedOutput);
        
        return (route, expectedOutput, confidence);
    }
    
    /**
     * @dev Execute a route (internal function)
     * 
     * @param fromToken Source token
     * @param toToken Destination token
     * @param amount Amount to swap
     * @param routeData Route data
     * @return actualOutput Actual output amount
     */
    function _executeRoute(
        address fromToken,
        address toToken,
        uint256 amount,
        bytes calldata routeData
    ) internal returns (uint256 actualOutput) {
        // In a real implementation, this would:
        // 1. Decode route data
        // 2. Call 1inch API for actual swap
        // 3. Execute the swap on the best DEX
        // 4. Return actual output
        
        // For now, simulate a successful swap with 99% efficiency
        (uint256 expectedOutput) = abi.decode(routeData, (uint256));
        actualOutput = (expectedOutput * 99) / 100; // 99% efficiency
        
        return actualOutput;
    }
    
    /**
     * @dev Get execution details
     * 
     * @param executionId Execution ID
     * @return execution Execution details
     */
    function getExecution(bytes32 executionId) external view returns (SwapExecution memory execution) {
        return executions[executionId];
    }
    
    /**
     * @dev Add or remove authorized executor
     * 
     * @param executor Executor address
     * @param isActive Whether to authorize or deauthorize
     */
    function setAuthorizedExecutor(address executor, bool isActive) external onlyOwner {
        authorizedExecutors[executor] = isActive;
        emit ExecutorUpdated(executor, isActive);
    }
    
    /**
     * @dev Update oracle address
     * 
     * @param newOracle New oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        oracle = SwapSageOracle(newOracle);
    }
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }
    
    /**
     * @dev Emergency function to rescue stuck tokens
     * 
     * @param token Token address
     * @param amount Amount to rescue
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = payable(owner()).call{value: amount}("");
            require(success, "ETH rescue failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 
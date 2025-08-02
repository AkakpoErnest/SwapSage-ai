// SPDX-License-Identifier: MIT
// This line specifies the license under which this code is released (MIT License)

pragma solidity ^0.8.24;
// This line specifies the Solidity compiler version to use (0.8.24 or higher)

import "@openzeppelin/contracts/access/Ownable.sol";
// Import the Ownable contract from OpenZeppelin for access control functionality

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// Import the ReentrancyGuard contract to prevent reentrancy attacks

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Import the IERC20 interface for ERC20 token interactions

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// Import the SafeERC20 library for safe ERC20 token transfers

import "./SwapSageOracle.sol";
// Import the SwapSageOracle contract for price validation

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
    // Define a contract that inherits from Ownable and ReentrancyGuard
    
    using SafeERC20 for IERC20;
    // Use SafeERC20 library for all IERC20 token operations
    
    struct SwapExecution {
        // Define a struct to store swap execution information
        address user;        // Address that initiated the swap
        address fromToken;   // Source token address
        address toToken;     // Destination token address
        uint256 fromAmount;  // Amount of source tokens
        uint256 toAmount;    // Expected output amount
        uint256 actualAmount; // Actual output amount received
        uint256 gasUsed;     // Gas used for the swap
        uint256 timestamp;   // When the swap was executed
        bool success;        // Whether the swap was successful
        string route;        // Route used for the swap
    }
    
    struct Route {
        // Define a struct to store route information
        address[] path;      // Array of token addresses in the swap path
        uint256[] amounts;   // Array of amounts at each step
        uint256 expectedOutput; // Expected output amount
        uint256 confidence;  // Confidence level of the route
        bool isValid;        // Whether the route is valid
    }
    
    // State variables
    SwapSageOracle public oracle;
    // Reference to the SwapSageOracle contract for price validation
    
    mapping(bytes32 => SwapExecution) public executions;
    // Public mapping that stores swap executions indexed by execution ID
    
    mapping(address => bool) public authorizedExecutors;
    // Mapping to track which addresses are authorized to execute swaps
    
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
    // Event emitted when a swap is executed
    // indexed parameters allow efficient filtering of events
    
    event RouteOptimized(
        bytes32 indexed routeId,
        address fromToken,
        address toToken,
        uint256 expectedOutput,
        uint256 confidence
    );
    // Event emitted when a route is optimized
    
    event ExecutorUpdated(address indexed executor, bool isActive);
    // Event emitted when an executor's authorization status is changed
    
    // Constants
    uint256 public constant EXECUTION_FEE = 1000; // 0.1% in basis points
    // Constant defining the execution fee rate (1000 = 0.1%)
    
    uint256 public constant MIN_CONFIDENCE = 7000; // 70%
    // Minimum confidence level required for swap execution (70%)
    
    uint256 public constant MAX_SLIPPAGE = 500; // 5%
    // Maximum allowed slippage in basis points (500 = 5%)
    
    modifier onlyAuthorizedExecutor() {
        // Custom modifier to restrict access to authorized executors only
        require(authorizedExecutors[msg.sender] || msg.sender == owner(), "Not authorized");
        // Require that the caller is either an authorized executor or the contract owner
        _;
        // Continue with the function execution if the requirement is met
    }
    
    constructor(address _oracle) Ownable(msg.sender) {
        // Constructor function that initializes the contract
        // Parameters: _oracle (address of the SwapSageOracle contract)
        // Ownable(msg.sender) sets the contract deployer as the owner
        
        oracle = SwapSageOracle(_oracle);
        // Set the oracle contract address
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
        // External payable function to execute a swap with AI optimization
        // payable: Allows the function to receive ETH
        // nonReentrant: Prevents reentrancy attacks
        
        require(fromToken != toToken, "Same tokens");
        // Ensure source and destination tokens are different
        
        require(amount > 0, "Invalid amount");
        // Ensure amount is greater than zero
        
        require(minOutput > 0, "Invalid min output");
        // Ensure minimum output is greater than zero
        
        bytes32 executionId = keccak256(
            abi.encodePacked(
                msg.sender,
                fromToken,
                toToken,
                amount,
                block.timestamp
            )
        );
        // Generate unique execution ID by hashing swap parameters
        
        require(executions[executionId].user == address(0), "Execution already exists");
        // Ensure this exact execution doesn't already exist
        
        // Validate oracle price
        (uint256 oraclePrice, , bool isValid) = oracle.getPrice(fromToken);
        // Get current price from oracle for the source token
        
        require(isValid, "Invalid oracle price");
        // Ensure oracle price is valid
        
        // Calculate expected output
        uint256 expectedOutput = (amount * oraclePrice) / (10 ** 8);
        // Calculate expected output based on oracle price (8 decimals)
        
        require(expectedOutput >= minOutput, "Insufficient expected output");
        // Ensure expected output meets minimum requirement
        
        // Calculate execution fee
        uint256 fee = (amount * EXECUTION_FEE) / 10000;
        // Calculate execution fee (0.1% of amount)
        
        uint256 netAmount = amount - fee;
        // Calculate net amount after fee deduction
        
        // Handle ETH payments
        if (fromToken == address(0)) {
            // If source token is ETH
            require(msg.value == amount, "Incorrect ETH amount");
            // Ensure correct ETH amount was sent
        } else {
            // If source token is ERC20
            require(msg.value == 0, "ETH not accepted for token swaps");
            // Ensure no ETH was sent for token swaps
            // Transfer tokens from user
            IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amount);
            // Safely transfer tokens from user to this contract
        }
        
        // Execute the swap (simplified - in real implementation, this would call 1inch)
        uint256 actualOutput = _executeRoute(fromToken, toToken, netAmount, routeData);
        // Execute the swap using the provided route data
        
        // Validate output
        require(actualOutput >= minOutput, "Slippage too high");
        // Ensure actual output meets minimum requirement
        
        // Transfer output to user
        if (toToken == address(0)) {
            // If destination token is ETH
            (bool success, ) = payable(msg.sender).call{value: actualOutput}("");
            // Transfer ETH to user
            require(success, "ETH transfer failed");
            // Ensure transfer was successful
        } else {
            // If destination token is ERC20
            IERC20(toToken).safeTransfer(msg.sender, actualOutput);
            // Safely transfer tokens to user
        }
        
        // Record execution
        executions[executionId] = SwapExecution({
            // Store the execution details
            user: msg.sender,           // User who initiated the swap
            fromToken: fromToken,       // Source token
            toToken: toToken,           // Destination token
            fromAmount: amount,         // Input amount
            toAmount: expectedOutput,   // Expected output
            actualAmount: actualOutput, // Actual output
            gasUsed: gasleft(),         // Gas used (simplified)
            timestamp: block.timestamp, // Execution timestamp
            success: true,              // Mark as successful
            route: "AI_OPTIMIZED_ROUTE" // Route description
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
        // Emit event to notify listeners of the successful execution
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
        // External view function to get optimal route for a swap
        // view: This function doesn't modify state, only reads data
        
        require(fromToken != toToken, "Same tokens");
        // Ensure source and destination tokens are different
        
        require(amount > 0, "Invalid amount");
        // Ensure amount is greater than zero
        
        // Get oracle price
        (uint256 oraclePrice, , bool isValid) = oracle.getPrice(fromToken);
        // Get current price from oracle for the source token
        
        require(isValid, "Invalid oracle price");
        // Ensure oracle price is valid
        
        expectedOutput = (amount * oraclePrice) / (10 ** 8);
        // Calculate expected output based on oracle price
        
        confidence = 8500; // Default confidence for oracle-validated routes
        // Set confidence level to 85%
        
        // In a real implementation, this would call 1inch API and return optimized route
        route = abi.encode(fromToken, toToken, amount, expectedOutput);
        // Encode route data (simplified)
        
        return (route, expectedOutput, confidence);
        // Return the route data, expected output, and confidence
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
        // Internal function to execute a swap route
        // internal: Can only be called from within this contract
        
        // In a real implementation, this would:
        // 1. Decode route data
        // 2. Call 1inch API for actual swap
        // 3. Execute the swap on the best DEX
        // 4. Return actual output
        
        // For now, simulate a successful swap with 99% efficiency
        (uint256 expectedOutput) = abi.decode(routeData, (uint256));
        // Decode the expected output from route data
        
        actualOutput = (expectedOutput * 99) / 100; // 99% efficiency
        // Simulate actual output with 99% efficiency
        
        return actualOutput;
        // Return the actual output amount
    }
    
    /**
     * @dev Get execution details
     * 
     * @param executionId Execution ID
     * @return execution Execution details
     */
    function getExecution(bytes32 executionId) external view returns (SwapExecution memory execution) {
        // External view function to get execution details
        // view: This function doesn't modify state, only reads data
        
        return executions[executionId];
        // Return the execution details for the specified ID
    }
    
    /**
     * @dev Add or remove authorized executor
     * 
     * @param executor Executor address
     * @param isActive Whether to authorize or deauthorize
     */
    function setAuthorizedExecutor(address executor, bool isActive) external onlyOwner {
        // External function to manage authorized executors
        // onlyOwner: Only the contract owner can call this
        
        authorizedExecutors[executor] = isActive;
        // Set the executor's authorization status
        
        emit ExecutorUpdated(executor, isActive);
        // Emit event to notify listeners of the authorization change
    }
    
    /**
     * @dev Update oracle address
     * 
     * @param newOracle New oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        // External function to update the oracle address
        // onlyOwner: Only the contract owner can call this
        
        require(newOracle != address(0), "Invalid oracle address");
        // Ensure new oracle address is not zero
        
        oracle = SwapSageOracle(newOracle);
        // Update the oracle contract reference
    }
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        // External function to withdraw accumulated fees
        // onlyOwner: Only the contract owner can call this
        
        uint256 balance = address(this).balance;
        // Get the contract's ETH balance
        
        require(balance > 0, "No fees to withdraw");
        // Ensure there are fees to withdraw
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        // Transfer all ETH to the contract owner
        
        require(success, "Fee withdrawal failed");
        // Ensure transfer was successful
    }
    
    /**
     * @dev Emergency function to rescue stuck tokens
     * 
     * @param token Token address
     * @param amount Amount to rescue
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        // Emergency function to rescue stuck tokens
        // onlyOwner: Only the contract owner can call this
        
        if (token == address(0)) {
            // If token is ETH
            (bool success, ) = payable(owner()).call{value: amount}("");
            // Transfer ETH to owner
            require(success, "ETH rescue failed");
            // Ensure transfer was successful
        } else {
            // If token is ERC20
            IERC20(token).safeTransfer(owner(), amount);
            // Safely transfer tokens to owner
        }
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
    // Fallback function to accept ETH sent to the contract
    // This allows the contract to receive ETH for swaps
} 
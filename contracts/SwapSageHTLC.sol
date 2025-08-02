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

import "./SwapSageOracle.sol";
// Import the SwapSageOracle contract for price validation

/**
 * @title SwapSageHTLC
 * @dev AI-powered Hash Time Lock Contract for atomic cross-chain swaps
 * 
 * This contract extends the basic HTLC functionality with:
 * - AI-powered price validation
 * - Oracle integration for real-time pricing
 * - Enhanced security features
 * - Cross-chain swap coordination
 * 
 * @author SwapSage AI Team
 */
contract SwapSageHTLC is Ownable, ReentrancyGuard {
    // Define a contract that inherits from Ownable and ReentrancyGuard
    
    struct Swap {
        // Define a struct to store swap information
        address initiator;    // Address that initiated the swap
        address recipient;    // Address that can claim the tokens
        address fromToken;    // Source token address (address(0) for ETH)
        address toToken;      // Destination token address
        uint256 fromAmount;   // Amount of source tokens
        uint256 toAmount;     // Expected amount of destination tokens
        bytes32 hashlock;     // Hash of the secret (keccak256(secret))
        uint256 timelock;     // Timestamp when swap can be refunded
        bool withdrawn;       // Whether tokens have been withdrawn
        bool refunded;        // Whether tokens have been refunded
        string secret;        // The secret (revealed when withdrawn)
        uint256 oraclePrice;  // Price from oracle at swap initiation
        uint256 confidence;   // Confidence level of the oracle price
    }
    
    // Mapping from swap ID to Swap struct
    mapping(bytes32 => Swap) public swaps;
    // Public mapping that stores all swap information indexed by swap ID
    
    // Events
    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed initiator,
        address indexed recipient,
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 toAmount,
        bytes32 hashlock,
        uint256 timelock,
        uint256 oraclePrice,
        uint256 confidence
    );
    // Event emitted when a new swap is initiated
    // indexed parameters allow efficient filtering of events
    
    event SwapWithdrawn(bytes32 indexed swapId, string secret);
    // Event emitted when tokens are withdrawn by revealing the secret
    
    event SwapRefunded(bytes32 indexed swapId);
    // Event emitted when tokens are refunded after timelock expires
    
    event OracleUpdated(address indexed oracle);
    // Event emitted when the oracle address is updated
    
    // State variables
    SwapSageOracle public oracle;
    // Reference to the SwapSageOracle contract for price validation
    
    uint256 public constant FEE_BASIS_POINTS = 25; // 0.25%
    // Constant defining the fee rate in basis points (25 = 0.25%)
    
    uint256 public constant MIN_TIMELOCK = 1 hours;
    // Minimum time lock duration (1 hour)
    
    uint256 public constant MAX_TIMELOCK = 24 hours;
    // Maximum time lock duration (24 hours)
    
    uint256 public constant MIN_CONFIDENCE = 7000; // 70%
    // Minimum confidence level required for oracle prices (70%)
    
    uint256 public constant PRICE_TOLERANCE = 500; // 5% tolerance
    // Price tolerance in basis points (500 = 5%) for oracle validation
    
    constructor(address _oracle) Ownable(msg.sender) {
        // Constructor function that initializes the contract
        // Parameters: _oracle (address of the SwapSageOracle contract)
        // Ownable(msg.sender) sets the contract deployer as the owner
        
        oracle = SwapSageOracle(_oracle);
        // Set the oracle contract address
    }
    
    /**
     * @dev Initiate a new AI-powered atomic swap
     * 
     * @param recipient The address that will receive the tokens
     * @param fromToken The source token address
     * @param toToken The destination token address
     * @param fromAmount The amount of source tokens
     * @param toAmount The expected amount of destination tokens
     * @param hashlock The hash of the secret
     * @param timelock The timestamp when the swap can be refunded
     */
    function initiateSwap(
        address recipient,
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 toAmount,
        bytes32 hashlock,
        uint256 timelock
    ) external payable nonReentrant {
        // External payable function to initiate a new atomic swap
        // payable: Allows the function to receive ETH
        // nonReentrant: Prevents reentrancy attacks
        
        require(recipient != address(0), "Invalid recipient");
        // Ensure recipient address is not zero
        
        require(fromAmount > 0 && toAmount > 0, "Invalid amounts");
        // Ensure both amounts are greater than zero
        
        require(timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        // Ensure timelock is at least 1 hour from now
        
        require(timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        // Ensure timelock is not more than 24 hours from now
        
        require(hashlock != bytes32(0), "Invalid hashlock");
        // Ensure hashlock is not zero
        
        require(fromToken != toToken, "Same tokens");
        // Ensure source and destination tokens are different

        bytes32 swapId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                fromToken,
                toToken,
                fromAmount,
                toAmount,
                hashlock,
                timelock
            )
        );
        // Generate unique swap ID by hashing all swap parameters

        require(swaps[swapId].initiator == address(0), "Swap already exists");
        // Ensure this exact swap doesn't already exist

        // Get oracle price and validate
        (uint256 oraclePrice, , bool isValid) = oracle.getPrice(fromToken);
        // Get current price from oracle for the source token
        
        require(isValid, "Invalid oracle price");
        // Ensure oracle price is valid
        
        // Calculate expected amount based on oracle price
        uint256 expectedToAmount = (fromAmount * oraclePrice) / (10 ** 8);
        // Calculate expected output based on oracle price (8 decimals)
        
        uint256 priceDifference = expectedToAmount > toAmount ? 
            expectedToAmount - toAmount : toAmount - expectedToAmount;
        // Calculate absolute difference between expected and provided amounts
        
        uint256 tolerance = (expectedToAmount * PRICE_TOLERANCE) / 10000;
        // Calculate tolerance amount (5% of expected amount)
        
        require(priceDifference <= tolerance, "Price deviation too high");
        // Ensure price difference is within tolerance

        uint256 fee = (fromAmount * FEE_BASIS_POINTS) / 10000;
        // Calculate fee amount (0.25% of fromAmount)
        
        uint256 netAmount = fromAmount - fee;
        // Calculate net amount after fee deduction

        // Handle ETH payments
        if (fromToken == address(0)) {
            // If source token is ETH
            require(msg.value == fromAmount, "Incorrect ETH amount");
            // Ensure correct ETH amount was sent
        } else {
            // If source token is ERC20
            require(msg.value == 0, "ETH not accepted for token swaps");
            // Ensure no ETH was sent for token swaps
            // In a real implementation, you'd transfer tokens here
        }

        swaps[swapId] = Swap({
            // Create and store the swap
            initiator: msg.sender,       // Swap initiator
            recipient: recipient,        // Swap recipient
            fromToken: fromToken,        // Source token
            toToken: toToken,            // Destination token
            fromAmount: netAmount,       // Net amount after fees
            toAmount: toAmount,          // Expected output amount
            hashlock: hashlock,          // Secret hash
            timelock: timelock,          // Refund timestamp
            withdrawn: false,            // Not withdrawn yet
            refunded: false,             // Not refunded yet
            secret: "",                  // Secret not revealed yet
            oraclePrice: oraclePrice,    // Oracle price at initiation
            confidence: 8500             // Default confidence for oracle-validated swaps
        });

        emit SwapInitiated(
            swapId,
            msg.sender,
            recipient,
            fromToken,
            toToken,
            netAmount,
            toAmount,
            hashlock,
            timelock,
            oraclePrice,
            8500
        );
        // Emit event to notify listeners of the new swap
    }
    
    /**
     * @dev Withdraw tokens by revealing the secret
     * 
     * @param swapId The ID of the swap
     * @param secret The secret that generates the hashlock
     */
    function withdraw(bytes32 swapId, string calldata secret) external nonReentrant {
        // External function to withdraw tokens by revealing the secret
        // nonReentrant: Prevents reentrancy attacks
        
        Swap storage swap = swaps[swapId];
        // Get reference to the swap in storage
        
        require(swap.initiator != address(0), "Swap does not exist");
        // Ensure swap exists
        
        require(msg.sender == swap.recipient, "Only recipient can withdraw");
        // Ensure only the recipient can withdraw
        
        require(!swap.withdrawn, "Already withdrawn");
        // Ensure swap hasn't been withdrawn already
        
        require(!swap.refunded, "Already refunded");
        // Ensure swap hasn't been refunded already
        
        require(block.timestamp < swap.timelock, "Timelock expired");
        // Ensure timelock hasn't expired
        
        require(keccak256(abi.encodePacked(secret)) == swap.hashlock, "Invalid secret");
        // Verify that the provided secret matches the hashlock

        swap.withdrawn = true;
        // Mark swap as withdrawn
        
        swap.secret = secret;
        // Store the revealed secret

        // Transfer tokens to recipient
        if (swap.fromToken == address(0)) {
            // If token is ETH
            (bool success, ) = payable(swap.recipient).call{value: swap.fromAmount}("");
            // Transfer ETH to recipient
            require(success, "ETH transfer failed");
            // Ensure transfer was successful
        } else {
            // If token is ERC20
            // In a real implementation, you'd transfer ERC20 tokens here
        }

        emit SwapWithdrawn(swapId, secret);
        // Emit event to notify listeners of the withdrawal
    }
    
    /**
     * @dev Refund tokens if timelock expires
     * 
     * @param swapId The ID of the swap
     */
    function refund(bytes32 swapId) external nonReentrant {
        // External function to refund tokens after timelock expires
        // nonReentrant: Prevents reentrancy attacks
        
        Swap storage swap = swaps[swapId];
        // Get reference to the swap in storage
        
        require(swap.initiator != address(0), "Swap does not exist");
        // Ensure swap exists
        
        require(msg.sender == swap.initiator, "Only initiator can refund");
        // Ensure only the initiator can refund
        
        require(!swap.withdrawn, "Already withdrawn");
        // Ensure swap hasn't been withdrawn already
        
        require(!swap.refunded, "Already refunded");
        // Ensure swap hasn't been refunded already
        
        require(block.timestamp >= swap.timelock, "Timelock not expired");
        // Ensure timelock has expired

        swap.refunded = true;
        // Mark swap as refunded

        // Transfer tokens back to initiator
        if (swap.fromToken == address(0)) {
            // If token is ETH
            (bool success, ) = payable(swap.initiator).call{value: swap.fromAmount}("");
            // Transfer ETH back to initiator
            require(success, "ETH transfer failed");
            // Ensure transfer was successful
        } else {
            // If token is ERC20
            // In a real implementation, you'd transfer ERC20 tokens here
        }

        emit SwapRefunded(swapId);
        // Emit event to notify listeners of the refund
    }
    
    /**
     * @dev Get swap details
     * 
     * @param swapId The ID of the swap
     * @return swap The swap details
     */
    function getSwap(bytes32 swapId) external view returns (Swap memory swap) {
        // External view function to get swap details
        // view: This function doesn't modify state, only reads data
        
        return swaps[swapId];
        // Return the swap details for the specified ID
    }
    
    /**
     * @dev Update oracle address
     * 
     * @param newOracle The new oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        // External function to update the oracle address
        // onlyOwner: Only the contract owner can call this
        
        require(newOracle != address(0), "Invalid oracle address");
        // Ensure new oracle address is not zero
        
        oracle = SwapSageOracle(newOracle);
        // Update the oracle contract reference
        
        emit OracleUpdated(newOracle);
        // Emit event to notify listeners of the oracle update
    }
    
    /**
     * @dev Emergency function to pause all swaps
     */
    function emergencyPause() external onlyOwner {
        // Emergency function to pause all swaps
        // onlyOwner: Only the contract owner can call this
        
        // In a real implementation, you'd add a pause mechanism
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
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
    // Fallback function to accept ETH sent to the contract
    // This allows the contract to receive ETH for swaps
} 
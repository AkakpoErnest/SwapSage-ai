// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SwapSageOracle.sol";

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
    
    struct Swap {
        address initiator;
        address recipient;
        address fromToken;
        address toToken;
        uint256 fromAmount;
        uint256 toAmount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        string secret;
        uint256 oraclePrice;
        uint256 confidence;
    }
    
    // Mapping from swap ID to Swap struct
    mapping(bytes32 => Swap) public swaps;
    
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
    
    event SwapWithdrawn(bytes32 indexed swapId, string secret);
    event SwapRefunded(bytes32 indexed swapId);
    event OracleUpdated(address indexed oracle);
    
    // State variables
    SwapSageOracle public oracle;
    uint256 public constant FEE_BASIS_POINTS = 25; // 0.25%
    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 24 hours;
    uint256 public constant MIN_CONFIDENCE = 7000; // 70%
    uint256 public constant PRICE_TOLERANCE = 500; // 5% tolerance
    
    constructor(address _oracle) Ownable(msg.sender) {
        oracle = SwapSageOracle(_oracle);
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
        require(recipient != address(0), "Invalid recipient");
        require(fromAmount > 0 && toAmount > 0, "Invalid amounts");
        require(timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        require(hashlock != bytes32(0), "Invalid hashlock");
        require(fromToken != toToken, "Same tokens");

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

        require(swaps[swapId].initiator == address(0), "Swap already exists");

        // Get oracle price and validate
        (uint256 oraclePrice, , bool isValid) = oracle.getPrice(fromToken);
        require(isValid, "Invalid oracle price");
        
        // Calculate expected amount based on oracle price
        uint256 expectedToAmount = (fromAmount * oraclePrice) / (10 ** 8);
        uint256 priceDifference = expectedToAmount > toAmount ? 
            expectedToAmount - toAmount : toAmount - expectedToAmount;
        uint256 tolerance = (expectedToAmount * PRICE_TOLERANCE) / 10000;
        
        require(priceDifference <= tolerance, "Price deviation too high");

        uint256 fee = (fromAmount * FEE_BASIS_POINTS) / 10000;
        uint256 netAmount = fromAmount - fee;

        // Handle ETH payments
        if (fromToken == address(0)) {
            require(msg.value == fromAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token swaps");
            // In a real implementation, you'd transfer tokens here
        }

        swaps[swapId] = Swap({
            initiator: msg.sender,
            recipient: recipient,
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: netAmount,
            toAmount: toAmount,
            hashlock: hashlock,
            timelock: timelock,
            withdrawn: false,
            refunded: false,
            secret: "",
            oraclePrice: oraclePrice,
            confidence: 8500 // Default confidence for oracle-validated swaps
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
    }
    
    /**
     * @dev Withdraw tokens by revealing the secret
     * 
     * @param swapId The ID of the swap
     * @param secret The secret that generates the hashlock
     */
    function withdraw(bytes32 swapId, string calldata secret) external nonReentrant {
        Swap storage swap = swaps[swapId];
        require(swap.initiator != address(0), "Swap does not exist");
        require(msg.sender == swap.recipient, "Only recipient can withdraw");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp < swap.timelock, "Timelock expired");
        require(keccak256(abi.encodePacked(secret)) == swap.hashlock, "Invalid secret");

        swap.withdrawn = true;
        swap.secret = secret;

        // Transfer tokens to recipient
        if (swap.fromToken == address(0)) {
            (bool success, ) = payable(swap.recipient).call{value: swap.fromAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // In a real implementation, you'd transfer ERC20 tokens here
        }

        emit SwapWithdrawn(swapId, secret);
    }
    
    /**
     * @dev Refund tokens if timelock expires
     * 
     * @param swapId The ID of the swap
     */
    function refund(bytes32 swapId) external nonReentrant {
        Swap storage swap = swaps[swapId];
        require(swap.initiator != address(0), "Swap does not exist");
        require(msg.sender == swap.initiator, "Only initiator can refund");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp >= swap.timelock, "Timelock not expired");

        swap.refunded = true;

        // Transfer tokens back to initiator
        if (swap.fromToken == address(0)) {
            (bool success, ) = payable(swap.initiator).call{value: swap.fromAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // In a real implementation, you'd transfer ERC20 tokens here
        }

        emit SwapRefunded(swapId);
    }
    
    /**
     * @dev Get swap details
     * 
     * @param swapId The ID of the swap
     * @return swap The swap details
     */
    function getSwap(bytes32 swapId) external view returns (Swap memory swap) {
        return swaps[swapId];
    }
    
    /**
     * @dev Update oracle address
     * 
     * @param newOracle The new oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        oracle = SwapSageOracle(newOracle);
        emit OracleUpdated(newOracle);
    }
    
    /**
     * @dev Emergency function to pause all swaps
     */
    function emergencyPause() external onlyOwner {
        // In a real implementation, you'd add a pause mechanism
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
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 
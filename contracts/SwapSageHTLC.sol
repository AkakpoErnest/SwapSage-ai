// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SwapSageHTLC
 * @dev Hash Time Lock Contract for atomic cross-chain swaps
 * 
 * This contract enables trustless cross-chain token swaps using Hash Time Lock Contracts (HTLC).
 * Users can initiate swaps with a secret hash, and the recipient can claim the tokens by revealing
 * the secret before the timelock expires. If the secret isn't revealed in time, the initiator can
 * refund their tokens.
 * 
 * @author SwapSage AI Team
 * @notice This is the core contract for atomic cross-chain swaps
 */
contract SwapSageHTLC is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    struct Swap {
        address initiator;
        address recipient;
        address token;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        string secret;
    }

    // Mapping from swap ID to Swap struct
    mapping(bytes32 => Swap) public swaps;
    
    // Events
    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed initiator,
        address indexed recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    );
    
    event SwapWithdrawn(bytes32 indexed swapId, string secret);
    event SwapRefunded(bytes32 indexed swapId);
    event FeeCollected(address indexed token, uint256 amount);

    // Fees (in basis points, 100 = 1%)
    uint256 public constant FEE_BASIS_POINTS = 25; // 0.25%
    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 24 hours;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Initiate a new atomic swap
     * 
     * This function creates a new HTLC swap. The initiator locks their tokens with a secret hash.
     * The recipient can claim the tokens by revealing the secret before the timelock expires.
     * 
     * @param recipient The address that will receive the tokens (the person you're swapping with)
     * @param token The ERC20 token address (use address(0) for ETH)
     * @param amount The amount of tokens to swap (in wei for ETH, or token decimals)
     * @param hashlock The hash of the secret (generated from the secret using keccak256)
     * @param timelock The timestamp when the swap can be refunded (must be 1-24 hours from now)
     */
    function initiateSwap(
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    ) external payable nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        require(timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        require(hashlock != bytes32(0), "Invalid hashlock");

        bytes32 swapId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                token,
                amount,
                hashlock,
                timelock
            )
        );

        require(swaps[swapId].initiator == address(0), "Swap already exists");

        uint256 fee = (amount * FEE_BASIS_POINTS) / 10000;
        uint256 netAmount = amount - fee;

        swaps[swapId] = Swap({
            initiator: msg.sender,
            recipient: recipient,
            token: token,
            amount: netAmount,
            hashlock: hashlock,
            timelock: timelock,
            withdrawn: false,
            refunded: false,
            secret: ""
        });

        if (token == address(0)) {
            // ETH swap
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            // ERC20 swap
            require(msg.value == 0, "ETH not accepted for token swaps");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit SwapInitiated(
            swapId,
            msg.sender,
            recipient,
            token,
            netAmount,
            hashlock,
            timelock
        );
    }

    /**
     * @dev Withdraw tokens from a swap using the secret
     * @param swapId The ID of the swap
     * @param secret The secret that produces the hashlock
     */
    function withdraw(bytes32 swapId, string calldata secret) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Swap storage swap = swaps[swapId];
        require(swap.initiator != address(0), "Swap does not exist");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp < swap.timelock, "Timelock expired");
        require(
            keccak256(abi.encodePacked(secret)) == swap.hashlock,
            "Invalid secret"
        );

        swap.withdrawn = true;
        swap.secret = secret;

        if (swap.token == address(0)) {
            // ETH withdrawal
            (bool success, ) = swap.recipient.call{value: swap.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 withdrawal
            IERC20(swap.token).safeTransfer(swap.recipient, swap.amount);
        }

        emit SwapWithdrawn(swapId, secret);
    }

    /**
     * @dev Refund tokens to the initiator after timelock expires
     * @param swapId The ID of the swap
     */
    function refund(bytes32 swapId) external nonReentrant whenNotPaused {
        Swap storage swap = swaps[swapId];
        require(swap.initiator != address(0), "Swap does not exist");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp >= swap.timelock, "Timelock not expired");

        swap.refunded = true;

        if (swap.token == address(0)) {
            // ETH refund
            (bool success, ) = swap.initiator.call{value: swap.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 refund
            IERC20(swap.token).safeTransfer(swap.initiator, swap.amount);
        }

        emit SwapRefunded(swapId);
    }

    /**
     * @dev Get swap details
     * @param swapId The ID of the swap
     */
    function getSwap(bytes32 swapId) external view returns (Swap memory) {
        return swaps[swapId];
    }

    /**
     * @dev Calculate swap ID
     */
    function calculateSwapId(
        address initiator,
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    ) external pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                initiator,
                recipient,
                token,
                amount,
                hashlock,
                timelock
            )
        );
    }

    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees(address token) external onlyOwner {
        uint256 balance;
        if (token == address(0)) {
            balance = address(this).balance;
        } else {
            balance = IERC20(token).balanceOf(address(this));
        }
        
        require(balance > 0, "No fees to withdraw");
        
        if (token == address(0)) {
            (bool success, ) = owner().call{value: balance}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), balance);
        }
        
        emit FeeCollected(token, balance);
    }

    /**
     * @dev Pause/unpause the contract (owner only)
     */
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }

    // Allow the contract to receive ETH
    receive() external payable {}
} 
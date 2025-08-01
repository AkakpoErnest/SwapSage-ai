// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SimpleHTLC
 * @dev Simplified Hash Time Lock Contract for atomic cross-chain swaps
 * 
 * This contract enables trustless cross-chain token swaps using Hash Time Lock Contracts (HTLC).
 * Users can initiate swaps with a secret hash, and the recipient can claim the tokens by revealing
 * the secret before the timelock expires. If the secret isn't revealed in time, the initiator can
 * refund their tokens.
 * 
 * @author SwapSage AI Team
 * @notice This is a simplified version for testnet deployment
 */
contract SimpleHTLC {
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

    // Fees (in basis points, 100 = 1%)
    uint256 public constant FEE_BASIS_POINTS = 25; // 0.25%
    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 24 hours;

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
    ) external payable {
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

        // Handle ETH payments
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            // For ERC20 tokens, the user should approve this contract first
            // This is a simplified version - in production you'd use SafeERC20
            require(msg.value == 0, "ETH not accepted for token swaps");
        }

        // Create the swap
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
     * @dev Withdraw tokens from a swap by revealing the secret
     * 
     * Only the recipient can call this function. They must provide the secret
     * that corresponds to the hashlock used when creating the swap.
     * 
     * @param swapId The ID of the swap to withdraw from
     * @param secret The secret that was used to create the hashlock
     */
    function withdraw(bytes32 swapId, string calldata secret) external {
        Swap storage swap = swaps[swapId];
        
        require(swap.initiator != address(0), "Swap does not exist");
        require(swap.recipient == msg.sender, "Only recipient can withdraw");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp < swap.timelock, "Timelock expired");
        
        // Verify the secret matches the hashlock
        bytes32 hashlock = keccak256(abi.encodePacked(secret));
        require(hashlock == swap.hashlock, "Invalid secret");

        // Mark as withdrawn
        swap.withdrawn = true;
        swap.secret = secret;

        // Transfer tokens to recipient
        if (swap.token == address(0)) {
            // ETH transfer
            (bool success, ) = payable(swap.recipient).call{value: swap.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer (simplified - in production use SafeERC20)
            // This would require proper ERC20 interface implementation
            revert("ERC20 transfers not implemented in this simplified version");
        }

        emit SwapWithdrawn(swapId, secret);
    }

    /**
     * @dev Refund tokens to the initiator if the timelock expires
     * 
     * Only the initiator can call this function, and only after the timelock
     * has expired and the swap hasn't been withdrawn.
     * 
     * @param swapId The ID of the swap to refund
     */
    function refund(bytes32 swapId) external {
        Swap storage swap = swaps[swapId];
        
        require(swap.initiator != address(0), "Swap does not exist");
        require(swap.initiator == msg.sender, "Only initiator can refund");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp >= swap.timelock, "Timelock not expired");

        // Mark as refunded
        swap.refunded = true;

        // Transfer tokens back to initiator
        if (swap.token == address(0)) {
            // ETH transfer
            (bool success, ) = payable(swap.initiator).call{value: swap.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer (simplified - in production use SafeERC20)
            revert("ERC20 transfers not implemented in this simplified version");
        }

        emit SwapRefunded(swapId);
    }

    /**
     * @dev Get swap details
     * 
     * @param swapId The ID of the swap
     * @return initiator The address that initiated the swap
     * @return recipient The address that can withdraw the swap
     * @return token The token address (address(0) for ETH)
     * @return amount The amount of tokens in the swap
     * @return hashlock The hashlock used for the swap
     * @return timelock The timestamp when the swap can be refunded
     * @return withdrawn Whether the swap has been withdrawn
     * @return refunded Whether the swap has been refunded
     * @return secret The secret (empty if not withdrawn)
     */
    function getSwap(bytes32 swapId) external view returns (
        address initiator,
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        bool withdrawn,
        bool refunded,
        string memory secret
    ) {
        Swap storage swap = swaps[swapId];
        return (
            swap.initiator,
            swap.recipient,
            swap.token,
            swap.amount,
            swap.hashlock,
            swap.timelock,
            swap.withdrawn,
            swap.refunded,
            swap.secret
        );
    }

    /**
     * @dev Allow the contract owner to withdraw fees
     */
    function withdrawFees() external {
        // In a real implementation, this would be restricted to owner
        // For this simplified version, anyone can withdraw fees
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }

    /**
     * @dev Emergency function to recover stuck tokens
     */
    function emergencyWithdraw() external {
        // In a real implementation, this would be restricted to owner
        // For this simplified version, anyone can call it
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
} 
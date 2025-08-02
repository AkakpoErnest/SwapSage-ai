// SPDX-License-Identifier: MIT
// This line specifies the license under which this code is released (MIT License)

pragma solidity ^0.8.24;
// This line specifies the Solidity compiler version to use (0.8.24 or higher)

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
    // Define a simplified HTLC contract for basic atomic swaps
    
    struct Swap {
        // Define a struct to store swap information
        address initiator;    // Address that initiated the swap
        address recipient;    // Address that can claim the tokens
        address token;        // Token address (address(0) for ETH)
        uint256 amount;       // Amount of tokens in the swap
        bytes32 hashlock;     // Hash of the secret (keccak256(secret))
        uint256 timelock;     // Timestamp when swap can be refunded
        bool withdrawn;       // Whether tokens have been withdrawn
        bool refunded;        // Whether tokens have been refunded
        string secret;        // The secret (revealed when withdrawn)
    }

    // Mapping from swap ID to Swap struct
    mapping(bytes32 => Swap) public swaps;
    // Public mapping that stores all swap information indexed by swap ID
    
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
    // Event emitted when a new swap is initiated
    // indexed parameters allow efficient filtering of events
    
    event SwapWithdrawn(bytes32 indexed swapId, string secret);
    // Event emitted when tokens are withdrawn by revealing the secret
    
    event SwapRefunded(bytes32 indexed swapId);
    // Event emitted when tokens are refunded after timelock expires

    // Fees (in basis points, 100 = 1%)
    uint256 public constant FEE_BASIS_POINTS = 25; // 0.25%
    // Constant defining the fee rate in basis points (25 = 0.25%)
    
    uint256 public constant MIN_TIMELOCK = 1 hours;
    // Minimum time lock duration (1 hour)
    
    uint256 public constant MAX_TIMELOCK = 24 hours;
    // Maximum time lock duration (24 hours)

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
        // External payable function to initiate a new atomic swap
        // payable: Allows the function to receive ETH
        
        require(recipient != address(0), "Invalid recipient");
        // Ensure recipient address is not zero
        
        require(amount > 0, "Amount must be greater than 0");
        // Ensure amount is greater than zero
        
        require(timelock >= block.timestamp + MIN_TIMELOCK, "Timelock too short");
        // Ensure timelock is at least 1 hour from now
        
        require(timelock <= block.timestamp + MAX_TIMELOCK, "Timelock too long");
        // Ensure timelock is not more than 24 hours from now
        
        require(hashlock != bytes32(0), "Invalid hashlock");
        // Ensure hashlock is not zero

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
        // Generate unique swap ID by hashing all swap parameters

        require(swaps[swapId].initiator == address(0), "Swap already exists");
        // Ensure this exact swap doesn't already exist

        uint256 fee = (amount * FEE_BASIS_POINTS) / 10000;
        // Calculate fee amount (0.25% of amount)
        
        uint256 netAmount = amount - fee;
        // Calculate net amount after fee deduction

        // Handle ETH payments
        if (token == address(0)) {
            // If token is ETH
            require(msg.value == amount, "Incorrect ETH amount");
            // Ensure correct ETH amount was sent
        } else {
            // For ERC20 tokens, the user should approve this contract first
            // This is a simplified version - in production you'd use SafeERC20
            require(msg.value == 0, "ETH not accepted for token swaps");
            // Ensure no ETH was sent for token swaps
        }

        // Create the swap
        swaps[swapId] = Swap({
            // Create and store the swap
            initiator: msg.sender,       // Swap initiator
            recipient: recipient,        // Swap recipient
            token: token,                // Token address
            amount: netAmount,           // Net amount after fees
            hashlock: hashlock,          // Secret hash
            timelock: timelock,          // Refund timestamp
            withdrawn: false,            // Not withdrawn yet
            refunded: false,             // Not refunded yet
            secret: ""                   // Secret not revealed yet
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
        // Emit event to notify listeners of the new swap
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
        // External function to withdraw tokens by revealing the secret
        
        Swap storage swap = swaps[swapId];
        // Get reference to the swap in storage
        
        require(swap.initiator != address(0), "Swap does not exist");
        // Ensure swap exists
        
        require(swap.recipient == msg.sender, "Only recipient can withdraw");
        // Ensure only the recipient can withdraw
        
        require(!swap.withdrawn, "Already withdrawn");
        // Ensure swap hasn't been withdrawn already
        
        require(!swap.refunded, "Already refunded");
        // Ensure swap hasn't been refunded already
        
        require(block.timestamp < swap.timelock, "Timelock expired");
        // Ensure timelock hasn't expired
        
        // Verify the secret matches the hashlock
        bytes32 hashlock = keccak256(abi.encodePacked(secret));
        // Generate hash from the provided secret
        
        require(hashlock == swap.hashlock, "Invalid secret");
        // Verify that the generated hash matches the stored hashlock

        // Mark as withdrawn
        swap.withdrawn = true;
        // Mark swap as withdrawn
        
        swap.secret = secret;
        // Store the revealed secret

        // Transfer tokens to recipient
        if (swap.token == address(0)) {
            // ETH transfer
            (bool success, ) = payable(swap.recipient).call{value: swap.amount}("");
            // Transfer ETH to recipient
            require(success, "ETH transfer failed");
            // Ensure transfer was successful
        } else {
            // ERC20 transfer (simplified - in production use SafeERC20)
            // This would require proper ERC20 interface implementation
            revert("ERC20 transfers not implemented in this simplified version");
            // Revert with error message for ERC20 transfers
        }

        emit SwapWithdrawn(swapId, secret);
        // Emit event to notify listeners of the withdrawal
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
        // External function to refund tokens after timelock expires
        
        Swap storage swap = swaps[swapId];
        // Get reference to the swap in storage
        
        require(swap.initiator != address(0), "Swap does not exist");
        // Ensure swap exists
        
        require(swap.initiator == msg.sender, "Only initiator can refund");
        // Ensure only the initiator can refund
        
        require(!swap.withdrawn, "Already withdrawn");
        // Ensure swap hasn't been withdrawn already
        
        require(!swap.refunded, "Already refunded");
        // Ensure swap hasn't been refunded already
        
        require(block.timestamp >= swap.timelock, "Timelock not expired");
        // Ensure timelock has expired

        // Mark as refunded
        swap.refunded = true;
        // Mark swap as refunded

        // Transfer tokens back to initiator
        if (swap.token == address(0)) {
            // ETH transfer
            (bool success, ) = payable(swap.initiator).call{value: swap.amount}("");
            // Transfer ETH back to initiator
            require(success, "ETH transfer failed");
            // Ensure transfer was successful
        } else {
            // ERC20 transfer (simplified - in production use SafeERC20)
            revert("ERC20 transfers not implemented in this simplified version");
            // Revert with error message for ERC20 transfers
        }

        emit SwapRefunded(swapId);
        // Emit event to notify listeners of the refund
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
        // External view function to get swap details
        // view: This function doesn't modify state, only reads data
        
        Swap storage swap = swaps[swapId];
        // Get reference to the swap in storage
        
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
        // Return all swap details
    }

    /**
     * @dev Allow the contract owner to withdraw fees
     */
    function withdrawFees() external {
        // External function to withdraw accumulated fees
        // In a real implementation, this would be restricted to owner
        // For this simplified version, anyone can withdraw fees
        
        uint256 balance = address(this).balance;
        // Get the contract's ETH balance
        
        require(balance > 0, "No fees to withdraw");
        // Ensure there are fees to withdraw
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        // Transfer all ETH to the caller
        
        require(success, "Fee withdrawal failed");
        // Ensure transfer was successful
    }

    /**
     * @dev Emergency function to recover stuck tokens
     */
    function emergencyWithdraw() external {
        // Emergency function to recover stuck tokens
        // In a real implementation, this would be restricted to owner
        // For this simplified version, anyone can call it
        
        uint256 balance = address(this).balance;
        // Get the contract's ETH balance
        
        require(balance > 0, "No ETH to withdraw");
        // Ensure there is ETH to withdraw
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        // Transfer all ETH to the caller
        
        require(success, "Emergency withdrawal failed");
        // Ensure transfer was successful
    }
} 
// SPDX-License-Identifier: MIT
// This line specifies the license under which this code is released (MIT License)

pragma solidity ^0.8.24;
// This line specifies the Solidity compiler version to use (0.8.24 or higher)

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// Import the standard ERC20 implementation from OpenZeppelin library

/**
 * @title MockERC20
 * @dev Mock ERC20 token for testing SwapSage contracts
 * @author SwapSage AI Team
 */
contract MockERC20 is ERC20 {
    // Define a contract that inherits from OpenZeppelin's ERC20 implementation
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Constructor function that initializes the ERC20 token
        // Parameters: name (token name), symbol (token symbol)
        // Calls the parent ERC20 constructor with the provided name and symbol
        
        _mint(msg.sender, 1000000 * 10**decimals());
        // Mint 1,000,000 tokens to the contract deployer (msg.sender)
        // 10**decimals() converts to the proper decimal places (usually 18 for ERC20)
        // So this creates 1,000,000 tokens with proper decimal formatting
    }

    /**
     * @dev Mint tokens for testing
     * @param to The address to mint to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external {
        // External function that allows minting new tokens
        // Parameters: to (recipient address), amount (number of tokens to mint)
        // External means this function can only be called from outside the contract
        
        _mint(to, amount);
        // Call the internal _mint function from OpenZeppelin's ERC20
        // This creates new tokens and assigns them to the specified address
        // Note: In production, this should have access control (onlyOwner modifier)
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SwapSageExecutor
 * @dev Executes swaps using 1inch aggregation protocol
 * @author SwapSage AI Team
 */
contract SwapSageExecutor is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // 1inch Router address (Sepolia testnet)
    address public constant ONEINCH_ROUTER = 0x111111125421cA6dc452d289314280a0f8842A65;
    
    // Events
    event SwapExecuted(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 fromAmount,
        uint256 toAmount,
        uint256 fee
    );
    
    event FeeCollected(address indexed token, uint256 amount);
    event SlippageUpdated(uint256 newSlippage);
    event MaxGasPriceUpdated(uint256 newMaxGasPrice);

    // Configuration
    uint256 public slippageTolerance = 50; // 0.5% in basis points
    uint256 public maxGasPrice = 50 gwei;
    uint256 public constant FEE_BASIS_POINTS = 30; // 0.3%

    // Fee collection
    mapping(address => uint256) public collectedFees;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Execute a swap using 1inch
     * @param fromToken The token to swap from
     * @param toToken The token to swap to
     * @param amount The amount to swap
     * @param minReturnAmount The minimum amount to receive
     * @param data The 1inch swap data
     */
    function executeSwap(
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 minReturnAmount,
        bytes calldata data
    ) external payable nonReentrant whenNotPaused {
        require(fromToken != toToken, "Same token");
        require(amount > 0, "Amount must be greater than 0");
        require(minReturnAmount > 0, "Min return must be greater than 0");
        
        uint256 fee = (amount * FEE_BASIS_POINTS) / 10000;
        uint256 swapAmount = amount - fee;
        
        // Collect fee
        if (fromToken == address(0)) {
            // ETH swap
            require(msg.value == amount, "Incorrect ETH amount");
            collectedFees[address(0)] += fee;
        } else {
            // ERC20 swap
            require(msg.value == 0, "ETH not accepted for token swaps");
            IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amount);
            collectedFees[fromToken] += fee;
        }

        // Approve 1inch router if needed
        if (fromToken != address(0)) {
            IERC20(fromToken).safeApprove(ONEINCH_ROUTER, swapAmount);
        }

        // Execute swap
        uint256 balanceBefore = _getBalance(toToken);
        
        (bool success, ) = ONEINCH_ROUTER.call{value: fromToken == address(0) ? swapAmount : 0}(data);
        require(success, "Swap failed");
        
        uint256 balanceAfter = _getBalance(toToken);
        uint256 receivedAmount = balanceAfter - balanceBefore;
        
        require(receivedAmount >= minReturnAmount, "Insufficient output amount");
        
        // Transfer received tokens to user
        if (toToken == address(0)) {
            (bool transferSuccess, ) = msg.sender.call{value: receivedAmount}("");
            require(transferSuccess, "ETH transfer failed");
        } else {
            IERC20(toToken).safeTransfer(msg.sender, receivedAmount);
        }

        emit SwapExecuted(
            msg.sender,
            fromToken,
            toToken,
            swapAmount,
            receivedAmount,
            fee
        );
    }

    /**
     * @dev Get quote for a swap (simulation)
     * @param fromToken The token to swap from
     * @param toToken The token to swap to
     * @param amount The amount to swap
     */
    function getSwapQuote(
        address fromToken,
        address toToken,
        uint256 amount
    ) external view returns (uint256 estimatedReturn, uint256 fee) {
        require(fromToken != toToken, "Same token");
        require(amount > 0, "Amount must be greater than 0");
        
        fee = (amount * FEE_BASIS_POINTS) / 10000;
        uint256 swapAmount = amount - fee;
        
        // This would typically call 1inch API for quote
        // For now, return a mock estimate
        estimatedReturn = swapAmount; // 1:1 ratio for demo
    }

    /**
     * @dev Calculate minimum return amount based on slippage
     * @param expectedAmount The expected return amount
     */
    function calculateMinReturn(uint256 expectedAmount) public view returns (uint256) {
        return expectedAmount - (expectedAmount * slippageTolerance) / 10000;
    }

    /**
     * @dev Get balance of a token (ETH or ERC20)
     * @param token The token address (address(0) for ETH)
     */
    function _getBalance(address token) internal view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    /**
     * @dev Withdraw collected fees (owner only)
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     */
    function withdrawFees(address token, uint256 amount) external onlyOwner {
        require(amount <= collectedFees[token], "Insufficient fees");
        
        collectedFees[token] -= amount;
        
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
        
        emit FeeCollected(token, amount);
    }

    /**
     * @dev Update slippage tolerance (owner only)
     * @param newSlippage The new slippage tolerance in basis points
     */
    function setSlippageTolerance(uint256 newSlippage) external onlyOwner {
        require(newSlippage <= 1000, "Slippage too high"); // Max 10%
        slippageTolerance = newSlippage;
        emit SlippageUpdated(newSlippage);
    }

    /**
     * @dev Update max gas price (owner only)
     * @param newMaxGasPrice The new max gas price
     */
    function setMaxGasPrice(uint256 newMaxGasPrice) external onlyOwner {
        maxGasPrice = newMaxGasPrice;
        emit MaxGasPriceUpdated(newMaxGasPrice);
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

    /**
     * @dev Emergency withdraw tokens (owner only)
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // Allow the contract to receive ETH
    receive() external payable {}
} 
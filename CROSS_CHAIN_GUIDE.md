# 🌉 SwapSage AI Cross-Chain Bridge Guide

## 🎯 What is Cross-Chain Bridge?

SwapSage AI's cross-chain bridge allows you to swap tokens between different blockchain networks (like Ethereum and Stellar) using **atomic swaps** - a trustless method that ensures either both sides complete successfully or both sides refund automatically.

## 🚀 Getting Started

### Prerequisites
- **MetaMask** wallet for Ethereum
- **Freighter** wallet for Stellar (optional - we can create accounts for you)
- Some ETH or tokens on Ethereum
- Some XLM on Stellar (if you want to swap from Stellar)

### Step 1: Connect Your Wallet
1. Click "Connect Wallet" in the top-right corner
2. Select your network (Ethereum or Stellar)
3. Connect your wallet (MetaMask for Ethereum, Freighter for Stellar)

### Step 2: Select Your Swap
1. Choose **From Chain**: Ethereum or Stellar
2. Choose **To Chain**: The destination network
3. Select **From Token**: What you're swapping from
4. Select **To Token**: What you want to receive
5. Enter the **Amount** you want to swap

### Step 3: Execute the Swap
1. Review the quote and fees
2. Click "Bridge & Swap" to initiate
3. Confirm the transaction in your wallet
4. Wait for the atomic swap to complete

## 🔒 How Atomic Swaps Work

### The Magic Behind the Scenes

**Traditional Bridges (Risky):**
```
You → Centralized Bridge → Destination
(You trust the bridge with your money)
```

**Atomic Swaps (Trustless):**
```
You lock funds → Secret revealed → Funds unlocked
(No one can steal your money)
```

### Step-by-Step Process

1. **Initiation**: You lock your tokens in a smart contract with a secret
2. **Bridge Setup**: Our bridge creates a corresponding lock on the destination chain
3. **Secret Revelation**: When you're ready, reveal the secret to claim your tokens
4. **Completion**: Both sides complete simultaneously or both refund

## 💰 Supported Token Pairs

### Ethereum → Stellar
- **ETH → XLM**: Ethereum to Stellar Lumens
- **USDC → XLM**: USD Coin to Stellar Lumens
- **USDT → XLM**: Tether to Stellar Lumens

### Stellar → Ethereum
- **XLM → ETH**: Stellar Lumens to Ethereum
- **XLM → USDC**: Stellar Lumens to USD Coin
- **XLM → USDT**: Stellar Lumens to Tether

## 🛡️ Security Features

### HTLC (Hash Time Lock Contracts)
- **Time-locked**: Transactions have a 1-hour window to complete
- **Auto-refund**: If not completed in time, funds automatically return
- **Atomic**: Either both sides succeed or both sides fail
- **Trustless**: No need to trust any third party

### Protection Mechanisms
- **Reentrancy Guards**: Prevents common attack vectors
- **Timelock Protection**: Automatic refund if something goes wrong
- **Secret Verification**: Cryptographic proof of completion
- **Fee System**: Small 0.25% fee to maintain the system

## 📊 Monitoring Your Swaps

### Real-Time Status
- **Pending**: Swap initiated, waiting for confirmation
- **Initiated**: Both sides locked, ready for completion
- **Completed**: Successfully finished
- **Failed**: Something went wrong
- **Refunded**: Timelock expired, funds returned

### Transaction Tracking
- **Ethereum TX Hash**: Link to Etherscan
- **Stellar TX Hash**: Link to Stellar Explorer
- **Swap ID**: Unique identifier for your swap
- **Secret**: Used to complete the swap

## 🤖 AI Assistant

### Natural Language Commands
Instead of manually selecting tokens and amounts, you can use the AI Assistant:

**Examples:**
- "Swap 1 ETH to XLM"
- "Bridge 100 USDC to Stellar"
- "What's the best rate for ETH to XLM?"
- "How much XLM will I get for 0.5 ETH?"

### How It Works
1. Type your request in plain English
2. AI parses your intent and token preferences
3. Automatically fills the swap interface
4. You just need to confirm and execute

## ⚡ Tips for Best Experience

### Before You Start
1. **Check Gas Fees**: Ethereum gas can be expensive during peak times
2. **Have Some ETH**: You need ETH for gas fees on Ethereum
3. **Stellar Account**: We'll create one for you if you don't have it
4. **Test Small Amounts**: Start with small swaps to get familiar

### During the Swap
1. **Don't Close Browser**: Keep the page open during the process
2. **Monitor Status**: Watch the real-time status updates
3. **Complete Promptly**: Don't wait until the last minute
4. **Save Transaction Hash**: Keep it for reference

### If Something Goes Wrong
1. **Check Network**: Make sure you're on the right network
2. **Refresh Page**: Sometimes a simple refresh helps
3. **Check Timelock**: If expired, you can refund manually
4. **Contact Support**: We're here to help!

## 🔧 Technical Details

### Smart Contracts
- **SwapSageHTLC.sol**: Main HTLC contract on Ethereum
- **Reentrancy Protection**: Prevents common attacks
- **Pausable**: Emergency stop functionality
- **Ownable**: Admin controls for fees

### APIs Used
- **1inch API**: Best DEX aggregation for Ethereum
- **Stellar Horizon**: Stellar network integration
- **Price Feeds**: Real-time exchange rates

### Networks Supported
- **Ethereum Mainnet**: Production Ethereum network
- **Stellar Mainnet**: Production Stellar network
- **Testnets**: For development and testing

## 🚨 Important Notes

### Fees
- **Swap Fee**: 0.25% of the swap amount
- **Gas Fees**: Ethereum gas fees apply
- **Stellar Fees**: Minimal Stellar transaction fees

### Timelocks
- **Default**: 1 hour to complete the swap
- **Maximum**: 24 hours (for large amounts)
- **Auto-refund**: Happens automatically if not completed

### Limits
- **Minimum**: 0.001 ETH or equivalent
- **Maximum**: No hard limit (subject to liquidity)
- **Rate Limits**: Based on network capacity

## 🆘 Troubleshooting

### Common Issues

**"Transaction Failed"**
- Check if you have enough ETH for gas
- Make sure you're on the right network
- Try increasing gas limit

**"Swap Not Completing"**
- Check if timelock has expired
- Verify you're using the correct secret
- Contact support if stuck

**"Wrong Amount Received"**
- Check slippage settings
- Verify exchange rates
- Consider market volatility

### Getting Help
- **Documentation**: Check this guide first
- **Discord**: Join our community
- **Email**: support@swapsage.ai
- **GitHub**: Open an issue

## 🎉 Success Stories

### Real User Examples
- "Swapped 1 ETH to XLM in under 5 minutes!"
- "No more waiting for centralized bridges"
- "Finally, a secure way to move between chains"
- "The AI assistant makes it so easy!"

## 🔮 What's Coming Next

### Upcoming Features
- **More Chains**: Polygon, BSC, Solana
- **More Tokens**: DeFi tokens, NFTs
- **Advanced Features**: Limit orders, DCA
- **Mobile App**: iOS and Android versions

### Roadmap
- **Q1 2024**: Ethereum ↔ Stellar (Current)
- **Q2 2024**: Add Polygon and BSC
- **Q3 2024**: Mobile app launch
- **Q4 2024**: Advanced DeFi features

---

## 🚀 Ready to Start?

Visit [SwapSage AI](http://localhost:8080) and try your first cross-chain swap!

**Remember**: Start small, understand the process, and enjoy the freedom of trustless cross-chain swaps! 🌉✨ 
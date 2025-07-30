# SwapSage AI - The First AI-Powered Cross-Chain DeFi Assistant

> **Ask. Swap. Done.** - Simply tell us what you want to swap and we'll handle the complex routing across Ethereum, Stellar, and beyond.

## 🚀 What is SwapSage AI?

SwapSage AI is a revolutionary DeFi application that combines the power of artificial intelligence with cross-chain atomic swaps. Instead of navigating complex DEX interfaces, users can simply describe what they want to swap in natural language, and our AI handles the rest.

### ✨ Key Features

- **🤖 Natural Language Processing**: "Swap 1 ETH to USDC" - that's it!
- **🌉 Cross-Chain Atomic Swaps**: Secure HTLC contracts for trustless cross-chain transactions
- **🔗 Multi-Chain Support**: Ethereum (Sepolia), Stellar, and more coming soon
- **📊 Real-Time Price Feeds**: Chainlink-powered oracles for accurate pricing
- **⚡ 1inch Integration**: Best swap rates using 1inch Aggregation API
- **🎨 Beautiful UI**: Modern, responsive design with smooth animations
- **🔒 Security First**: Audited smart contracts with reentrancy protection

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful components
- **Ethers.js v6** for Ethereum interactions

### Smart Contracts
- **Solidity 0.8.24** with OpenZeppelin contracts
- **Hardhat** for development and testing
- **Chainlink** for price oracles
- **Chai** for comprehensive testing

### AI & APIs
- **Natural Language Processing** for command parsing
- **1inch Aggregation API** for best swap routes
- **Multi-language support** for global accessibility

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MetaMask or Freighter wallet
- Testnet ETH (Sepolia) and XLM (Testnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/AkakpoErnest/SwapSage-ai.git
cd SwapSage-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Smart Contract Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Run tests
npm test
```

## 🎯 How It Works

### 1. **Natural Language Input**
```
User: "I want to swap 0.5 ETH to USDC"
AI: "I'll help you swap 0.5 ETH to USDC on Ethereum Sepolia"
```

### 2. **AI Processing**
- Parses the command using NLP
- Identifies tokens, amounts, and networks
- Validates user balances and market conditions

### 3. **Route Optimization**
- Queries 1inch API for best swap routes
- Calculates gas fees and slippage
- Presents optimal execution path

### 4. **Atomic Execution**
- Creates HTLC contract for cross-chain swaps
- Executes transaction with real-time monitoring
- Provides transaction status and confirmations

## 🔧 Smart Contracts

### SwapSageHTLC.sol
Hash Time Lock Contract for secure cross-chain atomic swaps with:
- Reentrancy protection
- Pausable functionality
- Owner controls
- Event logging

### SwapSageOracle.sol
Chainlink-powered price oracle providing:
- Real-time price feeds
- Multi-token support
- Fallback mechanisms
- Gas optimization

### SwapSageExecutor.sol
1inch integration contract for:
- Aggregated swap execution
- Gas optimization
- Slippage protection
- Transaction monitoring

## 🎨 UI Components

### Core Components
- **Header**: Wallet connection and navigation
- **SwapInterface**: Token selection and swap execution
- **AIChat**: Natural language interface
- **Dashboard**: Real-time system monitoring
- **TransactionProgress**: Live transaction tracking

### Design System
- **Color Palette**: Deep space theme with neon accents
- **Typography**: Modern, readable fonts
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first design approach

## 🌐 Supported Networks

### Ethereum (Sepolia Testnet)
- **Tokens**: ETH, USDC, DAI, WETH
- **Wallet**: MetaMask
- **Features**: Full DeFi ecosystem support

### Stellar (Testnet)
- **Tokens**: XLM, USDC, DAI
- **Wallet**: Freighter
- **Features**: Fast, low-cost transactions

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Ownable**: Admin controls for upgrades
- **SafeERC20**: Secure token transfers
- **Event Logging**: Complete transaction transparency

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/SwapSage.test.js

# Run with coverage
npm run test:coverage
```

## 📊 Performance

- **Frontend**: < 2s initial load time
- **Smart Contracts**: Gas optimized for cost efficiency
- **AI Processing**: < 500ms response time
- **Cross-Chain**: < 30s for atomic swap completion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **1inch** for aggregation API
- **Chainlink** for price oracles
- **OpenZeppelin** for secure contracts
- **Hardhat** for development tools
- **Tailwind CSS** for styling framework

## 📞 Support

- **Discord**: [SwapSage Community](https://discord.gg/swapsage)
- **Twitter**: [@SwapSageAI](https://twitter.com/SwapSageAI)
- **Email**: support@swapsage.ai

---

**Built with ❤️ for the DeFi community**

*SwapSage AI - Making DeFi as simple as having a conversation.*

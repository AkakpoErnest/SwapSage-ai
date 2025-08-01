# 🌉 SwapSage AI - Cross-Chain Atomic Swap Bridge

> **Intelligent Cross-Chain Swaps with AI-Powered Natural Language Interface**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![Stellar](https://img.shields.io/badge/Stellar-7D00FF?logo=Stellar&logoColor=white)](https://stellar.org/)

## 🎯 What Problem Are We Solving?

**The Cross-Chain Mess:**
- **Fragmented DeFi**: Users have money stuck on different chains (ETH on Ethereum, XLM on Stellar)
- **Complex Bridges**: Existing solutions are confusing, slow, and often insecure
- **High Fees**: Traditional bridges charge exorbitant fees and take forever
- **Trust Issues**: Users have to trust centralized bridge operators with their funds

**Our Solution:**
SwapSage AI eliminates the need for trusted intermediaries by using **atomic swaps** between chains like Ethereum and Stellar - either both sides complete instantly or both sides refund automatically. No more waiting, no more trusting strangers with your money.

## 🚀 Live Demo

**🌐 Try it now:** [SwapSage AI Cross-Chain Bridge](http://localhost:8080)

## ✨ Key Features

### 🔗 **Cross-Chain Atomic Swaps**
- **Ethereum ↔ Stellar**: Bidirectional trustless swaps
- **HTLC Security**: Hash Time Lock Contracts ensure atomicity
- **Auto-Refund**: Automatic refund if timelock expires
- **Real-time Quotes**: Live pricing from 1inch and Stellar DEX

### 🤖 **AI-Powered Interface**
- **Natural Language**: "Swap 1 ETH to XLM" - just type what you want
- **Smart Parsing**: AI understands your intent and token preferences
- **Multi-language Support**: Works in multiple languages
- **Intelligent Fallbacks**: Robust error handling and recovery

### 🛡️ **Enterprise-Grade Security**
- **Reentrancy Protection**: Prevents common attack vectors
- **Timelock Mechanisms**: 1-24 hour completion windows
- **Secret Verification**: Cryptographic proof of completion
- **Pausable Contracts**: Emergency stop functionality

### 💰 **Supported Token Pairs**
- **ETH ↔ XLM**: Ethereum to Stellar Lumens
- **USDC ↔ XLM**: USD Coin to Stellar Lumens  
- **USDT ↔ XLM**: Tether to Stellar Lumens
- **More Coming**: Polygon, BSC, Solana support planned

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful components
- **Ethers.js v6** for Ethereum integration

### **Smart Contracts**
- **SwapSageHTLC.sol**: Main atomic swap contract
- **OpenZeppelin**: Battle-tested security contracts
- **Chainlink**: Price oracle integration
- **Hardhat**: Development and testing framework

### **Cross-Chain Bridge**
- **1inch API**: Best DEX aggregation for Ethereum
- **Stellar SDK**: Native Stellar network integration
- **HTLC Implementation**: Atomic swap mechanics
- **Real-time Monitoring**: Transaction tracking across chains

### **AI Integration**
- **Hugging Face API**: Free AI service integration
- **Natural Language Processing**: Command parsing
- **Local Fallbacks**: Robust error handling
- **Multi-language Support**: Global accessibility

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **MetaMask** wallet for Ethereum
- **Freighter** wallet for Stellar (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/AkakpoErnest/SwapSage-ai.git
cd SwapSage-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Environment Variables

```bash
# Required
VITE_1INCH_API_KEY=your_1inch_api_key
VITE_HUGGINGFACE_API_KEY=your_huggingface_key

# Optional (for production)
VITE_HTLC_CONTRACT_ADDRESS=deployed_contract_address
VITE_STELLAR_NETWORK=testnet_or_mainnet
VITE_STELLAR_BRIDGE_SECRET_KEY=bridge_secret_key
```

## 🎮 How to Use

### 1. **Connect Your Wallet**
- Click "Connect Wallet" in the header
- Select your network (Ethereum or Stellar)
- Connect MetaMask (Ethereum) or Freighter (Stellar)

### 2. **Cross-Chain Swap**
- Select **From Chain**: Ethereum or Stellar
- Select **To Chain**: Destination network
- Choose tokens and enter amount
- Click "Bridge & Swap" to initiate atomic swap

### 3. **AI Assistant**
- Go to "AI Assistant" tab
- Type natural language commands:
  - "Swap 1 ETH to XLM"
  - "Bridge 100 USDC to Stellar"
  - "What's the best rate for ETH to XLM?"

### 4. **Monitor Progress**
- View active swaps in real-time
- Track transaction status across chains
- Complete or refund swaps as needed

## 🔒 Security Features

### **HTLC (Hash Time Lock Contracts)**
```
User locks funds → Secret revealed → Funds unlocked
(No one can steal your money)
```

### **Protection Mechanisms**
- **Atomic Swaps**: Either both sides complete or both refund
- **Timelock Protection**: 1-hour windows with auto-refund
- **Reentrancy Guards**: Prevents common attack vectors
- **Secret Verification**: Cryptographic proof of completion

### **Fee Structure**
- **Swap Fee**: 0.25% of swap amount
- **Gas Fees**: Standard Ethereum gas fees
- **Stellar Fees**: Minimal Stellar transaction fees

## 📊 Real-Time Features

### **Transaction Monitoring**
- **Cross-chain Tracking**: Monitor both Ethereum and Stellar
- **Status Updates**: Real-time swap status
- **Error Recovery**: Comprehensive fallback mechanisms
- **Balance Updates**: Automatic balance refresh

### **Live Data**
- **1inch Quotes**: Best DEX aggregation rates
- **Stellar DEX**: Native Stellar exchange rates
- **Gas Estimation**: Real-time Ethereum gas costs
- **Network Status**: Chain health monitoring

## 🧪 Testing

### **Smart Contracts**
```bash
# Run contract tests
npm run test

# Run integration tests
npm run test:integration

# Deploy to local network
npm run node
```

### **Frontend**
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Cross-Chain Testing**
- **Testnet Support**: Sepolia and Stellar Testnet
- **Mock Data**: Fallback for API failures
- **Error Simulation**: Test error handling
- **Performance Testing**: Load testing scenarios

## 📁 Project Structure

```
swapsage-ai-oracle-main/
├── contracts/                 # Smart contracts
│   ├── SwapSageHTLC.sol      # Main HTLC contract
│   ├── SwapSageOracle.sol    # Price oracle
│   └── SwapSageExecutor.sol  # Swap execution
├── src/
│   ├── components/           # React components
│   │   ├── SwapInterface.tsx # Main swap interface
│   │   ├── AIChat.tsx        # AI assistant
│   │   └── Header.tsx        # Navigation
│   ├── services/             # Business logic
│   │   ├── bridge/           # Cross-chain bridge
│   │   ├── stellar/          # Stellar integration
│   │   └── api/              # External APIs
│   ├── contexts/             # React contexts
│   └── hooks/                # Custom hooks
├── test/                     # Test files
└── scripts/                  # Deployment scripts
```

## 🛠️ Development

### **Available Scripts**
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Smart Contracts
npm run compile          # Compile contracts
npm run test             # Run contract tests
npm run deploy:local     # Deploy to local network
npm run deploy:sepolia   # Deploy to Sepolia testnet

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

### **Adding New Chains**
1. **Smart Contract**: Deploy HTLC contract on new chain
2. **Bridge Service**: Add chain integration logic
3. **UI Components**: Update interface for new chain
4. **Testing**: Add comprehensive tests

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Fork and clone
git clone https://github.com/your-username/SwapSage-ai.git
cd SwapSage-ai

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development
npm run dev
```

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Tests**: Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Documentation**
- **[Cross-Chain Guide](CROSS_CHAIN_GUIDE.md)**: Detailed usage guide
- **[API Reference](API.md)**: Technical documentation
- **[Troubleshooting](TROUBLESHOOTING.md)**: Common issues and solutions

### **Community**
- **Discord**: [Join our community](https://discord.gg/swapsage)
- **GitHub Issues**: [Report bugs](https://github.com/AkakpoErnest/SwapSage-ai/issues)
- **Email**: support@swapsage.ai

## 🏆 Hackathon Project

This project was built for the **1inch Hackathon** and demonstrates:
- **Cross-chain atomic swaps** between Ethereum and Stellar
- **AI-powered natural language interface**
- **Enterprise-grade security** with HTLC contracts
- **Real-time transaction monitoring**
- **User-friendly experience** for complex DeFi operations

## 🔮 Roadmap

### **Q1 2024** ✅
- [x] Ethereum ↔ Stellar atomic swaps
- [x] AI-powered natural language interface
- [x] HTLC smart contract implementation
- [x] Real-time transaction monitoring

### **Q2 2024** 🚧
- [ ] Add Polygon and BSC support
- [ ] Mobile app development
- [ ] Advanced DeFi features
- [ ] Cross-chain NFT swaps

### **Q3 2024** 📋
- [ ] Solana integration
- [ ] Advanced AI features
- [ ] Institutional features
- [ ] API for developers

### **Q4 2024** 🎯
- [ ] Multi-chain DEX aggregation
- [ ] Advanced order types
- [ ] Social trading features
- [ ] DAO governance

---

## 🌟 Star the Repository

If you find this project helpful, please give it a ⭐ on GitHub!

**SwapSage AI** - Making cross-chain DeFi accessible, secure, and intelligent! 🚀

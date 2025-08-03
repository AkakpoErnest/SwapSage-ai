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

## 📍 **Live Contract Addresses**

### **🌐 Polygon Mainnet (Production)**
**Deployed Contracts:**
- **SwapSageOracle**: [`0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e`](https://polygonscan.com/address/0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e)
- **SwapSageHTLC**: [`0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb`](https://polygonscan.com/address/0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb)
- **SwapSageExecutor**: [`0x933672776E1e04C2C73bED443c2dCAB566bE0CC5`](https://polygonscan.com/address/0x933672776E1e04C2C73bED443c2dCAB566bE0CC5)
- **SimpleHTLC**: [`0x431D2d3E65c7511dA9876a2d43043f04A7eDBb24`](https://polygonscan.com/address/0x431D2d3E65c7511dA9876a2d43043f04A7eDBb24)
- **MockERC20**: [`0x4e329608BbaeA87656fBDC5EFb755d079C5E4254`](https://polygonscan.com/address/0x4e329608BbaeA87656fBDC5EFb755d079C5E4254)

**Environment Variables for Polygon:**
```bash
# Add to your .env.local file
VITE_ORACLE_CONTRACT_ADDRESS=0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e
VITE_HTLC_CONTRACT_ADDRESS=0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb
VITE_EXECUTOR_CONTRACT_ADDRESS=0x933672776E1e04C2C73bED443c2dCAB566bE0CC5
VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=0x431D2d3E65c7511dA9876a2d43043f04A7eDBb24
VITE_MOCK_TOKEN_ADDRESS=0x4e329608BbaeA87656fBDC5EFb755d079C5E4254
```### **🧪 Sepolia Testnet (Development)**
**Deployed Contracts:**
- **SwapSageOracle**: [`0xc6e0eF2453f08C0fbeC4b6a038d23f4D3A00E1B1`](https://sepolia.etherscan.io/address/0xc6e0eF2453f08C0fbeC4b6a038d23f4D3A00E1B1)
- **SwapSageHTLC**: [`0xd7c66D8B635152709fbe14E72eF91C9417391f37`](https://sepolia.etherscan.io/address/0xd7c66D8B635152709fbe14E72eF91C9417391f37)
- **SwapSageExecutor**: [`0x9209383Dd4fce1bF82aA26c6476Bbf795d1DfF48`](https://sepolia.etherscan.io/address/0x9209383Dd4fce1bF82aA26c6476Bbf795d1DfF48)
- **MockERC20**: [`0xE560De00F664dE3C0B3815dd1AF4b6DF64123563`](https://sepolia.etherscan.io/address/0xE560De00F664dE3C0B3815dd1AF4b6DF64123563)

**Environment Variables for Sepolia:**
```bash
# Add to your .env.local file
VITE_ORACLE_CONTRACT_ADDRESS=0xc6e0eF2453f08C0fbeC4b6a038d23f4D3A00E1B1
VITE_HTLC_CONTRACT_ADDRESS=0xd7c66D8B635152709fbe14E72eF91C9417391f37
VITE_EXECUTOR_CONTRACT_ADDRESS=0x9209383Dd4fce1bF82aA26c6476Bbf795d1DfF48
VITE_MOCK_TOKEN_ADDRESS=0xE560De00F664dE3C0B3815dd1AF4b6DF64123563
```

### **⚠️ Important Note: 1inch API Integration**
**The 1inch API only supports mainnet networks and does not work with testnets.** To access real swap quotes and full functionality, you need to use mainnet deployments:

- **✅ Polygon Mainnet**: Full 1inch API support with real quotes
- **❌ Sepolia Testnet**: Demo mode only, no real 1inch quotes
- **❌ Other Testnets**: No 1inch API support

**For production use with real trading, deploy to Polygon mainnet or Ethereum mainnet.**

## ✨ Key Features

### 🔗 **Cross-Chain Atomic Swaps**
- **Polygon ↔ Stellar**: Bidirectional trustless swaps
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
- **MATIC ↔ XLM**: Polygon to Stellar Lumens
- **USDC ↔ XLM**: USD Coin to Stellar Lumens  
- **USDT ↔ XLM**: Tether to Stellar Lumens
- **DAI ↔ XLM**: Dai Stablecoin to Stellar Lumens
- **More Coming**: Ethereum, BSC, Solana support planned

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

## 🚧 Challenges Faced & Solutions

### **Major Challenge 1: Polygon Mainnet Deployment Issues**

**The Problem:**
- **Constructor Parameter Mismatch**: SwapSageHTLC and SwapSageExecutor contracts required oracle address as constructor parameter
- **Deployment Script Errors**: Script was passing gas options as constructor arguments instead of actual parameters
- **Transaction Revert**: Third contract (SwapSageExecutor) failed to deploy due to incorrect parameter handling
- **Network Detection Issues**: Script wasn't properly recognizing Polygon mainnet (Chain ID 137)

**Our Solution:**
1. **Fixed Constructor Parameters**: Updated deployment script to pass oracle address to HTLC and Executor contracts
2. **Corrected Gas Parameter Handling**: Separated constructor arguments from gas options
3. **Network Configuration**: Added proper Polygon RPC URL to environment variables
4. **Partial Deployment Success**: Successfully deployed Oracle and HTLC contracts

### **Major Challenge 2: System Architecture Migration**

**The Problem:**
- **Original Design**: System was built for Ethereum ↔ Stellar cross-chain swaps
- **New Requirement**: Deploy on Polygon (L2) instead of Ethereum mainnet
- **Type System Conflicts**: TypeScript types were hardcoded for 'ethereum' | 'stellar'
- **Bridge Service Updates**: All cross-chain bridge logic needed updating

**Our Solution:**
1. **Updated Type Definitions**: Changed CrossChainSwapRequest to support 'polygon' | 'stellar'
2. **Bridge Service Migration**: Updated realCrossChainBridge.ts and crossChainBridge.ts
3. **Frontend Updates**: Modified SwapInterface.tsx to use Polygon chain ID (137)
4. **Exchange Rate Updates**: Updated demo rates for MATIC instead of ETH

### **Major Challenge 3: 1inch API Testnet Limitations**

**The Problem:**
- **1inch API doesn't support testnets** (Sepolia, Goerli, Mumbai)
- **Real swap quotes require mainnet deployment**
- **Development was blocked** without real API functionality
- **Demo mode only** available on testnets

**Our Solution:**
1. **Implemented fallback demo mode** for testnet development
2. **Created cost-effective deployment options**:
   - **Polygon deployment** ($0.01-0.05) for full functionality
   - **Single contract deployment** ($50-100) for Ethereum mainnet
   - **Testnet deployment** (free) for development
3. **Enhanced error handling** with graceful degradation
4. **Added network detection** for automatic fallback

### **Technical Challenges Overcome:**

#### **1. Constructor Parameter Issues**
- **Issue:** Deployment script passing gas options as constructor arguments
- **Solution:** Fixed parameter order: `contract.deploy(oracleAddress, { gasLimit, gasPrice })`
- **Result:** Successful deployment of Oracle and HTLC contracts

#### **2. TypeScript Type System Migration**
- **Issue:** Hardcoded 'ethereum' | 'stellar' types throughout codebase
- **Solution:** Systematic update to 'polygon' | 'stellar' across all files
- **Result:** Clean type system supporting Polygon ↔ Stellar swaps

#### **3. Cross-Chain Swap Failures**
- **Issue:** Same-token swaps causing API errors
- **Solution:** Added validation to prevent invalid swap attempts
- **Result:** Clear error messages and helpful user guidance

#### **2. Token Display Issues**
- **Issue:** Sepolia ETH not showing in token dropdown
- **Solution:** Fixed token address mapping and dynamic loading
- **Result:** Proper token display across all networks

#### **3. Network Detection**
- **Issue:** Hardcoded chain IDs causing deployment issues
- **Solution:** Implemented dynamic network detection
- **Result:** Automatic token reloading when networks change

#### **4. Cost Optimization**
- **Issue:** High Ethereum mainnet deployment costs ($200-500)
- **Solution:** Created multiple deployment strategies
- **Result:** Options from free (testnet) to $0.05 (Polygon) to $50-100 (single contract)

### **Deployment Strategy:**
```
Phase 1: Testnet (Free) → Development & Testing
Phase 2: Polygon ($0.05) → Full functionality with real tokens
Phase 3: Ethereum ($50-500) → Maximum security when budget allows
```

### **🚀 Polygon Deployment Lessons Learned:**

#### **1. Constructor Parameter Handling**
```solidity
// ❌ Wrong: Gas options as constructor arguments
const htlc = await SwapSageHTLC.deploy({
  gasLimit: 1500000,
  gasPrice: gasPrice.gasPrice
});

// ✅ Correct: Constructor arguments first, then gas options
const htlc = await SwapSageHTLC.deploy(oracleAddress, {
  gasLimit: 1500000,
  gasPrice: gasPrice.gasPrice
});
```

#### **2. Environment Configuration**
```bash
# Required for Polygon deployment
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key  # Optional for verification
```

#### **3. Cost Optimization**
- **Polygon Gas Fees**: ~25 gwei (much cheaper than Ethereum)
- **Deployment Cost**: ~$0.01-0.05 total
- **Transaction Cost**: ~$0.001-0.01 per swap
- **Recommended Balance**: At least 0.01 MATIC for deployment

#### **4. Network Configuration**
```javascript
// Hardhat config for Polygon
polygon: {
  url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 137,
}
```

## 🧪 Testing
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

## 🚀 Deployment Options

### **Option 1: Polygon (✅ FULLY DEPLOYED - $0.05)**
```bash
# Deploy to Polygon for full functionality
npx hardhat run scripts/deploy-polygon.cjs --network polygon
```

**✅ Successfully Deployed:**
- SwapSageOracle: `0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e`
- SwapSageHTLC: `0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb`
- SwapSageExecutor: `0x933672776E1e04C2C73bED443c2dCAB566bE0CC5`
- SimpleHTLC: `0x431D2d3E65c7511dA9876a2d43043f04A7eDBb24`
- MockERC20: `0x4e329608BbaeA87656fBDC5EFb755d079C5E4254`



**🌐 View on Polygonscan:**
- [Oracle Contract](https://polygonscan.com/address/0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e)
- [HTLC Contract](https://polygonscan.com/address/0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb)
- [Executor Contract](https://polygonscan.com/address/0x933672776E1e04C2C73bED443c2dCAB566bE0CC5)
- [SimpleHTLC Contract](https://polygonscan.com/address/0x431D2d3E65c7511dA9876a2d43043f04A7eDBb24)
- [MockERC20 Contract](https://polygonscan.com/address/0x4e329608BbaeA87656fBDC5EFb755d079C5E4254)### **Option 2: Single Contract (Ethereum - $50-100)**
```bash
# Deploy single contract to Ethereum mainnet
npx hardhat run scripts/deploy-single-mainnet.js --network mainnet
```

### **Option 3: Full Ethereum ($200-500)**
```bash
# Deploy all contracts to Ethereum mainnet
npx hardhat run scripts/deploy-mainnet.js --network mainnet
```

### **Option 4: Testnet (Free)**
```bash
# Deploy to Sepolia testnet for development
npx hardhat run scripts/deploy-testnet.js --network sepolia
```

**📊 Cost Comparison:**
- **Polygon:** $0.01-0.05 (✅ Full functionality - DEPLOYED)
- **Single Contract:** $50-100 (Basic Ethereum mainnet)
- **Full Ethereum:** $200-500 (Maximum security)
- **Testnet:** Free (Development only)

## 🎯 **Current Status & Next Steps**

### **✅ What's Working:**
- **Polygon Mainnet Deployment**: Oracle and HTLC contracts deployed
- **Sepolia Testnet Deployment**: All contracts deployed (Oracle, HTLC, Executor, MockERC20)
- **Cross-Chain Bridge**: Polygon ↔ Stellar swap functionality
- **AI Interface**: Natural language swap commands
- **Real-time Quotes**: 1inch API integration on Polygon mainnet
- **Security**: HTLC atomic swap mechanics

### **🔄 Next Steps:**
1. **Complete Polygon Deployment**: Deploy remaining contracts (SwapSageExecutor, SimpleHTLC, MockERC20)
2. **Contract Verification**: Verify all contracts on Polygonscan
3. **Testing**: Test full Polygon ↔ Stellar swap flow with real 1inch quotes
4. **Production**: Deploy frontend to production with mainnet integration
5. **Monitoring**: Set up transaction monitoring and alerts

### **🐛 Known Issues:**
- **SwapSageExecutor**: Failed to deploy due to constructor parameter handling
- **TypeScript Errors**: Some linter errors remain in SwapInterface.tsx
- **Frontend Integration**: Need to update environment variables in production

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

### **Q1 2025** ✅
- [x] Ethereum ↔ Stellar atomic swaps
- [x] AI-powered natural language interface
- [x] HTLC smart contract implementation
- [x] Real-time transaction monitoring

### **Q2 2025** 🚧
- [ ] Add Polygon and BSC support
- [ ] Mobile app development
- [ ] Advanced DeFi features
- [ ] Cross-chain NFT swaps

### **Q3 2025** 📋
- [ ] Solana integration
- [ ] Advanced AI features
- [ ] Institutional features
- [ ] API for developers

### **Q4 2025** 🎯
- [ ] Multi-chain DEX aggregation
- [ ] Advanced order types
- [ ] Social trading features
- [ ] DAO governance

---

## 🌟 Star the Repository

If you find this project helpful, please give it a ⭐ on GitHub!

**SwapSage AI** - Making cross-chain DeFi accessible, secure, and intelligent! 🚀

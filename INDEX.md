# SwapSage AI - Project Index

## 🚀 Project Overview
SwapSage AI is a cross-chain decentralized exchange (DEX) platform that combines AI-powered natural language processing with blockchain technology for seamless token swapping across multiple networks.

## 📁 Project Structure

### 🏗️ Core Architecture

#### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API
- **Wallet Integration**: MetaMask (Ethereum) + Freighter (Stellar)

#### Smart Contracts (Solidity + Hardhat)
- **Framework**: Hardhat
- **Networks**: Ethereum Sepolia, Polygon Mumbai, Arbitrum Sepolia
- **Contracts**: HTLC, Oracle, Executor, MockERC20

#### AI Services
- **OpenAI GPT-4**: Natural language command parsing
- **Hugging Face**: Alternative AI processing
- **Command Parser**: Custom swap command interpretation

## 📂 Directory Structure

### `/src` - Main Application Code

#### `/src/components/` - React Components
- **AIChat.tsx** - AI-powered chat interface for natural language swaps
- **AnimatedBackground.tsx** - Dynamic particle background effects
- **Dashboard.tsx** - System monitoring and statistics dashboard
- **Header.tsx** - Main navigation and wallet connection
- **NetworkSelector.tsx** - Multi-chain network selection
- **SmartContractIntegration.tsx** - Direct contract interaction interface
- **SwapInterface.tsx** - Main swap interface with token selection
- **TransactionProgress.tsx** - Real-time transaction tracking
- **WalletConnect.tsx** - Wallet connection management

#### `/src/components/ui/` - Reusable UI Components
- **accordion.tsx** - Collapsible content sections
- **alert-dialog.tsx** - Confirmation dialogs
- **badge.tsx** - Status and label badges
- **button.tsx** - Button components with variants
- **card.tsx** - Card layout components
- **dialog.tsx** - Modal dialogs
- **form.tsx** - Form components with validation
- **input.tsx** - Input field components
- **progress.tsx** - Progress indicators
- **toast.tsx** - Notification system
- **tooltip.tsx** - Hover tooltips

#### `/src/contexts/` - React Context Providers
- **WalletContext.tsx** - Global wallet state management

#### `/src/hooks/` - Custom React Hooks
- **use-mobile.tsx** - Mobile device detection
- **use-toast.ts** - Toast notification management
- **useWallet.ts** - Wallet connection and management

#### `/src/pages/` - Page Components
- **Index.tsx** - Main landing page
- **NotFound.tsx** - 404 error page

#### `/src/services/` - Business Logic Services

##### `/src/services/ai/` - AI Integration
- **gpt4Service.ts** - OpenAI GPT-4 integration for natural language processing
- **huggingFaceService.ts** - Hugging Face AI model integration
- **swapParser.ts** - Custom command parsing for swap operations

##### `/src/services/api/` - External API Integration
- **oneinch.ts** - 1inch DEX aggregator API integration

##### `/src/services/contracts/` - Smart Contract Integration
- **contractService.ts** - Main contract interaction service
- **types.ts** - TypeScript interfaces for contract data

##### `/src/services/transactionMonitor.ts` - Transaction Tracking
- Real-time transaction monitoring and status updates

##### `/src/services/wallets/` - Wallet Integration
- **ethereum.ts** - MetaMask and Ethereum wallet integration
- **stellar.ts** - Freighter and Stellar wallet integration

#### `/src/types/` - TypeScript Type Definitions
- **wallet.ts** - Wallet provider interfaces

#### `/src/lib/` - Utility Functions
- **utils.ts** - Common utility functions

### `/contracts` - Smart Contracts

#### Core Contracts
- **SwapSageHTLC.sol** - Hash Time Locked Contract for cross-chain swaps
- **SwapSageOracle.sol** - Price oracle for token valuations
- **SwapSageExecutor.sol** - Swap execution contract
- **MockERC20.sol** - Test token for development

### `/scripts` - Deployment Scripts
- **deploy.js** - Basic contract deployment
- **deploy-testnet.js** - Testnet deployment with verification
- **deploy-with-verification.js** - Production deployment with contract verification

### `/test` - Test Files
- **SwapSage.test.js** - Smart contract unit tests
- **integration.test.js** - Integration tests

## 🔧 Key Features

### 🤖 AI-Powered Interface
- **Natural Language Processing**: Users can describe swaps in plain English
- **Multi-Language Support**: Supports multiple languages for global users
- **Smart Command Parsing**: Automatically extracts swap parameters from text
- **Confidence Scoring**: AI provides confidence levels for parsed commands

### 🔗 Cross-Chain Swapping
- **Multi-Network Support**: Ethereum, Polygon, Arbitrum, Stellar
- **HTLC Implementation**: Secure cross-chain atomic swaps
- **Bridge Integration**: Seamless token bridging between chains
- **Real-time Monitoring**: Live transaction tracking across networks

### 💰 DEX Aggregation
- **1inch Integration**: Best price routing across multiple DEXs
- **Slippage Protection**: Configurable slippage tolerance
- **Gas Optimization**: Smart gas estimation and optimization
- **Price Feeds**: Real-time price data from multiple sources

### 🔐 Security Features
- **HTLC Security**: Time-locked contracts for secure cross-chain swaps
- **Oracle Verification**: Multiple price feed verification
- **Transaction Monitoring**: Real-time transaction status tracking
- **Error Handling**: Comprehensive error handling and recovery

### 🎨 User Experience
- **Modern UI**: Beautiful, responsive interface with animations
- **Real-time Updates**: Live dashboard with system statistics
- **Transaction Progress**: Step-by-step transaction tracking
- **Mobile Responsive**: Optimized for mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or Freighter wallet
- 1inch API key (optional)
- OpenAI API key (optional)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Smart Contract Deployment
```bash
npx hardhat compile
npx hardhat run scripts/deploy-testnet.js --network sepolia
```

## 🔗 External Integrations

### APIs
- **1inch API**: DEX aggregation and swap execution
- **OpenAI API**: Natural language processing
- **Hugging Face API**: Alternative AI processing

### Blockchains
- **Ethereum Sepolia**: Testnet for Ethereum
- **Polygon Mumbai**: Testnet for Polygon
- **Arbitrum Sepolia**: Testnet for Arbitrum
- **Stellar Testnet**: Testnet for Stellar

### Wallets
- **MetaMask**: Ethereum wallet integration
- **Freighter**: Stellar wallet integration

## 📊 System Architecture

### Frontend Layer
```
React Components → Context Providers → Service Layer → External APIs
```

### Smart Contract Layer
```
HTLC Contract ← Oracle Contract ← Executor Contract
```

### AI Processing Layer
```
User Input → AI Service → Command Parser → Swap Execution
```

## 🛠️ Development Tools

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Type safety and development experience
- **Prettier**: Code formatting

### Testing
- **Hardhat**: Smart contract testing framework
- **Jest**: Unit testing framework

### Build Tools
- **Vite**: Fast development and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components

## 📈 Performance Features

### Optimization
- **Lazy Loading**: Component and route lazy loading
- **Code Splitting**: Automatic code splitting for better performance
- **Caching**: API response caching
- **Real-time Updates**: WebSocket-like polling for live data

### Monitoring
- **Transaction Tracking**: Real-time transaction status
- **System Health**: Dashboard with system statistics
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Load times and user interaction tracking

## 🔮 Future Enhancements

### Planned Features
- **More Blockchains**: Support for additional networks
- **Advanced AI**: More sophisticated natural language processing
- **DeFi Integration**: Yield farming and liquidity provision
- **Mobile App**: Native mobile application
- **Social Features**: User profiles and social trading

### Technical Improvements
- **Layer 2 Scaling**: Optimistic rollups and sidechains
- **Zero-Knowledge Proofs**: Privacy-preserving transactions
- **Cross-Chain Messaging**: Advanced cross-chain communication
- **Automated Market Making**: AMM integration

## 📚 Documentation

### API Documentation
- **1inch API**: DEX aggregation endpoints
- **Smart Contracts**: Contract interfaces and functions
- **AI Services**: Natural language processing APIs

### User Guides
- **Getting Started**: First-time user setup
- **Wallet Connection**: Connecting different wallets
- **Making Swaps**: Step-by-step swap instructions
- **Troubleshooting**: Common issues and solutions

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write comprehensive tests
- Document new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Issues
- Report bugs via GitHub Issues
- Request features through feature requests
- Ask questions in discussions

### Community
- Join our Discord server
- Follow us on Twitter
- Read our blog for updates

---

*This index provides a comprehensive overview of the SwapSage AI project structure, features, and development guidelines.* # #   P r o j e c t   O v e r v i e w 
 
 
## Key Features
- AI-powered natural language processing for swaps
- Cross-chain token swapping
- Multi-wallet support (MetaMask, Freighter)
- Real-time transaction monitoring
- Modern React UI with Tailwind CSS

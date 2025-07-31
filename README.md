# SwapSage AI Oracle

A sophisticated DeFi application that combines AI-powered natural language processing with real-time blockchain interactions for seamless cross-chain token swaps.

## 🚀 Features

### 🤖 AI-Powered Interface
- **Natural Language Processing**: Chat with AI to execute swaps using plain English
- **Multi-language Support**: Works in English, Spanish, French, Japanese, and Chinese
- **Real Hugging Face Integration**: Enhanced AI responses with smart local fallback
- **Intelligent Command Parsing**: Automatically extracts swap parameters from natural language
- **Smart Local Processing**: Works even without API keys using intelligent local parsing

### 💱 Real-Time Trading
- **1inch API Integration**: Real-time swap quotes and optimal routing
- **Cross-Chain Support**: Ethereum and Stellar blockchain integration
- **Live Price Feeds**: Real-time token prices via Chainlink oracles
- **Smart Contract Execution**: Direct blockchain interactions for secure swaps
- **Auto-Quote Calculation**: Automatic quote updates when tokens or amounts change

### 🔒 Advanced Security
- **HTLC (Hash Time Lock Contracts)**: Atomic cross-chain swaps
- **Real Transaction Monitoring**: Live tracking of all blockchain transactions
- **Smart Contract Integration**: Deployed contracts for secure operations
- **Wallet Security**: MetaMask and Freighter wallet integration
- **Global Wallet Context**: Secure state management across all components

### 📊 Real-Time Monitoring
- **Transaction Tracking**: Monitor swap status in real-time
- **HTLC Status Updates**: Track atomic swap progress
- **Network Status**: Live blockchain network information
- **Gas Price Estimation**: Real-time gas price monitoring
- **Balance Auto-Refresh**: Real-time wallet balance updates

### 🎨 Enhanced UI/UX
- **Animated Background**: Dynamic particle effects and floating orbs
- **Smooth Animations**: CSS transitions and hover effects
- **Responsive Design**: Works perfectly on all devices
- **Dark Theme**: Modern dark interface with neon accents
- **Intuitive Navigation**: Tabbed interface for easy access to all features

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Context API (WalletContext)
- **Blockchain**: Ethers.js v6, Hardhat, Solidity
- **AI**: Hugging Face API, Natural Language Processing
- **APIs**: 1inch Aggregation Protocol, Chainlink Price Feeds
- **Wallets**: MetaMask, Freighter (Stellar)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MetaMask or Freighter wallet
- 1inch API key (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkakpoErnest/SwapSage-ai.git
   cd SwapSage-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   VITE_1INCH_API_KEY=your_1inch_api_key_here
   VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8082`

## 🔧 Configuration

### API Keys Setup

#### 1inch API (Required)
1. Visit [1inch Portal](https://portal.1inch.dev/)
2. Sign up for a free account
3. Create a new API key
4. Add to `.env.local`: `VITE_1INCH_API_KEY=your_key`

#### Hugging Face API (Optional)
1. Visit [Hugging Face](https://huggingface.co/settings/tokens)
2. Create a free account
3. Generate an API token
4. Add to `.env.local`: `VITE_HUGGINGFACE_API_KEY=your_token`

### Smart Contract Deployment

1. **Deploy to local network**
   ```bash
   npm run deploy:local
   ```

2. **Deploy to Sepolia testnet**
   ```bash
   npm run deploy:sepolia
   ```

3. **Deploy to Polygon**
   ```bash
   npm run deploy:polygon
   ```

## 💡 Usage

### AI Chat Interface
Simply type your swap request in natural language:
- "I want to swap 1 ETH to USDC"
- "Bridge 100 USDC to Stellar"
- "What's the current price of ETH?"
- "Show me my balances"
- "Hello" - Get a friendly greeting
- "Help" - See available commands

### Manual Swap Interface
1. **Connect Wallet**: Click "Connect Wallet" in the top-right corner
2. **Select Network**: Choose Ethereum or Stellar
3. **Select Tokens**: Choose source and destination tokens
4. **Enter Amount**: Input the amount you want to swap
5. **Review Quote**: Check the auto-calculated quote
6. **Execute Swap**: Click "Execute Swap" to complete the transaction

### Cross-Chain Swaps
1. Select tokens from different chains
2. AI will automatically suggest the best bridge route
3. Execute atomic swap via HTLC contracts

## 🔍 Real-Time Features

### Transaction Monitoring
- Live transaction status updates
- Confirmation tracking
- Gas price monitoring
- HTLC swap progress
- Real-time balance updates

### Price Feeds
- Real-time token prices
- Cross-chain price comparison
- Oracle integration
- Market data analysis
- Auto-refresh on network changes

### Network Status
- Blockchain network health
- Gas price estimation
- Network congestion monitoring
- RPC endpoint status
- Wallet connection status

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Smart Contract Tests
```bash
npx hardhat test
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run compile` - Compile smart contracts
- `npm run deploy:local` - Deploy to local network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run clean` - Clean build artifacts
- `npm run verify` - Verify contracts on Etherscan

## 🌐 Live Demo

Visit the live application: [SwapSage AI Oracle](https://swapsage-ai.vercel.app)

## 🎯 Key Improvements

### Latest Updates
- **WalletContext Implementation**: Global wallet state management
- **Real API Integration**: All mock data replaced with live 1inch API calls
- **Enhanced AI Service**: Smart fallback to local processing
- **Improved UI/UX**: Better animations and responsive design
- **Debug Information**: Enhanced troubleshooting capabilities
- **Auto-Quote Calculation**: Real-time quote updates
- **Balance Integration**: Real wallet balance display

### Technical Enhancements
- **Ethers.js v6 Compatibility**: Updated to latest version
- **TypeScript Improvements**: Better type safety and error handling
- **Component Architecture**: Modular and reusable components
- **Error Handling**: Comprehensive error management
- **Performance Optimization**: Efficient state management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the code comments and inline documentation
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join the community discussions

## 🔮 Roadmap

- [ ] Additional blockchain support (Polygon, BSC, Avalanche)
- [ ] Advanced AI features (portfolio optimization, risk analysis)
- [ ] Mobile app development
- [ ] Institutional features
- [ ] Advanced analytics dashboard
- [ ] Multi-wallet support
- [ ] Advanced trading features

---

**Built with ❤️ for the DeFi community**

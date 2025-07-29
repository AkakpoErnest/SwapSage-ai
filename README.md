# SwapSage AI Oracle

The first AI-powered cross-chain DeFi assistant. Simply tell us what you want to swap and we'll handle the complex routing across Ethereum, Stellar, and beyond.

## 🚀 Features

- **AI-Powered Swaps**: Natural language processing for swap commands
- **Cross-Chain Support**: Ethereum, Stellar, and more
- **1inch Integration**: Best swap rates using 1inch Aggregation API
- **Atomic Swaps**: Secure Hash Time Lock Contracts (HTLC)
- **Modern UI**: Beautiful futuristic DeFi interface

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask wallet (for Ethereum)
- Freighter wallet (for Stellar)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd swapsage-ai-oracle
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` and add your API keys:
- Get a 1inch API key from [1inch.dev](https://1inch.dev/)
- Add your preferred RPC endpoints

4. Start the development server:
```bash
npm run dev
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── AIChat.tsx      # AI chat interface
│   ├── SwapInterface.tsx # Manual swap interface
│   └── WalletConnect.tsx # Wallet connection
├── services/           # API and wallet services
│   ├── ai/            # AI parsing logic
│   ├── api/           # External API integrations
│   └── wallets/       # Wallet integrations
├── hooks/             # Custom React hooks
└── pages/             # Page components
```

## ⚠️ Known Issues

### Current Limitations

1. **Mock Data**: The app currently uses mock data for:
   - 1inch API responses (when API key is not configured)
   - Stellar SDK integration
   - Cross-chain bridge operations

2. **TypeScript Errors**: Some wallet provider types are not fully typed

3. **Missing Features**:
   - Real HTLC implementation
   - Actual cross-chain bridge integration
   - Transaction monitoring
   - Real-time price feeds

### Security Notes

- This is a demo/prototype application
- Do not use with real funds without proper security audits
- API keys should be kept secure and not committed to version control

## 🎨 Design System

The app uses a custom futuristic DeFi theme with:
- Dark space background with neon accents
- Custom CSS variables for consistent theming
- Responsive design with Tailwind CSS
- shadcn/ui component library

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

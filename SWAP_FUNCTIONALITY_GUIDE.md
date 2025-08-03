# SwapSage AI Oracle - Swap Functionality Guide

## Overview

SwapSage AI Oracle provides a comprehensive swapping solution with three main features:

1. **Live Polygon Price Feeds** - Real-time cryptocurrency price data
2. **Polygon Swap Quotes** - Get instant swap quotes using 1inch Fusion
3. **Atomic Cross-Chain Swaps** - Secure cross-chain swaps using HTLC protocol

## Features

### 🔥 Live Polygon Price Feeds

- **Real-time Updates**: Prices update automatically with timestamp
- **Multiple Tokens**: Support for MATIC, USDC, DAI, USDT, and ETH
- **Refresh Button**: Manual price refresh capability
- **Polygon Oracle**: Powered by decentralized oracle data

**How to Use:**
1. Select your desired token from the dropdown
2. View the current price in USD
3. Click "Refresh" to get the latest price
4. Monitor the "Last updated" timestamp

### ⚡ Polygon Swap Quotes

- **1inch Fusion Integration**: Get the best swap rates across multiple DEXs
- **Instant Quotes**: Real-time price quotes with gas estimates
- **Multiple Tokens**: Swap between MATIC, USDC, DAI, USDT, ETH, and XLM
- **Demo Mode**: Works without API keys for testing

**How to Use:**
1. Enter the amount you want to swap
2. Select the token you want to swap from
3. Click "Get Quote" to see estimated output
4. View gas estimates and protocols used
5. See the exchange rate and fees

**Demo Mode Features:**
- Works without 1inch API key
- Uses realistic mock data
- Simulates real swap behavior
- Perfect for testing and development

### 🔒 Atomic Cross-Chain Swaps

- **HTLC Protocol**: Secure atomic swaps with zero counterparty risk
- **Cross-Chain**: Swap between Polygon and Stellar networks
- **Real-time Status**: Track swap progress and completion
- **Transaction History**: View all swap transactions

**How to Use:**
1. Connect your wallet (MetaMask required)
2. Enter the amount for cross-chain swap
3. Select the source token
4. Click "Initiate Atomic Swap"
5. Monitor the swap status in real-time

**Security Features:**
- Hash Time Lock Contracts (HTLC)
- Atomic execution (all-or-nothing)
- No third-party custody
- Automatic refund if conditions not met

## Technical Implementation

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Swap Service  │    │   Blockchain    │
│                 │    │                 │    │                 │
│ • React/TS      │◄──►│ • 1inch API     │◄──►│ • Polygon       │
│ • Tailwind CSS  │    │ • HTLC Bridge   │    │ • Stellar       │
│ • Wallet Connect│    │ • Price Feeds   │    │ • Smart Contracts│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

1. **EnhancedSwapInterface.tsx**
   - Main swap interface component
   - Handles all swap interactions
   - Real-time state management
   - Error handling and validation

2. **oneinch.ts Service**
   - 1inch API integration
   - Swap quote generation
   - Token price fetching
   - Demo mode support

3. **crossChainBridge.ts Service**
   - HTLC swap implementation
   - Cross-chain coordination
   - Swap status tracking
   - Transaction management

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
# 1inch API Key (Required for real swaps)
VITE_1INCH_API_KEY=your_1inch_api_key_here

# Stellar Network (testnet/mainnet)
VITE_STELLAR_NETWORK=testnet

# App Configuration
VITE_APP_NAME=SwapSage AI Oracle
VITE_APP_ENVIRONMENT=development
```

## Demo Mode

The application runs in demo mode by default, which means:

- ✅ No API keys required
- ✅ Mock data for testing
- ✅ Full UI functionality
- ✅ Realistic swap simulation
- ✅ Perfect for development

To enable real swaps:
1. Get a free 1inch API key from https://portal.1inch.dev/
2. Add it to your `.env.local` file
3. Restart the development server

## Error Handling

The swap interface includes comprehensive error handling:

- **Validation Errors**: Invalid amounts, missing fields
- **Network Errors**: Connection issues, API failures
- **Wallet Errors**: Connection problems, insufficient funds
- **User Feedback**: Clear error messages and recovery suggestions

## Testing

Run the swap functionality test:

```bash
node test-swap-functionality.js
```

This will verify:
- Environment configuration
- Component availability
- Quote generation
- Swap initiation
- Error handling

## Troubleshooting

### Common Issues

1. **"Please connect your wallet"**
   - Install MetaMask browser extension
   - Connect MetaMask to the site
   - Ensure you're on a supported network (Polygon)

2. **"Failed to get swap quote"**
   - Check your internet connection
   - Verify 1inch API key (if using real mode)
   - Try refreshing the page

3. **"Amount must be greater than 0"**
   - Enter a valid positive number
   - Check for decimal point issues
   - Ensure proper token selection

4. **"Please fill in all fields"**
   - Complete all required input fields
   - Select both source and destination tokens
   - Enter a valid swap amount

### Performance Tips

- Use demo mode for development and testing
- Connect to Polygon network for best performance
- Keep MetaMask unlocked during swaps
- Monitor gas prices for optimal timing

## Security Considerations

- **HTLC Protocol**: Ensures atomic execution
- **No Private Keys**: Never stored in the application
- **MetaMask Integration**: Uses secure wallet connection
- **Demo Mode**: Safe for testing without real funds

## Future Enhancements

- [ ] Support for additional chains (Arbitrum, Optimism)
- [ ] Advanced order types (limit orders, stop-loss)
- [ ] Portfolio tracking and analytics
- [ ] Mobile app development
- [ ] DeFi protocol integrations

## Support

For technical support or questions:
- Check the console for error messages
- Review the network tab for API calls
- Test with demo mode first
- Verify wallet connection and network

---

**SwapSage AI Oracle** - Making DeFi accessible through AI-powered cross-chain swapping. 
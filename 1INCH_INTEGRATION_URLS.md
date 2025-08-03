# 1inch Integration URLs - SwapSage AI Oracle

## Repository
- **Main Repository**: https://github.com/AkakpoErnest/SwapSage-ai

## Core 1inch Integration Files

### 1. Main 1inch API Service
- **File**: `src/services/api/oneinch.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/api/oneinch.ts
- **Description**: Primary 1inch API integration with getTokens(), getSwapQuote(), getTokenPrice(), and createFusionOrder() methods

### 2. Bridge Integration with 1inch
- **File**: `src/services/bridge/polygonStellarBridge.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/bridge/polygonStellarBridge.ts
- **Description**: Contains get1inchFusionQuote() method and uses 1inch for optimal routing in cross-chain swaps

### 3. Swap Interface Components
- **File**: `src/components/EnhancedSwapInterface.tsx`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/components/EnhancedSwapInterface.tsx
- **Description**: Enhanced swap interface that integrates with 1inch API

- **File**: `src/components/SwapInterface.tsx`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/components/SwapInterface.tsx
- **Description**: Basic swap interface component

### 4. Swap Execution Service
- **File**: `src/services/swapExecution.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/swapExecution.ts
- **Description**: Handles swap execution using 1inch quotes and routes

### 5. Test Files
- **File**: `scripts/test-1inch-live.js`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/scripts/test-1inch-live.js
- **Description**: Live testing script for 1inch API integration

### 6. Type Definitions
- **File**: `src/services/bridge/types.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/bridge/types.ts
- **Description**: Contains TypeScript interfaces for 1inch API responses

## Key 1inch Features Implemented

### API Endpoints Used
- **Tokens API**: Get supported tokens and metadata
- **Swap Quote API**: Get optimal swap routes and quotes
- **Token Price API**: Get real-time token prices
- **Fusion API**: Create MEV-protected cross-chain orders

### Supported Chains
- Ethereum Mainnet (Chain ID: 1)
- Polygon Mainnet (Chain ID: 137)
- Sepolia Testnet (Chain ID: 11155111)
- Mumbai Testnet (Chain ID: 80001)

### Integration Features
- CORS proxy rotation for API reliability
- Fallback mechanisms for API failures
- MEV protection via Fusion orders
- Real-time price feeds
- Optimal routing across multiple DEXs

## Usage Examples

### Getting Swap Quote
```typescript
const quote = await oneInchAPI.getSwapQuote(
  chainId,
  fromTokenAddress,
  toTokenAddress,
  amount,
  fromAddress,
  slippage
);
```

### Creating Fusion Order
```typescript
const fusionOrder = await oneInchAPI.createFusionOrder(
  fromChainId,
  toChainId,
  fromToken,
  toToken,
  amount,
  fromAddress,
  toAddress
);
```

### Getting Token Price
```typescript
const price = await oneInchAPI.getTokenPrice(chainId, tokenAddress);
```

## Environment Configuration
```env
VITE_1INCH_API_KEY=your_1inch_api_key_here
```

## Documentation
- **1inch API Documentation**: https://docs.1inch.dev/
- **Fusion Protocol**: https://1inch.io/assets/1inch-fusion-plus.pdf 
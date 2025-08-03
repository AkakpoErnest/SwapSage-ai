# Stellar Integration URLs - SwapSage AI Oracle

## Repository
- **Main Repository**: https://github.com/AkakpoErnest/SwapSage-ai

## Core Stellar Integration Files

### 1. Main Bridge Service with Stellar
- **File**: `src/services/bridge/polygonStellarBridge.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/bridge/polygonStellarBridge.ts
- **Description**: Main bridge logic for Polygon ↔ Stellar atomic swaps, includes Stellar account creation, HTLC implementation, and cross-chain coordination

### 2. Stellar Service
- **File**: `src/services/stellar/stellarService.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/stellar/stellarService.ts
- **Description**: Core Stellar SDK operations, account management, HTLC creation, and payment processing

### 3. Stellar Wallet Integration
- **File**: `src/services/wallets/stellar.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/wallets/stellar.ts
- **Description**: Stellar wallet connection and management using Freighter wallet

### 4. Bridge Types
- **File**: `src/services/bridge/types.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/bridge/types.ts
- **Description**: TypeScript interfaces for Stellar operations and cross-chain swap types

### 5. Bridge Interface Component
- **File**: `src/components/BridgeInterface.tsx`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/components/BridgeInterface.tsx
- **Description**: User interface for cross-chain swaps between Polygon and Stellar

### 6. Transaction Progress Component
- **File**: `src/components/TransactionProgress.tsx`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/components/TransactionProgress.tsx
- **Description**: Shows Stellar transaction status and progress

### 7. Wallet Context
- **File**: `src/contexts/WalletContext.tsx`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/contexts/WalletContext.tsx
- **Description**: Manages Stellar wallet state and connection

### 8. Wallet Hooks
- **File**: `src/hooks/useWallet.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/hooks/useWallet.ts
- **Description**: Stellar wallet connection hooks and utilities

### 9. Cross-Chain Bridge Configuration
- **File**: `src/services/bridge/realCrossChainBridge.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/bridge/realCrossChainBridge.ts
- **Description**: Production bridge configuration for Stellar integration

### 10. Bridge Abstraction Layer
- **File**: `src/services/bridge/crossChainBridge.ts`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/src/services/bridge/crossChainBridge.ts
- **Description**: Bridge abstraction layer for Stellar operations

### 11. Stellar Mainnet Setup Script
- **File**: `scripts/setup-stellar-mainnet.js`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/scripts/setup-stellar-mainnet.js
- **Description**: Script to setup Stellar mainnet configuration

### 12. Stellar Keypair Generation Script
- **File**: `scripts/generate-stellar-keypair.js`
- **URL**: https://github.com/AkakpoErnest/SwapSage-ai/blob/main/scripts/generate-stellar-keypair.js
- **Description**: Script to generate Stellar keypairs for testing

## Key Stellar Features Implemented

### Stellar SDK Integration
- **Account Creation**: Automatic Stellar account generation and funding
- **HTLC Implementation**: Hash Time Lock Contracts using Stellar claimable balances
- **Payment Processing**: Native Stellar payment operations
- **Network Configuration**: Support for both testnet and mainnet

### Cross-Chain Bridge Features
- **Atomic Swaps**: Secure cross-chain token transfers
- **Account Management**: Automatic wallet creation for new users
- **Transaction Monitoring**: Real-time status tracking
- **Error Handling**: Comprehensive error management

### Stellar Network Features
- **Fast Settlement**: 3-5 second transaction times
- **Low Fees**: Minimal transaction costs
- **Built-in DEX**: Native decentralized exchange functionality
- **Multi-asset Support**: Native token and asset support

## Usage Examples

### Creating Stellar Account
```typescript
const stellarWallet = await stellarService.createAccount('1.0');
console.log('New Stellar account:', stellarWallet.publicKey);
```

### Creating Stellar HTLC
```typescript
const stellarHTLC = await stellarService.createHTLC(
  sourceAccount,
  destinationAccount,
  'XLM',
  amount,
  hashlock,
  timelock
);
```

### Sending Stellar Payment
```typescript
const payment = await stellarService.sendPayment(
  fromAccount,
  toAccount,
  'XLM',
  amount,
  memo
);
```

### Bridge Account Management
```typescript
const bridgeInfo = await polygonStellarBridge.getBridgeAccountInfo();
const fundingTx = await polygonStellarBridge.fundBridgeAccount('10.0');
```

## Environment Configuration
```env
# Stellar Network Configuration
VITE_STELLAR_NETWORK=PUBLIC  # or TESTNET
VITE_STELLAR_BRIDGE_SECRET_KEY=your_stellar_bridge_secret_key_here

# Stellar Server URLs
VITE_STELLAR_HORIZON_URL=https://horizon.stellar.org
VITE_STELLAR_TESTNET_URL=https://horizon-testnet.stellar.org
```

## Stellar Network Configuration

### Mainnet Configuration
- **Horizon Server**: https://horizon.stellar.org
- **Network Passphrase**: Public Global Stellar Network ; September 2015
- **Base Fee**: 100 stroops (0.00001 XLM)

### Testnet Configuration
- **Horizon Server**: https://horizon-testnet.stellar.org
- **Network Passphrase**: Test SDF Network ; September 2015
- **Base Fee**: 100 stroops (0.00001 XLM)

## Documentation
- **Stellar Developer Docs**: https://developers.stellar.org/
- **Stellar SDK Documentation**: https://stellar.github.io/js-stellar-sdk/
- **Stellar Smart Contracts**: https://developers.stellar.org/docs/build/smart-contracts/getting-started
- **Stellar Account Model**: https://developers.stellar.org/docs/fundamentals-and-concepts/stellar-data-structures/accounts

## Key Challenges Solved

### Account Activation
- **Problem**: Stellar accounts require minimum 1 XLM balance for activation
- **Solution**: Bridge account automatically funds new user accounts

### HTLC Implementation
- **Problem**: Implementing atomic swaps on non-EVM blockchain
- **Solution**: Used Stellar's native claimable balances with hash predicates

### Cross-Chain Coordination
- **Problem**: Coordinating swaps between EVM and non-EVM chains
- **Solution**: Implemented sophisticated bridge logic with fallback mechanisms

### Transaction Monitoring
- **Problem**: Tracking transactions across different blockchain architectures
- **Solution**: Real-time monitoring with status updates and error handling 
# Testnet Setup Guide - Fixing 1inch API Issues

## The Problem
You're absolutely right! **1inch API has limited support for testnets**. This is a common issue because:

1. **1inch API primarily supports mainnet** (Ethereum, Polygon, BSC)
2. **Testnet support is limited** - Sepolia and Mumbai have restricted functionality
3. **Token liquidity is low** on testnets, so swap quotes often fail

## Solutions

### Option 1: Use Mainnet (Recommended for Real Testing)
1. **Switch to Ethereum Mainnet** in MetaMask
2. **Get real ETH** from a faucet or exchange
3. **Use real tokens** for testing

### Option 2: Use Demo Mode (Recommended for Development)
The app now automatically detects testnets and uses **demo mode**:
- ✅ **No API key required**
- ✅ **Simulated swap quotes**
- ✅ **Works on any network**
- ✅ **Perfect for UI testing**

### Option 3: Use Alternative Testnet DEXes
For real testnet swaps, consider:
- **Uniswap V3 on Sepolia**
- **PancakeSwap on BSC Testnet**
- **Local Hardhat fork**

## Current Fixes Applied

### ✅ **Network Detection**
- App now detects your current network automatically
- Uses correct chain ID for API calls
- Falls back gracefully for unsupported networks

### ✅ **Testnet Support**
- Added Sepolia-specific token addresses
- Enhanced error handling for testnet limitations
- Automatic fallback to demo mode

### ✅ **Better Error Messages**
- Clear indication when using demo mode
- Detailed console logs for debugging
- Network-specific error handling

## Testing Your Setup

### 1. Check Current Network
```javascript
// In browser console
console.log('Current chain ID:', walletState.chainId);
console.log('Current network:', walletState.network);
```

### 2. Test Swap Functionality
1. **Connect wallet** (MetaMask)
2. **Select tokens** (ETH → USDC)
3. **Enter amount** (0.01)
4. **Check console** for detailed logs
5. **Verify quote** loads (real or demo)

### 3. Expected Behavior by Network

| Network | 1inch Support | Fallback Mode | Status |
|---------|---------------|---------------|---------|
| Ethereum Mainnet | ✅ Full | ❌ | Real quotes |
| Sepolia Testnet | ⚠️ Limited | ✅ Demo | Simulated quotes |
| Polygon Mainnet | ✅ Full | ❌ | Real quotes |
| Mumbai Testnet | ⚠️ Limited | ✅ Demo | Simulated quotes |

## Console Logs to Watch For

### ✅ Working Demo Mode
```
Using chain ID: 11155111 for swap quote
Using fallback mode - no valid 1inch API key found
```

### ⚠️ Testnet Limitations
```
Testnet 11155111 may have limited 1inch support, using fallback tokens
```

### ❌ API Issues
```
Failed to get swap quote: 404 Not Found
```

## Next Steps

1. **Test the current setup** - should work with demo mode
2. **Switch to mainnet** if you want real quotes
3. **Get API key** for full functionality
4. **Deploy contracts** to testnet for cross-chain testing

## Quick Test Commands

```bash
# Check if app is running
curl http://localhost:8080

# Check network status
lsof -i :8080

# View logs
tail -f ~/.npm/_logs/*.log
```

The app should now work properly on testnets with demo mode! 🚀 
# 🌟 Stellar Network Configuration Guide

## Overview

SwapSage AI supports both **Stellar Mainnet** and **Stellar Testnet** for cross-chain swaps. This guide explains the differences and how to configure them properly.

## 🌐 Network Options

### **Stellar Mainnet** (Production)
- **Purpose**: Real transactions with actual value
- **XLM**: Real Stellar Lumens with market value
- **Network Passphrase**: `Public Global Stellar Network ; September 2015`
- **Horizon Server**: `https://horizon.stellar.org`
- **Use Case**: Production swaps, real trading

### **Stellar Testnet** (Development)
- **Purpose**: Testing and development
- **XLM**: Test XLM with no real value
- **Network Passphrase**: `Test SDF Network ; September 2015`
- **Horizon Server**: `https://horizon-testnet.stellar.org`
- **Use Case**: Development, testing, learning

## ⚙️ Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# Stellar Network Selection
VITE_STELLAR_NETWORK=testnet  # or 'mainnet'

# Stellar Bridge Account (Optional)
VITE_STELLAR_BRIDGE_SECRET_KEY=your_secret_key_here
```

### Network Selection

```typescript
// In your .env.local file
VITE_STELLAR_NETWORK=testnet    # For development
VITE_STELLAR_NETWORK=mainnet    # For production
```

## 🔧 Setup Instructions

### For Development (Testnet)

1. **Set Network to Testnet**:
   ```bash
   VITE_STELLAR_NETWORK=testnet
   ```

2. **Get Test XLM**:
   - Visit: https://laboratory.stellar.org/#account-creator
   - Create a test account
   - Fund with test XLM (free)

3. **Configure Freighter Wallet**:
   - Install Freighter extension
   - Switch to Testnet in settings
   - Import your test account

### For Production (Mainnet)

1. **Set Network to Mainnet**:
   ```bash
   VITE_STELLAR_NETWORK=mainnet
   ```

2. **Get Real XLM**:
   - Purchase XLM from exchanges
   - Transfer to your Stellar wallet

3. **Configure Freighter Wallet**:
   - Install Freighter extension
   - Switch to Mainnet in settings
   - Import your mainnet account

## 🚀 Usage Examples

### Cross-Chain Swaps

```typescript
// Ethereum → Stellar (Mainnet)
const swapRequest = {
  fromChain: 'ethereum',
  fromToken: 'ETH',
  fromAmount: '1.0',
  toChain: 'stellar',
  toToken: 'XLM',
  recipientAddress: 'G...' // Stellar address
};

// Stellar → Ethereum (Testnet)
const testSwapRequest = {
  fromChain: 'stellar',
  fromToken: 'XLM',
  fromAmount: '100.0',
  toChain: 'ethereum',
  toToken: 'ETH',
  recipientAddress: '0x...' // Ethereum address
};
```

### AI Commands

```bash
# Testnet commands
"Bridge 100 test XLM to Ethereum"
"Swap 1 ETH to test XLM on Stellar"

# Mainnet commands
"Bridge 50 XLM to Ethereum"
"Swap 0.5 ETH to XLM on Stellar"
```

## 🔒 Security Considerations

### Testnet
- ✅ Safe for testing
- ✅ No real value at risk
- ✅ Free test tokens
- ❌ Not suitable for production

### Mainnet
- ⚠️ Real value transactions
- ⚠️ Requires careful testing
- ⚠️ Use small amounts initially
- ✅ Production-ready

## 🛠️ Troubleshooting

### Common Issues

1. **"Network Mismatch" Error**:
   ```bash
   # Check your environment variable
   echo $VITE_STELLAR_NETWORK
   
   # Ensure it matches your wallet network
   ```

2. **"Insufficient Balance" Error**:
   - **Testnet**: Get free XLM from laboratory.stellar.org
   - **Mainnet**: Purchase XLM from exchanges

3. **"Invalid Address" Error**:
   - Ensure you're using the correct network
   - Check address format (G... for Stellar)

### Debug Commands

```typescript
// Check current network
console.log('Stellar Network:', import.meta.env.VITE_STELLAR_NETWORK);

// Check wallet connection
console.log('Freighter Available:', window.freighter);

// Check account balance
const balance = await stellarService.getBalance(address);
console.log('Balance:', balance);
```

## 📊 Network Comparison

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| **XLM Value** | $0 (Test) | Real Market Value |
| **Transaction Cost** | Free | ~0.00001 XLM |
| **Speed** | ~3-5 seconds | ~3-5 seconds |
| **Security** | Test Environment | Production Security |
| **Use Case** | Development | Real Trading |

## 🎯 Best Practices

### Development Workflow

1. **Start with Testnet**:
   ```bash
   VITE_STELLAR_NETWORK=testnet
   ```

2. **Test thoroughly**:
   - Test all swap scenarios
   - Verify error handling
   - Check edge cases

3. **Move to Mainnet**:
   ```bash
   VITE_STELLAR_NETWORK=mainnet
   ```

4. **Start small**:
   - Use small amounts initially
   - Monitor transactions carefully
   - Gradually increase amounts

### Production Checklist

- [ ] Network set to `mainnet`
- [ ] Real XLM in wallet
- [ ] Freighter configured for mainnet
- [ ] Tested with small amounts
- [ ] Error handling verified
- [ ] Security measures in place

## 🔗 Useful Links

- **Stellar Laboratory**: https://laboratory.stellar.org/
- **Stellar Explorer**: https://stellar.expert/
- **Freighter Wallet**: https://www.freighter.app/
- **Stellar Documentation**: https://developers.stellar.org/

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your network configuration
3. Ensure wallet is properly connected
4. Check browser console for errors
5. Contact support with error details

---

**Remember**: Always test on testnet before using mainnet with real funds! 
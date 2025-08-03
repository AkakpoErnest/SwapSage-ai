# 🚀 SwapSage AI - Mainnet Deployment Guide

## 📋 Prerequisites

Before deploying to mainnet, you need to configure the following:

### 1. **Private Key** (Required)
You need a wallet with MATIC for deployment costs.

**⚠️ SECURITY WARNING: Never share your private key!**

```bash
# In your .env.local file, replace:
PRIVATE_KEY=your_wallet_private_key_here

# With your actual private key (0x followed by 64 hex characters):
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**How to get your private key:**
1. **MetaMask**: Account Details → Export Private Key
2. **Hardware Wallet**: Use a dedicated deployment wallet
3. **Test Wallet**: Create a new wallet for deployment only

### 2. **RPC URLs** (Required)
You need API keys for blockchain access.

#### **Option A: Alchemy (Recommended)**
1. Go to [Alchemy](https://www.alchemy.com/)
2. Create free account
3. Create new apps for Mainnet and Sepolia
4. Copy the HTTP URLs

```bash
# In your .env.local file:
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

#### **Option B: Infura**
1. Go to [Infura](https://infura.io/)
2. Create free account
3. Create new projects for Mainnet and Sepolia
4. Copy the endpoint URLs

```bash
# In your .env.local file:
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

### 3. **1inch API Key** (Already Configured ✅)
You already have this configured: `Wyfjpg5CDkOZfhK7lmKrVVgkkawHd28O`

### 4. **Polygonscan API Key** (Optional)
For contract verification:

1. Go to [Polygonscan](https://polygonscan.com/)
2. Create account
3. Go to API Keys section
4. Create new API key

```bash
# Add to your .env.local file:
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## 💰 Deployment Costs

### **Polygon Mainnet** (Recommended)
- **Total Cost**: ~0.007 MATIC (~$0.01-0.05 USD)
- **Oracle**: ~0.001 MATIC
- **HTLC**: ~0.002 MATIC  
- **Executor**: ~0.002 MATIC
- **SimpleHTLC**: ~0.001 MATIC
- **MockERC20**: ~0.001 MATIC

### **Ethereum Mainnet**
- **Total Cost**: ~0.05 ETH (~$100-200 USD)
- **Much more expensive, not recommended for initial deployment**

## 🚀 Deployment Steps

### **Step 1: Verify Configuration**
```bash
node scripts/setup-deployment.cjs
```

This should show all variables as "Configured" ✅

### **Step 2: Check Wallet Balance**
Ensure your wallet has at least 0.01 MATIC for deployment.

### **Step 3: Deploy Remaining Contracts**
```bash
npx hardhat run scripts/deploy-remaining-polygon.cjs --network polygon
```

This will deploy:
- ✅ SwapSageExecutor
- ✅ SimpleHTLC  
- ✅ MockERC20

### **Step 4: Verify Contracts** (Optional)
If you have a Polygonscan API key, contracts will be automatically verified.

### **Step 5: Update Environment Variables**
The deployment script will output the new contract addresses. Update your `.env.local`:

```bash
VITE_ORACLE_CONTRACT_ADDRESS=0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e
VITE_HTLC_CONTRACT_ADDRESS=0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb
VITE_EXECUTOR_CONTRACT_ADDRESS=<new_executor_address>
VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=<new_simple_htlc_address>
VITE_MOCK_TOKEN_ADDRESS=<new_mock_token_address>
```

## 🔄 Moving to Mainnet

### **1. Update Frontend Configuration**
The app will automatically detect mainnet and use real 1inch quotes.

### **2. Test with Real Tokens**
- Use real MATIC, USDC, USDT, DAI on Polygon
- Real XLM on Stellar mainnet
- Real swap quotes from 1inch API

### **3. Update README**
The README will be automatically updated with new contract addresses.

## 📊 Current Deployment Status

### **✅ Already Deployed (Polygon Mainnet)**
- **SwapSageOracle**: `0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e`
- **SwapSageHTLC**: `0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb`

### **❌ Still Need to Deploy**
- **SwapSageExecutor**: Pending
- **SimpleHTLC**: Pending
- **MockERC20**: Pending

### **✅ Fully Deployed (Sepolia Testnet)**
- **SwapSageOracle**: `0xc6e0eF2453f08C0fbeC4b6a038d23f4D3A00E1B1`
- **SwapSageHTLC**: `0xd7c66D8B635152709fbe14E72eF91C9417391f37`
- **SwapSageExecutor**: `0x9209383Dd4fce1bF82aA26c6476Bbf795d1DfF48`
- **MockERC20**: `0xE560De00F664dE3C0B3815dd1AF4b6DF64123563`

## 🎯 Expected Results

After successful deployment, you'll have:

### **Full Mainnet Functionality**
- ✅ Real 1inch API quotes
- ✅ Real token swaps on Polygon
- ✅ Cross-chain swaps to Stellar
- ✅ AI-powered interface
- ✅ HTLC atomic swap security

### **Contract Addresses**
All contracts will be deployed and verified on Polygonscan.

### **Environment Ready**
Frontend will automatically use mainnet configuration.

## 🔒 Security Checklist

- [ ] Private key is secure and not committed to git
- [ ] Using dedicated deployment wallet
- [ ] Sufficient MATIC balance for deployment
- [ ] RPC URLs are properly configured
- [ ] Contracts will be verified on Polygonscan
- [ ] Tested on testnet first

## 🆘 Troubleshooting

### **"Private key too short" Error**
- Ensure private key starts with `0x` and is 66 characters total
- Check for extra spaces or newlines

### **"Insufficient balance" Error**
- Add more MATIC to your wallet
- Check current gas prices

### **"Network not found" Error**
- Ensure you're connected to Polygon mainnet (Chain ID 137)
- Check RPC URL configuration

### **"Contract verification failed" Error**
- This is optional and doesn't affect functionality
- Can be done manually on Polygonscan later

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the deployment logs
3. Verify your environment configuration
4. Check Polygonscan for transaction status

---

**Ready to deploy? Run the setup script first:**
```bash
node scripts/setup-deployment.cjs
``` 
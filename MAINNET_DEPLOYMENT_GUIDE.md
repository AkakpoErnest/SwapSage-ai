# Mainnet Deployment Guide - SwapSage AI Oracle

## **🚀 Prerequisites**

### **1. Required ETH Balance**
- **Minimum:** 0.3 ETH ($660+ USD)
- **Recommended:** 0.5 ETH ($1,100+ USD)
- **Estimated Cost:** $200-500 USD

### **2. Required API Keys**
- **Alchemy API Key** - For mainnet RPC
- **Etherscan API Key** - For contract verification
- **1inch API Key** - For real swap quotes

### **3. Required Tools**
- **MetaMask** or other Web3 wallet
- **Private key** from your wallet
- **Node.js** and npm installed

## **📋 Step-by-Step Deployment**

### **Step 1: Get Required API Keys**

#### **Alchemy API Key (Required)**
1. Go to [Alchemy](https://www.alchemy.com/)
2. Sign up and create a new app
3. Select "Ethereum" and "Mainnet"
4. Copy your HTTP URL
5. **Cost:** Free tier available

#### **Etherscan API Key (Optional)**
1. Go to [Etherscan](https://etherscan.io/apis)
2. Sign up and create API key
3. Copy your API key
4. **Cost:** Free tier available

#### **1inch API Key (Required for Real Quotes)**
1. Go to [1inch Developer Portal](https://portal.1inch.dev/)
2. Sign up and create API key
3. Copy your API key
4. **Cost:** Free tier available

### **Step 2: Set Up Environment Variables**

Create or update your `.env.local` file:

```bash
# Required for deployment
PRIVATE_KEY=your_wallet_private_key_here
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Optional for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Required for real swap quotes
VITE_1INCH_API_KEY=your_1inch_api_key_here

# Frontend RPC URLs
VITE_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

### **Step 3: Check Your ETH Balance**

```bash
# Check your wallet balance
npx hardhat run scripts/check-balance.js --network mainnet
```

**Required:** At least 0.3 ETH for deployment

### **Step 4: Deploy to Mainnet**

```bash
# Deploy all contracts to mainnet
npx hardhat run scripts/deploy-mainnet.js --network mainnet
```

**Expected Output:**
```
🚀 Starting SwapSage AI Oracle mainnet deployment...

📋 Deploying contracts with account: 0x...
💰 Account balance: 0.5 ETH
🌐 Network: mainnet (Chain ID: 1)
⛽ Current gas price: 25 gwei

📦 Deploying contracts...

1️⃣ Deploying SwapSageOracle...
   ✅ SwapSageOracle deployed to: 0x...

2️⃣ Deploying SwapSageHTLC...
   ✅ SwapSageHTLC deployed to: 0x...

3️⃣ Deploying SwapSageExecutor...
   ✅ SwapSageExecutor deployed to: 0x...

4️⃣ Deploying SimpleHTLC...
   ✅ SimpleHTLC deployed to: 0x...

🔍 Verifying contracts on Etherscan...
   ✅ All contracts verified on Etherscan!

🎉 Mainnet Deployment Complete!
```

### **Step 5: Update Environment Variables**

After deployment, update your `.env.local` with the contract addresses:

```bash
VITE_ORACLE_CONTRACT_ADDRESS=0x... # From deployment output
VITE_HTLC_CONTRACT_ADDRESS=0x... # From deployment output
VITE_EXECUTOR_CONTRACT_ADDRESS=0x... # From deployment output
VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=0x... # From deployment output
```

### **Step 6: Test the Deployment**

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Connect MetaMask** to Ethereum mainnet

3. **Test real swaps:**
   - ETH → USDC
   - USDC → DAI
   - Cross-chain swaps

## **💰 Cost Breakdown**

### **Deployment Costs:**
| Contract | Gas Used | Cost (25 gwei) | USD |
|----------|----------|----------------|-----|
| SwapSageOracle | ~1,000,000 | ~0.025 ETH | $55 |
| SwapSageHTLC | ~1,500,000 | ~0.0375 ETH | $82.5 |
| SwapSageExecutor | ~1,200,000 | ~0.03 ETH | $66 |
| SimpleHTLC | ~800,000 | ~0.02 ETH | $44 |
| **Total** | **~4,500,000** | **~0.1125 ETH** | **$247.5** |

### **Gas Price Optimization:**
- **Low gas times:** Weekends, 2-6 AM UTC
- **Target gas price:** 15-25 gwei
- **Potential savings:** 30-50%

## **🔍 Verification**

### **Check Contract Deployment:**
1. Visit [Etherscan](https://etherscan.io/)
2. Search for your contract addresses
3. Verify contracts are deployed and verified

### **Test Contract Functions:**
1. **Oracle:** Check price feeds
2. **HTLC:** Test atomic swaps
3. **Executor:** Test swap execution

## **🚨 Important Notes**

### **Security:**
- **Never commit** your private key to version control
- **Use hardware wallet** for large deployments
- **Test thoroughly** on testnets first

### **Gas Optimization:**
- **Monitor gas prices** before deployment
- **Deploy during low activity** periods
- **Use gas price estimators**

### **Backup:**
- **Save contract addresses** securely
- **Backup deployment logs**
- **Store private keys** safely

## **📞 Troubleshooting**

### **Common Issues:**

#### **1. Insufficient Balance**
```
❌ Insufficient balance for deployment. Need at least 0.3 ETH
```
**Solution:** Add more ETH to your wallet

#### **2. High Gas Prices**
```
⛽ Current gas price: 100 gwei
```
**Solution:** Wait for lower gas prices

#### **3. Network Connection**
```
❌ Not connected to Ethereum mainnet!
```
**Solution:** Check your RPC URL

#### **4. Contract Verification Failed**
```
❌ Contract verification failed
```
**Solution:** Check Etherscan API key

## **🎯 Next Steps After Deployment**

1. **Test all functionality** with real tokens
2. **Monitor contract interactions** on Etherscan
3. **Set up monitoring** for contract events
4. **Deploy frontend** to production
5. **Share contract addresses** with team

## **📊 Success Metrics**

- ✅ **All contracts deployed** and verified
- ✅ **Real swap quotes** working with 1inch API
- ✅ **Cross-chain swaps** functional
- ✅ **Gas costs** within budget
- ✅ **Contract addresses** saved and shared

**Congratulations! Your SwapSage AI Oracle is now live on Ethereum mainnet! 🚀** 
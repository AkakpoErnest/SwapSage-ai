# 🚀 Real Testnet Setup Guide

This guide will help you set up **real testnet functionality** for SwapSage AI Oracle with actual blockchain transactions.

## 📋 Prerequisites

### 1. **MetaMask Setup**
- Install MetaMask browser extension
- Create a new account for testing
- Switch to Sepolia testnet
- Get testnet ETH from faucet: https://sepoliafaucet.com/

### 2. **Required API Keys**
- **1inch API Key**: Already configured ✅
- **Infura/Alchemy RPC URL**: For Sepolia testnet
- **Etherscan API Key**: For contract verification

### 3. **Testnet Tokens**
- **Sepolia ETH**: From faucet
- **Sepolia USDC**: Get from testnet faucets
- **Stellar Testnet XLM**: From Stellar testnet faucet

## 🔧 Step-by-Step Setup

### Step 1: Get Testnet Resources

#### **Sepolia Testnet ETH**
1. Go to https://sepoliafaucet.com/
2. Connect your MetaMask wallet
3. Request testnet ETH (0.1 ETH should be enough)

#### **Infura/Alchemy RPC URL**
1. Go to https://infura.io/ or https://alchemy.com/
2. Create a free account
3. Create a new project
4. Copy the Sepolia RPC URL

#### **Etherscan API Key**
1. Go to https://etherscan.io/
2. Create an account
3. Go to API Keys section
4. Create a new API key

### Step 2: Configure Environment

Update your `.env.local` file with real values:

```bash
# Required for real testnet deployment
PRIVATE_KEY=your_metamask_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Contract addresses (will be filled after deployment)
VITE_HTLC_CONTRACT_ADDRESS=
```

### Step 3: Deploy HTLC Contract

Run the deployment script:

```bash
# Install dependencies if not already done
npm install

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

### Step 4: Update Contract Address

After deployment, copy the contract address and update `.env.local`:

```bash
VITE_HTLC_CONTRACT_ADDRESS=0x... # Address from deployment output
```

### Step 5: Test Real Swaps

1. **Connect MetaMask** to Sepolia testnet
2. **Ensure you have testnet ETH** (at least 0.01 ETH)
3. **Try a small swap** (0.001 ETH) first
4. **Monitor transactions** on Sepolia Etherscan

## 🎯 Real Testnet Features

### **What Actually Happens:**

1. **Real Ethereum Transactions**
   - Actual HTLC contract calls
   - Real gas fees paid
   - Transactions on Sepolia blockchain
   - Verifiable on Etherscan

2. **Real Token Swaps**
   - 1inch API integration for real quotes
   - Actual token swaps on Sepolia
   - Real slippage and fees

3. **Real Stellar Integration**
   - Stellar testnet transactions
   - Real XLM transfers
   - Verifiable on Stellar Explorer

### **Transaction Flow:**

```
User Input → 1inch Quote → HTLC Contract → Real Transaction → Blockchain
```

## 🔍 Verification

### **Check Contract Deployment**
- Visit https://sepolia.etherscan.io/
- Search for your contract address
- Verify it's deployed and verified

### **Monitor Transactions**
- All transactions appear on Etherscan
- Real gas fees are paid
- Transaction hashes are real

### **Test Swap Process**
1. Enter amount (e.g., 0.001 ETH)
2. Click "Execute Swap"
3. Approve MetaMask transaction
4. Wait for confirmation
5. Check Etherscan for transaction

## ⚠️ Important Notes

### **Testnet Limitations**
- Transactions may take longer than mainnet
- Gas fees are lower but still real
- Some features may be limited

### **Security**
- Never use real private keys in testnet
- Create separate testnet accounts
- Don't use mainnet funds

### **Costs**
- Real gas fees (but much lower than mainnet)
- 1inch API calls (free tier should be sufficient)
- No real token value at risk

## 🚀 Ready for Demo

Once setup is complete, you can:

1. **Demonstrate real transactions** on Sepolia
2. **Show actual contract interactions**
3. **Display real transaction hashes**
4. **Prove cross-chain functionality**
5. **Show real gas fees and costs**

## 🆘 Troubleshooting

### **Common Issues:**

1. **"Insufficient funds"**
   - Get more Sepolia ETH from faucet

2. **"Contract not found"**
   - Check contract address in .env.local
   - Verify contract is deployed

3. **"RPC error"**
   - Check SEPOLIA_RPC_URL in .env.local
   - Ensure Infura/Alchemy project is active

4. **"Private key error"**
   - Export private key from MetaMask
   - Ensure it's the correct account

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables
3. Ensure MetaMask is on Sepolia testnet
4. Check contract deployment status

---

**🎉 Congratulations!** You now have a fully functional cross-chain swap application with real testnet transactions! 
# Deployment Costs Guide - SwapSage AI Oracle

## **💰 Ethereum Mainnet Deployment Costs**

### **📊 Contract Gas Estimates:**

| Contract | Size | Gas Used | Cost (20 gwei) | Cost (50 gwei) | USD (ETH=$2,200) |
|----------|------|----------|----------------|----------------|------------------|
| **MockERC20** | ~2KB | ~200,000 | ~0.004 ETH | ~0.01 ETH | $8.80 - $22 |
| **SimpleHTLC** | ~8KB | ~800,000 | ~0.016 ETH | ~0.04 ETH | $35.20 - $88 |
| **SwapSageExecutor** | ~12KB | ~1,200,000 | ~0.024 ETH | ~0.06 ETH | $52.80 - $132 |
| **SwapSageHTLC** | ~15KB | ~1,500,000 | ~0.03 ETH | ~0.075 ETH | $66 - $165 |
| **SwapSageOracle** | ~10KB | ~1,000,000 | ~0.02 ETH | ~0.05 ETH | $44 - $110 |
| **Total** | ~47KB | ~4,700,000 | **~0.094 ETH** | **~0.235 ETH** | **$207 - $517** |

### **🎯 Cost Optimization Tips:**

#### **1. Deploy During Low Gas Times**
- **Best times:** Weekends, 2-6 AM UTC
- **Gas savings:** 30-50% reduction
- **Target:** 15-25 gwei gas price

#### **2. Use Gas Price Tools**
- **Etherscan Gas Tracker**
- **ETH Gas Station**
- **GasNow API**

#### **3. Batch Deployments**
- Deploy all contracts in one transaction
- **Savings:** 10-20% on total cost

## **🌐 Alternative Network Costs**

### **Polygon (Recommended for Development)**
| Contract | Gas Used | Cost (30 gwei) | USD |
|----------|----------|----------------|-----|
| **Total** | ~4,700,000 | ~0.000141 MATIC | **$0.05-0.15** |

### **Arbitrum One**
| Contract | Gas Used | Cost | USD |
|----------|----------|------|-----|
| **Total** | ~4,700,000 | ~0.001-0.003 ETH | **$2-7** |

### **Optimism**
| Contract | Gas Used | Cost | USD |
|----------|----------|------|-----|
| **Total** | ~4,700,000 | ~0.001-0.003 ETH | **$2-7** |

### **BSC (Binance Smart Chain)**
| Contract | Gas Used | Cost (5 gwei) | USD |
|----------|----------|---------------|-----|
| **Total** | ~4,700,000 | ~0.0235 BNB | **$5-10** |

## **🚀 Deployment Commands**

### **Ethereum Mainnet:**
```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"
export MAINNET_RPC_URL="your_mainnet_rpc"

# Deploy to mainnet
npx hardhat run scripts/deploy-testnet.js --network mainnet
```

### **Polygon (Recommended):**
```bash
# Deploy to Polygon
npx hardhat run scripts/deploy-testnet.js --network polygon
```

### **Testnets (Free):**
```bash
# Sepolia testnet
npx hardhat run scripts/deploy-testnet.js --network sepolia

# Mumbai testnet (Polygon)
npx hardhat run scripts/deploy-testnet.js --network mumbai
```

## **📋 Required Setup**

### **1. Environment Variables (.env.local):**
```bash
# Required for deployment
PRIVATE_KEY=your_wallet_private_key
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Optional
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### **2. Required ETH Balance:**
- **Mainnet:** 0.1-0.3 ETH ($220-660)
- **Polygon:** 0.01-0.05 MATIC ($0.01-0.05)
- **Testnets:** Free (get from faucets)

## **🎯 Recommended Deployment Strategy**

### **Phase 1: Development (Free)**
1. **Deploy to Sepolia** - Test functionality
2. **Deploy to Mumbai** - Test cross-chain
3. **Get testnet ETH** from faucets

### **Phase 2: Production (Low Cost)**
1. **Deploy to Polygon** - $0.05-0.15
2. **Test with real tokens** - Low risk
3. **Validate functionality**

### **Phase 3: Mainnet (Full Cost)**
1. **Deploy to Ethereum** - $200-500
2. **Real trading** - Full functionality
3. **Production launch**

## **💡 Cost-Saving Tips**

### **1. Use Layer 2 Solutions**
- **Polygon:** 99% cheaper than Ethereum
- **Arbitrum:** 90% cheaper than Ethereum
- **Optimism:** 90% cheaper than Ethereum

### **2. Deploy During Low Activity**
- **Weekends:** Lower gas prices
- **Late night UTC:** Less network congestion
- **Monitor gas prices:** Use gas trackers

### **3. Optimize Contract Size**
- **Remove unused functions**
- **Use libraries** for common functions
- **Optimize storage** patterns

## **🔍 Current Gas Prices**

### **Live Gas Tracking:**
- **Etherscan:** https://etherscan.io/gastracker
- **ETH Gas Station:** https://ethgasstation.info
- **GasNow:** https://www.gasnow.org

### **Target Gas Prices:**
- **Low:** 15-25 gwei
- **Medium:** 25-50 gwei
- **High:** 50-100 gwei

## **📞 Next Steps**

1. **Choose deployment network** (Polygon recommended for testing)
2. **Set up environment variables**
3. **Get required tokens** (ETH/MATIC)
4. **Deploy contracts**
5. **Verify on block explorer**

**Total Cost Summary:**
- **Testnet:** Free
- **Polygon:** $0.05-0.15
- **Ethereum:** $200-500

Choose Polygon for development and testing, then move to Ethereum for production! 🚀 
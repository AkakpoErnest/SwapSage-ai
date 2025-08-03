# 🚀 SwapSage AI - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Required API Keys & Configuration**

#### **1. 1inch API Key (CRITICAL)**
```bash
# Get from: https://portal.1inch.dev/
VITE_1INCH_API_KEY=your_actual_1inch_api_key_here
```
- **Required for**: Real swap quotes, Fusion orders, token prices
- **Cost**: Free tier available, paid plans for higher limits
- **Setup**: Register at 1inch portal, create API key

#### **2. Stellar Bridge Configuration**
```bash
# Network selection
VITE_STELLAR_NETWORK=TESTNET  # or PUBLIC for mainnet

# Bridge account secret key (CRITICAL for HTLC operations)
VITE_STELLAR_BRIDGE_SECRET_KEY=your_stellar_bridge_secret_key_here
```
- **Required for**: Cross-chain HTLC operations
- **Setup**: Generate new Stellar keypair for production
- **Funding**: Bridge account must be funded with XLM

#### **3. Polygon RPC Configuration**
```bash
# Polygon RPC URL (Required for blockchain interactions)
VITE_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your_alchemy_key
```
- **Options**: Alchemy, Infura, QuickNode, or your own node
- **Cost**: Free tier available, paid for higher limits

### ✅ **Contract Addresses (Polygon Mainnet)**

```bash
# Production Contract Addresses
VITE_ORACLE_CONTRACT_ADDRESS=0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e
VITE_HTLC_CONTRACT_ADDRESS=0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb
VITE_EXECUTOR_CONTRACT_ADDRESS=0x933672776E1e04C2C73bED443c2dCAB566bE0CC5
VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=0x431D2d3E65c7511dA9876a2d43043f04A7eDBb24
VITE_MOCK_TOKEN_ADDRESS=0x4e329608BbaeA87656fBDC5EFb755d079C5E4254
```

### ✅ **Optional Configuration**

```bash
# Ethereum RPC (for additional networks)
VITE_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key

# PolygonScan API (for contract verification)
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Development settings (DISABLE for production)
VITE_DEV_MODE=false
VITE_DEBUG_LOGGING=false
```

## 🔧 **Environment Setup**

### **1. Create Environment File**
```bash
# Copy example and configure
cp .env.example .env.local
```

### **2. Fill Required Values**
```bash
# Edit .env.local with your actual values
nano .env.local
```

### **3. Validate Configuration**
```bash
# Check if all required variables are set
npm run validate:env
```

## 🚀 **Deployment Steps**

### **1. Build for Production**
```bash
# Clean and build
npm run clean
npm run build

# Verify build output
ls -la dist/
```

### **2. Deploy to Hosting Platform**

#### **Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### **Netlify Deployment**
```bash
# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

#### **AWS S3 + CloudFront**
```bash
# Build and sync to S3
npm run build
aws s3 sync dist/ s3://your-bucket-name

# Configure CloudFront for HTTPS
```

### **3. Post-Deployment Verification**

#### **Test Critical Functions**
1. **Wallet Connection**: Test MetaMask and Freighter connections
2. **Swap Quotes**: Verify 1inch API integration
3. **HTLC Operations**: Test cross-chain swap initiation
4. **Price Feeds**: Check live token prices
5. **Error Handling**: Test error scenarios

#### **Monitor Logs**
```bash
# Check for errors in browser console
# Monitor API rate limits
# Verify transaction confirmations
```

## 🔒 **Security Checklist**

### **✅ Environment Security**
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] API keys have appropriate permissions
- [ ] Bridge account keys are secure

### **✅ Network Security**
- [ ] HTTPS enabled on production
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation active

### **✅ Contract Security**
- [ ] Contracts verified on PolygonScan
- [ ] HTLC conditions properly implemented
- [ ] Oracle price feeds validated
- [ ] Emergency pause functionality tested

## 📊 **Monitoring & Maintenance**

### **Health Checks**
```bash
# API endpoints to monitor
GET /api/health
GET /api/price/feed
GET /api/bridge/status
```

### **Key Metrics**
- Swap success rate
- API response times
- Gas fee trends
- User transaction volume

### **Alert Setup**
- API key quota warnings
- Bridge account balance alerts
- Contract error notifications
- Performance degradation alerts

## 🆘 **Troubleshooting**

### **Common Issues**

#### **1. 1inch API Errors**
```bash
# Check API key validity
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.1inch.dev/swap/v6.0/1/tokens
```

#### **2. Stellar Connection Issues**
```bash
# Verify network configuration
curl https://horizon.stellar.org/health
```

#### **3. Polygon RPC Issues**
```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_POLYGON_RPC_URL
```

### **Emergency Procedures**

#### **Pause Bridge Operations**
```bash
# Call pause function on HTLC contract
# Redirect users to maintenance page
# Monitor for pending transactions
```

#### **Rollback Deployment**
```bash
# Revert to previous version
# Restore from backup
# Notify users of downtime
```

## 📞 **Support & Resources**

### **Documentation**
- [SwapSage AI Documentation](./README.md)
- [Stellar Developer Docs](https://developers.stellar.org/)
- [1inch API Documentation](https://docs.1inch.dev/)
- [Polygon Developer Docs](https://docs.polygon.technology/)

### **Community**
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Telegram Support](https://t.me/your-support)

---

**⚠️ IMPORTANT**: This is a production deployment guide. Ensure all security measures are in place before going live with real user funds. 
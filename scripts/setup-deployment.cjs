const fs = require("fs");
const path = require("path");

console.log("🚀 SwapSage AI - Mainnet Deployment Setup");
console.log("=" * 50);

// Check if .env.local exists
const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.log("❌ .env.local file not found!");
  console.log("Please copy env.example to .env.local first:");
  console.log("cp env.example .env.local");
  process.exit(1);
}

// Read current .env.local
const envContent = fs.readFileSync(envPath, "utf8");

console.log("📋 Current Environment Status:");
console.log("-" * 30);

// Check required variables
const requiredVars = [
  "PRIVATE_KEY",
  "VITE_1INCH_API_KEY", 
  "MAINNET_RPC_URL",
  "SEPOLIA_RPC_URL"
];

let missingVars = [];
let configuredVars = [];

requiredVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm');
  const match = envContent.match(regex);
  
  if (match && match[1] && !match[1].includes('your_') && match[1].trim() !== '') {
    configuredVars.push(varName);
    console.log(`✅ ${varName}: Configured`);
  } else {
    missingVars.push(varName);
    console.log(`❌ ${varName}: Not configured`);
  }
});

console.log("\n🔧 Setup Instructions:");
console.log("=" * 30);

if (missingVars.length > 0) {
  console.log("\n❌ Missing required configuration:");
  missingVars.forEach(varName => {
    switch(varName) {
      case "PRIVATE_KEY":
        console.log(`\n🔑 ${varName}:`);
        console.log("   - Export your wallet's private key");
        console.log("   - WARNING: Never share or commit this key!");
        console.log("   - Format: 0x followed by 64 hex characters");
        console.log("   - Example: 0x1234567890abcdef...");
        break;
        
      case "VITE_1INCH_API_KEY":
        console.log(`\n🔑 ${varName}:`);
        console.log("   - Get free API key at: https://portal.1inch.dev/");
        console.log("   - Required for real swap quotes on mainnet");
        console.log("   - Testnet doesn't support 1inch API");
        break;
        
      case "MAINNET_RPC_URL":
        console.log(`\n🔑 ${varName}:`);
        console.log("   - Get API key at: https://www.alchemy.com/");
        console.log("   - Format: https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY");
        console.log("   - Or use Infura: https://mainnet.infura.io/v3/YOUR_KEY");
        break;
        
      case "SEPOLIA_RPC_URL":
        console.log(`\n🔑 ${varName}:`);
        console.log("   - Get API key at: https://www.alchemy.com/");
        console.log("   - Format: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY");
        console.log("   - Or use Infura: https://sepolia.infura.io/v3/YOUR_KEY");
        break;
    }
  });
  
  console.log("\n📝 Update your .env.local file with the missing values");
  console.log("Then run this script again to verify configuration.");
  
} else {
  console.log("\n✅ All required variables are configured!");
  console.log("\n🚀 Ready for deployment!");
  console.log("\nNext steps:");
  console.log("1. Ensure you have sufficient MATIC for deployment (~0.01 MATIC)");
  console.log("2. Run: npx hardhat run scripts/deploy-remaining-polygon.cjs --network polygon");
  console.log("3. Or run: npx hardhat run scripts/deploy-polygon.cjs --network polygon (for full deployment)");
}

console.log("\n💰 Deployment Cost Estimates:");
console.log("-" * 30);
console.log("Polygon Mainnet:");
console.log("  - Oracle: ~0.001 MATIC");
console.log("  - HTLC: ~0.002 MATIC");
console.log("  - Executor: ~0.002 MATIC");
console.log("  - SimpleHTLC: ~0.001 MATIC");
console.log("  - MockERC20: ~0.001 MATIC");
console.log("  - Total: ~0.007 MATIC (~$0.01-0.05 USD)");

console.log("\nEthereum Mainnet:");
console.log("  - Oracle: ~0.01 ETH");
console.log("  - HTLC: ~0.02 ETH");
console.log("  - Executor: ~0.02 ETH");
console.log("  - Total: ~0.05 ETH (~$100-200 USD)");

console.log("\n🔒 Security Reminders:");
console.log("-" * 25);
console.log("✅ Never commit .env.local to version control");
console.log("✅ Use a dedicated deployment wallet");
console.log("✅ Keep private keys secure");
console.log("✅ Test on testnet first");
console.log("✅ Verify contracts after deployment");

console.log("\n📚 Documentation:");
console.log("-" * 20);
console.log("README.md - Full project documentation");
console.log("COST_EFFECTIVE_DEPLOYMENT.md - Deployment cost guide");
console.log("STELLAR_NETWORK_GUIDE.md - Stellar integration guide"); 
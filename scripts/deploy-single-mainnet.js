const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Starting single contract mainnet deployment...\n");

  // Check environment variables
  const requiredEnvVars = ['PRIVATE_KEY', 'MAINNET_RPC_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }

  try {
    // Get deployer account
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
    console.log(`📋 Deploying with account: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

    // Check if balance is sufficient for single contract
    const estimatedCost = ethers.parseEther("0.05"); // Much lower for single contract
    if (balance < estimatedCost) {
      console.error(`❌ Insufficient balance. Need at least 0.05 ETH, but have ${ethers.formatEther(balance)} ETH.`);
      console.error("💡 Estimated cost: $50-100 USD");
      process.exit(1);
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

    if (network.chainId !== 1) {
      console.error("❌ Not connected to Ethereum mainnet!");
      process.exit(1);
    }

    // Get current gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log(`⛽ Current gas price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);

    // Deploy only SimpleHTLC (smallest contract)
    console.log("\n📦 Deploying SimpleHTLC (smallest contract)...");
    const SimpleHTLC = await ethers.getContractFactory("SimpleHTLC");
    const simpleHtlc = await SimpleHTLC.connect(deployer).deploy({
      gasLimit: 800000,
      gasPrice: gasPrice.gasPrice
    });
    await simpleHtlc.waitForDeployment();
    const simpleHtlcAddress = await simpleHtlc.getAddress();
    
    console.log(`✅ SimpleHTLC deployed to: ${simpleHtlcAddress}`);
    console.log(`🔗 Etherscan: https://etherscan.io/address/${simpleHtlcAddress}`);

    // Verify contract on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: simpleHtlcAddress,
          constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan!");
      } catch (error) {
        console.log("⚠️ Verification failed:", error.message);
      }
    }

    // Save contract address
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = `VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${simpleHtlcAddress}\n`;
    
    if (fs.existsSync(envPath)) {
      fs.appendFileSync(envPath, envContent);
    } else {
      fs.writeFileSync(envPath, envContent);
    }

    console.log("\n🎉 Single Contract Deployment Complete!");
    console.log("=" * 50);
    console.log("📋 Contract Address:");
    console.log(`   SimpleHTLC: ${simpleHtlcAddress}`);
    console.log("\n📝 Added to .env.local:");
    console.log(`   VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${simpleHtlcAddress}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Test the SimpleHTLC contract");
    console.log("2. Deploy other contracts when ready");
    console.log("3. Get 1inch API key for real quotes");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
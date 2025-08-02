const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Deploying SwapSageExecutor to Polygon mainnet...\n");

  // Check environment variables
  const requiredEnvVars = ['PRIVATE_KEY'];
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
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} MATIC`);

    // Check if balance is sufficient
    const estimatedCost = ethers.parseEther("0.01");
    if (balance < estimatedCost) {
      console.error(`❌ Insufficient balance. Need at least 0.01 MATIC, but have ${ethers.formatEther(balance)} MATIC.`);
      process.exit(1);
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

    if (network.chainId !== 137n) {
      console.error("❌ Not connected to Polygon mainnet!");
      process.exit(1);
    }

    // Get current gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log(`⛽ Current gas price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);

    // Load existing contract addresses
    const configPath = path.join(__dirname, "..", "deployment-config.json");
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }

    const oracleAddress = config.networks?.polygon?.contracts?.oracle;
    if (!oracleAddress) {
      console.error("❌ Oracle contract address not found. Please deploy Oracle first.");
      process.exit(1);
    }

    console.log(`📋 Using Oracle address: ${oracleAddress}`);

    // Deploy SwapSageExecutor
    console.log("\n🔧 Deploying SwapSageExecutor...");
    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    
    console.log("   📝 Constructor parameters:");
    console.log(`      - Oracle Address: ${oracleAddress}`);
    console.log(`      - Gas Limit: 1200000`);
    console.log(`      - Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
    
    const executor = await SwapSageExecutor.connect(deployer).deploy(oracleAddress, {
      gasLimit: 1200000,
      gasPrice: gasPrice.gasPrice
    });
    
    console.log("   ⏳ Waiting for deployment confirmation...");
    await executor.waitForDeployment();
    
    const executorAddress = await executor.getAddress();
    console.log(`   ✅ SwapSageExecutor deployed to: ${executorAddress}`);

    // Update deployment config
    if (config.networks && config.networks.polygon) {
      config.networks.polygon.contracts.executor = executorAddress;
    }

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("\n📄 Updated deployment configuration");

    // Display deployment summary
    console.log("\n🎉 SwapSageExecutor Deployment Complete!");
    console.log("=" * 50);
    console.log("📋 Contract Address:");
    console.log(`   SwapSageExecutor: ${executorAddress}`);
    
    console.log("\n🔗 Polygonscan Link:");
    console.log(`   https://polygonscan.com/address/${executorAddress}`);

    console.log("\n📝 Environment Variable for .env.local:");
    console.log(`VITE_EXECUTOR_CONTRACT_ADDRESS=${executorAddress}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Update your .env.local file with the executor address");
    console.log("2. Test the complete swap flow with all contracts");
    console.log("3. Prepare for 1inch Fusion+ extension demo");

    // Verify the contract was deployed correctly
    console.log("\n🔍 Verifying deployment...");
    const code = await ethers.provider.getCode(executorAddress);
    if (code === "0x") {
      console.error("❌ Contract deployment verification failed - no code at address");
    } else {
      console.log("✅ Contract deployment verified - code found at address");
    }

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
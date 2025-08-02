const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Deploying remaining contracts to Polygon mainnet...\n");

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

    // Deploy remaining contracts
    const deployedContracts = {};

    // 1. Deploy SimpleHTLC (no constructor parameters needed)
    console.log("\n1️⃣ Deploying SimpleHTLC...");
    const SimpleHTLC = await ethers.getContractFactory("SimpleHTLC");
    const simpleHtlc = await SimpleHTLC.connect(deployer).deploy({
      gasLimit: 800000,
      gasPrice: gasPrice.gasPrice
    });
    await simpleHtlc.waitForDeployment();
    const simpleHtlcAddress = await simpleHtlc.getAddress();
    deployedContracts.simpleHtlc = simpleHtlcAddress;
    console.log(`   ✅ SimpleHTLC deployed to: ${simpleHtlcAddress}`);

    // 2. Deploy SwapSageExecutor (needs oracle address)
    console.log("\n2️⃣ Deploying SwapSageExecutor...");
    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    const executor = await SwapSageExecutor.connect(deployer).deploy(oracleAddress, {
      gasLimit: 1200000,
      gasPrice: gasPrice.gasPrice
    });
    await executor.waitForDeployment();
    const executorAddress = await executor.getAddress();
    deployedContracts.executor = executorAddress;
    console.log(`   ✅ SwapSageExecutor deployed to: ${executorAddress}`);

    // Update deployment config
    if (config.networks && config.networks.polygon) {
      config.networks.polygon.contracts = {
        ...config.networks.polygon.contracts,
        ...deployedContracts
      };
    }

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("\n📄 Updated deployment configuration");

    // Display deployment summary
    console.log("\n🎉 Remaining Contracts Deployment Complete!");
    console.log("=" * 50);
    console.log("📋 New Contract Addresses:");
    console.log(`   SimpleHTLC: ${simpleHtlcAddress}`);
    console.log(`   SwapSageExecutor: ${executorAddress}`);
    
    console.log("\n🔗 Polygonscan Links:");
    console.log(`   SimpleHTLC: https://polygonscan.com/address/${simpleHtlcAddress}`);
    console.log(`   SwapSageExecutor: https://polygonscan.com/address/${executorAddress}`);

    console.log("\n📝 Environment Variables for .env.local:");
    console.log(`VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${simpleHtlcAddress}`);
    console.log(`VITE_EXECUTOR_CONTRACT_ADDRESS=${executorAddress}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Update your .env.local file with the new contract addresses");
    console.log("2. Test the complete swap flow on Polygon");
    console.log("3. Prepare for 1inch Fusion+ extension demo");

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
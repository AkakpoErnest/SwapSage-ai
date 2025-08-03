const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Deploying SwapSageExecutor to Polygon mainnet...\n");

  try {
    // Get deployer account
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
    console.log(`📋 Deploying with account: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} MATIC`);

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

    // Load existing deployment info
    const deploymentInfoPath = path.join(__dirname, "..", "deployment-info-polygon.json");
    let deploymentInfo = {};
    
    if (fs.existsSync(deploymentInfoPath)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
    }

    // Get existing Oracle address
    const existingOracle = deploymentInfo.contracts?.oracle;
    if (!existingOracle) {
      console.error("❌ Oracle contract address not found in deployment-info-polygon.json");
      process.exit(1);
    }

    console.log(`📋 Using existing Oracle: ${existingOracle}`);

    // Deploy SwapSageExecutor
    console.log("\n1️⃣ Deploying SwapSageExecutor...");
    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    
    // Try with automatic gas estimation
    console.log("   Estimating gas...");
    const executor = await SwapSageExecutor.connect(deployer).deploy(existingOracle);
    await executor.waitForDeployment();
    
    const executorAddress = await executor.getAddress();
    console.log(`   ✅ SwapSageExecutor deployed to: ${executorAddress}`);

    // Update deployment info
    if (!deploymentInfo.contracts) deploymentInfo.contracts = {};
    deploymentInfo.contracts.executor = executorAddress;
    deploymentInfo.timestamp = new Date().toISOString();
    deploymentInfo.deployer = deployer.address;
    
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Updated deployment-info-polygon.json");

    // Display deployment summary
    console.log("\n🎉 SwapSageExecutor Deployment Complete!");
    console.log("=" * 45);
    console.log(`📋 Contract Address: ${executorAddress}`);
    console.log(`🔗 Polygonscan: https://polygonscan.com/address/${executorAddress}`);
    console.log(`📝 Environment Variable: VITE_EXECUTOR_CONTRACT_ADDRESS=${executorAddress}`);

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
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Deploying SimpleHTLC to Polygon mainnet...\n");

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

    // Deploy SimpleHTLC
    console.log("\n1️⃣ Deploying SimpleHTLC...");
    const SimpleHTLC = await ethers.getContractFactory("SimpleHTLC");
    
    // Try with automatic gas estimation
    console.log("   Estimating gas...");
    const simpleHtlc = await SimpleHTLC.connect(deployer).deploy();
    await simpleHtlc.waitForDeployment();
    
    const simpleHtlcAddress = await simpleHtlc.getAddress();
    console.log(`   ✅ SimpleHTLC deployed to: ${simpleHtlcAddress}`);

    // Update deployment info
    const deploymentInfoPath = path.join(__dirname, "..", "deployment-info-polygon.json");
    let deploymentInfo = {};
    
    if (fs.existsSync(deploymentInfoPath)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
    }

    if (!deploymentInfo.contracts) deploymentInfo.contracts = {};
    deploymentInfo.contracts.simpleHtlc = simpleHtlcAddress;
    deploymentInfo.timestamp = new Date().toISOString();
    deploymentInfo.deployer = deployer.address;
    
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Updated deployment-info-polygon.json");

    // Display deployment summary
    console.log("\n🎉 SimpleHTLC Deployment Complete!");
    console.log("=" * 40);
    console.log(`📋 Contract Address: ${simpleHtlcAddress}`);
    console.log(`🔗 Polygonscan: https://polygonscan.com/address/${simpleHtlcAddress}`);
    console.log(`📝 Environment Variable: VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${simpleHtlcAddress}`);

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
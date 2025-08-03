const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Deploying MockERC20 to Polygon mainnet...\n");

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

    // Deploy MockERC20
    console.log("\n1️⃣ Deploying MockERC20...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    // Try with automatic gas estimation first
    console.log("   Estimating gas...");
    const mockToken = await MockERC20.connect(deployer).deploy("Mock USDC", "mUSDC");
    await mockToken.waitForDeployment();
    
    const mockTokenAddress = await mockToken.getAddress();
    console.log(`   ✅ MockERC20 deployed to: ${mockTokenAddress}`);

    // Update deployment info
    const deploymentInfoPath = path.join(__dirname, "..", "deployment-info-polygon.json");
    let deploymentInfo = {};
    
    if (fs.existsSync(deploymentInfoPath)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
    }

    if (!deploymentInfo.contracts) deploymentInfo.contracts = {};
    deploymentInfo.contracts.mockToken = mockTokenAddress;
    deploymentInfo.timestamp = new Date().toISOString();
    deploymentInfo.deployer = deployer.address;
    
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Updated deployment-info-polygon.json");

    // Display deployment summary
    console.log("\n🎉 MockERC20 Deployment Complete!");
    console.log("=" * 40);
    console.log(`📋 Contract Address: ${mockTokenAddress}`);
    console.log(`🔗 Polygonscan: https://polygonscan.com/address/${mockTokenAddress}`);
    console.log(`📝 Environment Variable: VITE_MOCK_TOKEN_ADDRESS=${mockTokenAddress}`);

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
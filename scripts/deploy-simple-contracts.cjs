const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Deploying SimpleHTLC and MockERC20 to Polygon mainnet...\n");

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
      console.error(`Expected chain ID: 137, got: ${network.chainId}`);
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

    // Get existing contract addresses
    const existingOracle = deploymentInfo.contracts?.oracle;
    const existingHtlc = deploymentInfo.contracts?.htlc;

    if (!existingOracle || !existingHtlc) {
      console.error("❌ Existing Oracle and HTLC contracts not found in deployment-info-polygon.json");
      process.exit(1);
    }

    console.log(`📋 Using existing Oracle: ${existingOracle}`);
    console.log(`📋 Using existing HTLC: ${existingHtlc}`);

    const deployedContracts = {
      oracle: existingOracle,
      htlc: existingHtlc
    };

    // 1. Deploy SimpleHTLC
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

    // 2. Deploy MockERC20
    console.log("\n2️⃣ Deploying MockERC20...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.connect(deployer).deploy("Mock USDC", "mUSDC", {
      gasLimit: 600000,
      gasPrice: gasPrice.gasPrice
    });
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    deployedContracts.mockToken = mockTokenAddress;
    console.log(`   ✅ MockERC20 deployed to: ${mockTokenAddress}`);

    // Update deployment info
    deploymentInfo.contracts = deployedContracts;
    deploymentInfo.timestamp = new Date().toISOString();
    deploymentInfo.deployer = deployer.address;
    
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Updated deployment-info-polygon.json");

    // Update deployment config
    const configPath = path.join(__dirname, "..", "deployment-config.json");
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }

    if (!config.networks) config.networks = {};
    if (!config.networks.polygon) config.networks.polygon = {};
    config.networks.polygon.contracts = deployedContracts;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("📄 Updated deployment-config.json");

    // Display deployment summary
    console.log("\n🎉 Simple Contracts Deployment Complete!");
    console.log("=" * 50);
    console.log("📋 Contract Addresses:");
    console.log(`   SwapSageOracle: ${existingOracle}`);
    console.log(`   SwapSageHTLC: ${existingHtlc}`);
    console.log(`   SimpleHTLC: ${simpleHtlcAddress}`);
    console.log(`   MockERC20: ${mockTokenAddress}`);
    
    console.log("\n🔗 Polygonscan Links:");
    console.log(`   SwapSageOracle: https://polygonscan.com/address/${existingOracle}`);
    console.log(`   SwapSageHTLC: https://polygonscan.com/address/${existingHtlc}`);
    console.log(`   SimpleHTLC: https://polygonscan.com/address/${simpleHtlcAddress}`);
    console.log(`   MockERC20: https://polygonscan.com/address/${mockTokenAddress}`);

    console.log("\n📝 Environment Variables for .env.local:");
    console.log(`VITE_ORACLE_CONTRACT_ADDRESS=${existingOracle}`);
    console.log(`VITE_HTLC_CONTRACT_ADDRESS=${existingHtlc}`);
    console.log(`VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${simpleHtlcAddress}`);
    console.log(`VITE_MOCK_TOKEN_ADDRESS=${mockTokenAddress}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Update your .env.local file with the new contract addresses");
    console.log("2. Test the SimpleHTLC and MockERC20 functionality");
    console.log("3. We'll address the SwapSageExecutor deployment separately");

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
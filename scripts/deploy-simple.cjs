const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🚀 Deploying SimpleHTLC to Sepolia testnet...");

  // Check environment variables
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in .env.local");
    process.exit(1);
  }

  if (!process.env.SEPOLIA_RPC_URL) {
    console.error("❌ SEPOLIA_RPC_URL not found in .env.local");
    process.exit(1);
  }

  try {
    // Get the signer
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Get the contract factory
    const SimpleHTLC = await ethers.getContractFactory("SimpleHTLC");
    
    console.log("📝 Deploying SimpleHTLC contract...");
    
    // Deploy the contract
    const htlc = await SimpleHTLC.connect(deployer).deploy();
    
    // Wait for deployment to complete
    await htlc.waitForDeployment();
    
    const address = await htlc.getAddress();
    
    console.log("✅ SimpleHTLC deployed to:", address);
    
    // Deploy MockERC20
    console.log("📝 Deploying MockERC20 contract...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.connect(deployer).deploy("Mock USDC", "mUSDC");
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    
    console.log("✅ MockERC20 deployed to:", mockTokenAddress);
    
    console.log("\n📋 Contract addresses for .env.local:");
    console.log(`VITE_HTLC_CONTRACT_ADDRESS=${address}`);
    console.log(`VITE_MOCK_TOKEN_ADDRESS=${mockTokenAddress}`);
    
    // Verify the deployments
    console.log("\n🔍 Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ SimpleHTLC verified on Etherscan!");
    } catch (error) {
      console.log("⚠️ SimpleHTLC verification failed:", error.message);
    }
    
    try {
      await hre.run("verify:verify", {
        address: mockTokenAddress,
        constructorArguments: ["Mock USDC", "mUSDC"],
      });
      console.log("✅ MockERC20 verified on Etherscan!");
    } catch (error) {
      console.log("⚠️ MockERC20 verification failed:", error.message);
    }
    
    // Update deployment config
    const fs = require('fs');
    const configPath = './deployment-config.json';
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    if (!config.networks) config.networks = {};
    if (!config.networks.sepolia) config.networks.sepolia = {};
    if (!config.networks.sepolia.contracts) config.networks.sepolia.contracts = {};
    
    config.networks.sepolia.contracts.htlc = address;
    config.networks.sepolia.contracts.mockToken = mockTokenAddress;
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("💾 Updated deployment-config.json");
    
    console.log("\n🎉 Deployment complete!");
    console.log("🔗 Explorer Links:");
    console.log(`   SimpleHTLC: https://sepolia.etherscan.io/address/${address}`);
    console.log(`   MockERC20: https://sepolia.etherscan.io/address/${mockTokenAddress}`);
    
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
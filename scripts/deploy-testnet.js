const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Starting SwapSage AI Oracle testnet deployment...\n");

  // Check environment variables
  const requiredEnvVars = ['PRIVATE_KEY', 'SEPOLIA_RPC_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error("\nPlease create a .env.local file with the required variables.");
    process.exit(1);
  }

  try {
    // Get deployer account
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
    console.log(`📋 Deploying contracts with account: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance < ethers.parseEther("0.01")) {
      console.error("❌ Insufficient balance for deployment. Need at least 0.01 ETH.");
      process.exit(1);
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // Load deployment config
    const configPath = path.join(__dirname, "..", "deployment-config.json");
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      console.log("📄 Loaded deployment configuration");
    }

    // Deploy contracts in order
    console.log("📦 Deploying contracts...\n");

    const deployedContracts = {};

    // 1. Deploy MockERC20 for testing
    console.log("1️⃣ Deploying MockERC20 token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.connect(deployer).deploy("Mock USDC", "mUSDC");
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    deployedContracts.mockToken = mockTokenAddress;
    console.log(`   ✅ MockERC20 deployed to: ${mockTokenAddress}`);

    // 2. Deploy SwapSageOracle
    console.log("\n2️⃣ Deploying SwapSageOracle...");
    const SwapSageOracle = await ethers.getContractFactory("SwapSageOracle");
    const oracle = await SwapSageOracle.connect(deployer).deploy();
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    deployedContracts.oracle = oracleAddress;
    console.log(`   ✅ SwapSageOracle deployed to: ${oracleAddress}`);

    // 3. Deploy SwapSageHTLC
    console.log("\n3️⃣ Deploying SwapSageHTLC...");
    const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
    const htlc = await SwapSageHTLC.connect(deployer).deploy();
    await htlc.waitForDeployment();
    const htlcAddress = await htlc.getAddress();
    deployedContracts.htlc = htlcAddress;
    console.log(`   ✅ SwapSageHTLC deployed to: ${htlcAddress}`);

    // 4. Deploy SwapSageExecutor
    console.log("\n4️⃣ Deploying SwapSageExecutor...");
    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    const executor = await SwapSageExecutor.connect(deployer).deploy();
    await executor.waitForDeployment();
    const executorAddress = await executor.getAddress();
    deployedContracts.executor = executorAddress;
    console.log(`   ✅ SwapSageExecutor deployed to: ${executorAddress}`);

    // Update deployment config
    const networkName = network.name === "unknown" ? "sepolia" : network.name;
    if (config.networks && config.networks[networkName]) {
      config.networks[networkName].contracts = deployedContracts;
    } else {
      if (!config.networks) config.networks = {};
      config.networks[networkName] = {
        name: "Sepolia Testnet",
        chainId: network.chainId,
        rpcUrl: process.env.SEPOLIA_RPC_URL,
        explorerUrl: "https://sepolia.etherscan.io",
        contracts: deployedContracts
      };
    }

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("\n💾 Updated deployment configuration");

    // Verify contracts on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verifying contracts on Etherscan...");
      
      const verificationPromises = [
        verifyContract("SwapSageOracle", oracleAddress, []),
        verifyContract("SwapSageHTLC", htlcAddress, []),
        verifyContract("SwapSageExecutor", executorAddress, []),
        verifyContract("MockERC20", mockTokenAddress, ["Mock USDC", "mUSDC"])
      ];

      await Promise.allSettled(verificationPromises);
    } else {
      console.log("\n⚠️  ETHERSCAN_API_KEY not found, skipping verification");
    }

    // Print deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`🌐 Network: ${network.name} (${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Gas used: ${ethers.formatEther(balance - await ethers.provider.getBalance(deployer.address))} ETH`);
    console.log("\n📋 Contract Addresses:");
    console.log(`   SwapSageOracle: ${oracleAddress}`);
    console.log(`   SwapSageHTLC:   ${htlcAddress}`);
    console.log(`   SwapSageExecutor: ${executorAddress}`);
    console.log(`   MockERC20:      ${mockTokenAddress}`);
    console.log("\n🔗 Explorer Links:");
    console.log(`   Oracle: https://sepolia.etherscan.io/address/${oracleAddress}`);
    console.log(`   HTLC:   https://sepolia.etherscan.io/address/${htlcAddress}`);
    console.log(`   Executor: https://sepolia.etherscan.io/address/${executorAddress}`);
    console.log(`   Mock Token: https://sepolia.etherscan.io/address/${mockTokenAddress}`);

    console.log("\n🚀 Next Steps:");
    console.log("   1. Update your frontend with the new contract addresses");
    console.log("   2. Test the contracts with the provided test suite");
    console.log("   3. Configure price feeds in the Oracle contract");
    console.log("   4. Set up 1inch integration in the Executor contract");
    console.log("   5. Run: npm run test:integration");

    console.log("\n" + "=".repeat(60));

    // Save deployment info to file
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts
    };

    fs.writeFileSync(
      path.join(__dirname, "..", "deployment-info.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📄 Deployment info saved to deployment-info.json");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

async function verifyContract(contractName, address, constructorArguments) {
  try {
    console.log(`   🔍 Verifying ${contractName}...`);
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log(`   ✅ ${contractName} verified`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ✅ ${contractName} already verified`);
    } else {
      console.log(`   ⚠️  ${contractName} verification failed: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
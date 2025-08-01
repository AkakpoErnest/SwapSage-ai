const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("🚀 Deploying SwapSage AI Oracle contracts to Sepolia testnet...");

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

    const deployedContracts = {};

    // 1. Deploy SwapSageOracle
    console.log("\n1️⃣ Deploying SwapSageOracle...");
    const SwapSageOracle = await ethers.getContractFactory("SwapSageOracle");
    const oracle = await SwapSageOracle.connect(deployer).deploy();
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    deployedContracts.oracle = oracleAddress;
    console.log("   ✅ SwapSageOracle deployed to:", oracleAddress);

    // 2. Deploy SwapSageHTLC
    console.log("\n2️⃣ Deploying SwapSageHTLC...");
    const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
    const htlc = await SwapSageHTLC.connect(deployer).deploy(oracleAddress);
    await htlc.waitForDeployment();
    const htlcAddress = await htlc.getAddress();
    deployedContracts.htlc = htlcAddress;
    console.log("   ✅ SwapSageHTLC deployed to:", htlcAddress);

    // 3. Deploy SwapSageExecutor
    console.log("\n3️⃣ Deploying SwapSageExecutor...");
    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    const executor = await SwapSageExecutor.connect(deployer).deploy(oracleAddress);
    await executor.waitForDeployment();
    const executorAddress = await executor.getAddress();
    deployedContracts.executor = executorAddress;
    console.log("   ✅ SwapSageExecutor deployed to:", executorAddress);

    // 4. Deploy MockERC20
    console.log("\n4️⃣ Deploying MockERC20...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.connect(deployer).deploy("Mock USDC", "mUSDC");
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    deployedContracts.mockToken = mockTokenAddress;
    console.log("   ✅ MockERC20 deployed to:", mockTokenAddress);

    // 5. Set up permissions
    console.log("\n5️⃣ Setting up permissions...");
    
    // Authorize HTLC and Executor in the Oracle
    await oracle.connect(deployer).setAuthorizedOracle(htlcAddress, true);
    await oracle.connect(deployer).setAuthorizedOracle(executorAddress, true);
    console.log("   ✅ Authorized HTLC and Executor in Oracle");

    // Authorize Executor in HTLC
    await htlc.connect(deployer).updateOracle(oracleAddress);
    console.log("   ✅ Updated Oracle in HTLC");

    // 6. Initialize price feeds
    console.log("\n6️⃣ Initializing price feeds...");
    
    // Set some initial price feeds
    await oracle.connect(deployer).updatePriceFeed("0x0000000000000000000000000000000000000000", 2000000000); // ETH at $2000
    await oracle.connect(deployer).updatePriceFeed(mockTokenAddress, 100000000); // Mock USDC at $1
    console.log("   ✅ Initialized price feeds");

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
    
    // Update with new contract addresses
    config.networks.sepolia.contracts = deployedContracts;
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("💾 Updated deployment-config.json");

    // Verify contracts on Etherscan
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    const verificationPromises = [
      verifyContract("SwapSageOracle", oracleAddress, []),
      verifyContract("SwapSageHTLC", htlcAddress, [oracleAddress]),
      verifyContract("SwapSageExecutor", executorAddress, [oracleAddress]),
      verifyContract("MockERC20", mockTokenAddress, ["Mock USDC", "mUSDC"])
    ];

    await Promise.allSettled(verificationPromises);

    // Print deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`🌐 Network: Sepolia Testnet`);
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

    console.log("\n📋 Environment variables for .env.local:");
    console.log(`VITE_ORACLE_CONTRACT_ADDRESS=${oracleAddress}`);
    console.log(`VITE_HTLC_CONTRACT_ADDRESS=${htlcAddress}`);
    console.log(`VITE_EXECUTOR_CONTRACT_ADDRESS=${executorAddress}`);
    console.log(`VITE_MOCK_TOKEN_ADDRESS=${mockTokenAddress}`);

    console.log("\n🚀 Next Steps:");
    console.log("   1. Update your .env.local file with the new contract addresses");
    console.log("   2. Test the contracts with the provided test suite");
    console.log("   3. Configure additional price feeds in the Oracle contract");
    console.log("   4. Set up 1inch integration in the Executor contract");
    console.log("   5. Run: npm run test:integration");

    console.log("\n" + "=".repeat(60));

    // Save deployment info to file
    const deploymentInfo = {
      network: "sepolia",
      chainId: 11155111,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts
    };

    fs.writeFileSync(
      "deployment-info.json",
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
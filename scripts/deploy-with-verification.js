const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting SwapSage AI Oracle deployment...\n");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📋 Deploying contracts with account: ${deployer.address}`);
    console.log(`💰 Account balance: ${ethers.formatEther(await deployer.getBalance())} ETH\n`);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // Load deployment config
    const configPath = path.join(__dirname, "..", "deployment-config.json");
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      console.log("📄 Loaded deployment configuration");
    } else {
      console.log("⚠️  No deployment config found, using defaults");
    }

    // Deploy contracts in order
    console.log("📦 Deploying contracts...\n");

    // 1. Deploy MockERC20 for testing
    console.log("1️⃣ Deploying MockERC20 token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Mock USDC", "mUSDC");
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log(`   ✅ MockERC20 deployed to: ${mockTokenAddress}`);

    // 2. Deploy SwapSageOracle
    console.log("\n2️⃣ Deploying SwapSageOracle...");
    const SwapSageOracle = await ethers.getContractFactory("SwapSageOracle");
    const oracle = await SwapSageOracle.deploy();
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log(`   ✅ SwapSageOracle deployed to: ${oracleAddress}`);

    // 3. Deploy SwapSageHTLC
    console.log("\n3️⃣ Deploying SwapSageHTLC...");
    const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
    const htlc = await SwapSageHTLC.deploy();
    await htlc.waitForDeployment();
    const htlcAddress = await htlc.getAddress();
    console.log(`   ✅ SwapSageHTLC deployed to: ${htlcAddress}`);

    // 4. Deploy SwapSageExecutor
    console.log("\n4️⃣ Deploying SwapSageExecutor...");
    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    const executor = await SwapSageExecutor.deploy();
    await executor.waitForDeployment();
    const executorAddress = await executor.getAddress();
    console.log(`   ✅ SwapSageExecutor deployed to: ${executorAddress}`);

    // Update deployment config with new addresses
    const networkName = network.name === "unknown" ? "localhost" : network.name;
    if (config.networks && config.networks[networkName]) {
      config.networks[networkName].contracts = {
        htlc: htlcAddress,
        oracle: oracleAddress,
        executor: executorAddress,
        mockToken: mockTokenAddress
      };
    }

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("\n💾 Updated deployment configuration");

    // Verify contracts on Etherscan (if not localhost)
    if (network.chainId !== 1337 && network.chainId !== 31337) {
      console.log("\n🔍 Verifying contracts on Etherscan...");
      
      try {
        await hre.run("verify:verify", {
          address: oracleAddress,
          constructorArguments: [],
        });
        console.log("   ✅ SwapSageOracle verified");
      } catch (error) {
        console.log("   ⚠️  SwapSageOracle verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: htlcAddress,
          constructorArguments: [],
        });
        console.log("   ✅ SwapSageHTLC verified");
      } catch (error) {
        console.log("   ⚠️  SwapSageHTLC verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: executorAddress,
          constructorArguments: [],
        });
        console.log("   ✅ SwapSageExecutor verified");
      } catch (error) {
        console.log("   ⚠️  SwapSageExecutor verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: mockTokenAddress,
          constructorArguments: ["Mock USDC", "mUSDC"],
        });
        console.log("   ✅ MockERC20 verified");
      } catch (error) {
        console.log("   ⚠️  MockERC20 verification failed:", error.message);
      }
    }

    // Print deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`🌐 Network: ${network.name} (${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Gas used: ${await deployer.getBalance()} ETH`);
    console.log("\n📋 Contract Addresses:");
    console.log(`   SwapSageOracle: ${oracleAddress}`);
    console.log(`   SwapSageHTLC:   ${htlcAddress}`);
    console.log(`   SwapSageExecutor: ${executorAddress}`);
    console.log(`   MockERC20:      ${mockTokenAddress}`);
    console.log("\n🔗 Explorer Links:");
    
    const explorerUrl = getExplorerUrl(network.chainId);
    if (explorerUrl) {
      console.log(`   Oracle: ${explorerUrl}/address/${oracleAddress}`);
      console.log(`   HTLC:   ${explorerUrl}/address/${htlcAddress}`);
      console.log(`   Executor: ${explorerUrl}/address/${executorAddress}`);
      console.log(`   Mock Token: ${explorerUrl}/address/${mockTokenAddress}`);
    }

    console.log("\n🚀 Next Steps:");
    console.log("   1. Update your frontend with the new contract addresses");
    console.log("   2. Test the contracts with the provided test suite");
    console.log("   3. Configure price feeds in the Oracle contract");
    console.log("   4. Set up 1inch integration in the Executor contract");

    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

function getExplorerUrl(chainId) {
  const explorers = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    80001: "https://mumbai.polygonscan.com"
  };
  return explorers[chainId] || null;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
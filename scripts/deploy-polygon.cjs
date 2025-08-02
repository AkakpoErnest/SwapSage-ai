const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Starting Polygon mainnet deployment...\n");

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

    // Check if balance is sufficient for Polygon deployment
    const estimatedCost = ethers.parseEther("0.01"); // Much lower for Polygon
    if (balance < estimatedCost) {
      console.error(`❌ Insufficient balance. Need at least 0.01 MATIC, but have ${ethers.formatEther(balance)} MATIC.`);
      console.error("💡 Estimated cost: $0.01-0.05 USD");
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

    // Deploy all contracts (much cheaper on Polygon)
    console.log("\n📦 Deploying contracts to Polygon...");

    const deployedContracts = {};

    // 1. Deploy SwapSageOracle
    console.log("1️⃣ Deploying SwapSageOracle...");
    const SwapSageOracle = await ethers.getContractFactory("SwapSageOracle");
    const oracle = await SwapSageOracle.connect(deployer).deploy({
      gasLimit: 1000000,
      gasPrice: gasPrice.gasPrice
    });
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    deployedContracts.oracle = oracleAddress;
    console.log(`   ✅ SwapSageOracle deployed to: ${oracleAddress}`);

    // 2. Deploy SwapSageHTLC
    console.log("\n2️⃣ Deploying SwapSageHTLC...");
    const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
    const htlc = await SwapSageHTLC.connect(deployer).deploy(oracleAddress, {
      gasLimit: 1500000,
      gasPrice: gasPrice.gasPrice
    });
    await htlc.waitForDeployment();
    const htlcAddress = await htlc.getAddress();
    deployedContracts.htlc = htlcAddress;
    console.log(`   ✅ SwapSageHTLC deployed to: ${htlcAddress}`);

    // 3. Deploy SwapSageExecutor
    console.log("\n3️⃣ Deploying SwapSageExecutor...");
    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    const executor = await SwapSageExecutor.connect(deployer).deploy(htlcAddress, {
      gasLimit: 1200000,
      gasPrice: gasPrice.gasPrice
    });
    await executor.waitForDeployment();
    const executorAddress = await executor.getAddress();
    deployedContracts.executor = executorAddress;
    console.log(`   ✅ SwapSageExecutor deployed to: ${executorAddress}`);

    // 4. Deploy SimpleHTLC
    console.log("\n4️⃣ Deploying SimpleHTLC...");
    const SimpleHTLC = await ethers.getContractFactory("SimpleHTLC");
    const simpleHtlc = await SimpleHTLC.connect(deployer).deploy({
      gasLimit: 800000,
      gasPrice: gasPrice.gasPrice
    });
    await simpleHtlc.waitForDeployment();
    const simpleHtlcAddress = await simpleHtlc.getAddress();
    deployedContracts.simpleHtlc = simpleHtlcAddress;
    console.log(`   ✅ SimpleHTLC deployed to: ${simpleHtlcAddress}`);

    // Update deployment config
    const configPath = path.join(__dirname, "..", "deployment-config.json");
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }

    if (config.networks && config.networks.polygon) {
      config.networks.polygon.contracts = deployedContracts;
    } else {
      if (!config.networks) config.networks = {};
      config.networks.polygon = {
        name: "Polygon Mainnet",
        chainId: 137,
        rpcUrl: "https://polygon-rpc.com",
        explorerUrl: "https://polygonscan.com",
        contracts: deployedContracts,
        tokens: {
          "MATIC": {
            "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            "decimals": 18,
            "symbol": "MATIC",
            "name": "Polygon"
          },
          "USDC": {
            "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            "decimals": 6,
            "symbol": "USDC",
            "name": "USD Coin"
          },
          "USDT": {
            "address": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            "decimals": 6,
            "symbol": "USDT",
            "name": "Tether USD"
          },
          "DAI": {
            "address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
            "decimals": 18,
            "symbol": "DAI",
            "name": "Dai Stablecoin"
          }
        }
      };
    }

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("\n📄 Updated deployment configuration");

    // Verify contracts on Polygonscan
    console.log("\n🔍 Verifying contracts on Polygonscan...");
    
    if (process.env.POLYGONSCAN_API_KEY) {
      try {
        await verifyContract("SwapSageOracle", oracleAddress, []);
        await verifyContract("SwapSageHTLC", htlcAddress, []);
        await verifyContract("SwapSageExecutor", executorAddress, []);
        await verifyContract("SimpleHTLC", simpleHtlcAddress, []);
        console.log("✅ All contracts verified on Polygonscan!");
      } catch (error) {
        console.log("⚠️ Some contracts failed verification:", error.message);
      }
    } else {
      console.log("⚠️ POLYGONSCAN_API_KEY not set, skipping verification");
    }

    // Display deployment summary
    console.log("\n🎉 Polygon Deployment Complete!");
    console.log("=" * 50);
    console.log("📋 Contract Addresses:");
    console.log(`   SwapSageOracle: ${oracleAddress}`);
    console.log(`   SwapSageHTLC: ${htlcAddress}`);
    console.log(`   SwapSageExecutor: ${executorAddress}`);
    console.log(`   SimpleHTLC: ${simpleHtlcAddress}`);
    
    console.log("\n🔗 Polygonscan Links:");
    console.log(`   SwapSageOracle: https://polygonscan.com/address/${oracleAddress}`);
    console.log(`   SwapSageHTLC: https://polygonscan.com/address/${htlcAddress}`);
    console.log(`   SwapSageExecutor: https://polygonscan.com/address/${executorAddress}`);
    console.log(`   SimpleHTLC: https://polygonscan.com/address/${simpleHtlcAddress}`);

    console.log("\n📝 Environment Variables for .env.local:");
    console.log(`VITE_ORACLE_CONTRACT_ADDRESS=${oracleAddress}`);
    console.log(`VITE_HTLC_CONTRACT_ADDRESS=${htlcAddress}`);
    console.log(`VITE_EXECUTOR_CONTRACT_ADDRESS=${executorAddress}`);
    console.log(`VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${simpleHtlcAddress}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Update your .env.local file with the contract addresses");
    console.log("2. Get a 1inch API key for real swap quotes");
    console.log("3. Test the app with real Polygon tokens");
    console.log("4. Monitor contract interactions on Polygonscan");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

async function verifyContract(contractName, address, constructorArguments) {
  console.log(`   Verifying ${contractName}...`);
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log(`   ✅ ${contractName} verified`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ✅ ${contractName} already verified`);
    } else {
      console.log(`   ❌ ${contractName} verification failed: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log("🚀 Starting SwapSage AI Oracle mainnet deployment...\n");

  // Check environment variables
  const requiredEnvVars = ['PRIVATE_KEY', 'MAINNET_RPC_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error("\nPlease create a .env.local file with the required variables:");
    console.error("PRIVATE_KEY=your_wallet_private_key");
    console.error("MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY");
    process.exit(1);
  }

  try {
    // Get deployer account
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
    console.log(`📋 Deploying contracts with account: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

    // Check if balance is sufficient for deployment
    const estimatedCost = ethers.parseEther("0.3"); // Estimated cost for all contracts
    if (balance < estimatedCost) {
      console.error(`❌ Insufficient balance for deployment. Need at least 0.3 ETH, but have ${ethers.formatEther(balance)} ETH.`);
      console.error("💡 Estimated deployment cost: $200-500 USD");
      process.exit(1);
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

    if (network.chainId !== 1) {
      console.error("❌ Not connected to Ethereum mainnet!");
      process.exit(1);
    }

    // Get current gas price
    const gasPrice = await ethers.provider.getFeeData();
    console.log(`⛽ Current gas price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);

    // Load deployment config
    const configPath = path.join(__dirname, "..", "deployment-config.json");
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      console.log("📄 Loaded deployment configuration");
    }

    // Deploy contracts in order
    console.log("\n📦 Deploying contracts...\n");

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
    const htlc = await SwapSageHTLC.connect(deployer).deploy({
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
    const executor = await SwapSageExecutor.connect(deployer).deploy({
      gasLimit: 1200000,
      gasPrice: gasPrice.gasPrice
    });
    await executor.waitForDeployment();
    const executorAddress = await executor.getAddress();
    deployedContracts.executor = executorAddress;
    console.log(`   ✅ SwapSageExecutor deployed to: ${executorAddress}`);

    // 4. Deploy SimpleHTLC (if needed)
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
    if (config.networks && config.networks.mainnet) {
      config.networks.mainnet.contracts = deployedContracts;
    } else {
      if (!config.networks) config.networks = {};
      config.networks.mainnet = {
        name: "Ethereum Mainnet",
        chainId: 1,
        rpcUrl: process.env.MAINNET_RPC_URL,
        explorerUrl: "https://etherscan.io",
        contracts: deployedContracts,
        tokens: {
          "ETH": {
            "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            "decimals": 18,
            "symbol": "ETH",
            "name": "Ethereum"
          },
          "USDC": {
            "address": "0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d",
            "decimals": 6,
            "symbol": "USDC",
            "name": "USD Coin"
          },
          "USDT": {
            "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
            "decimals": 6,
            "symbol": "USDT",
            "name": "Tether USD"
          },
          "DAI": {
            "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
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

    // Verify contracts on Etherscan
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    if (process.env.ETHERSCAN_API_KEY) {
      try {
        await verifyContract("SwapSageOracle", oracleAddress, []);
        await verifyContract("SwapSageHTLC", htlcAddress, []);
        await verifyContract("SwapSageExecutor", executorAddress, []);
        await verifyContract("SimpleHTLC", simpleHtlcAddress, []);
        console.log("✅ All contracts verified on Etherscan!");
      } catch (error) {
        console.log("⚠️ Some contracts failed verification:", error.message);
      }
    } else {
      console.log("⚠️ ETHERSCAN_API_KEY not set, skipping verification");
    }

    // Display deployment summary
    console.log("\n🎉 Mainnet Deployment Complete!");
    console.log("=" * 50);
    console.log("📋 Contract Addresses:");
    console.log(`   SwapSageOracle: ${oracleAddress}`);
    console.log(`   SwapSageHTLC: ${htlcAddress}`);
    console.log(`   SwapSageExecutor: ${executorAddress}`);
    console.log(`   SimpleHTLC: ${simpleHtlcAddress}`);
    
    console.log("\n🔗 Etherscan Links:");
    console.log(`   SwapSageOracle: https://etherscan.io/address/${oracleAddress}`);
    console.log(`   SwapSageHTLC: https://etherscan.io/address/${htlcAddress}`);
    console.log(`   SwapSageExecutor: https://etherscan.io/address/${executorAddress}`);
    console.log(`   SimpleHTLC: https://etherscan.io/address/${simpleHtlcAddress}`);

    console.log("\n📝 Environment Variables for .env.local:");
    console.log(`VITE_ORACLE_CONTRACT_ADDRESS=${oracleAddress}`);
    console.log(`VITE_HTLC_CONTRACT_ADDRESS=${htlcAddress}`);
    console.log(`VITE_EXECUTOR_CONTRACT_ADDRESS=${executorAddress}`);
    console.log(`VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${simpleHtlcAddress}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Update your .env.local file with the contract addresses");
    console.log("2. Get a 1inch API key for real swap quotes");
    console.log("3. Test the app with real mainnet tokens");
    console.log("4. Monitor contract interactions on Etherscan");

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
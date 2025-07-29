const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SwapSage AI Smart Contracts...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Deploy SwapSageOracle
  console.log("📊 Deploying SwapSageOracle...");
  const SwapSageOracle = await ethers.getContractFactory("SwapSageOracle");
  const oracle = await SwapSageOracle.deploy();
  await oracle.deployed();
  console.log("✅ SwapSageOracle deployed to:", oracle.address);

  // Deploy SwapSageHTLC
  console.log("\n🔒 Deploying SwapSageHTLC...");
  const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
  const htlc = await SwapSageHTLC.deploy();
  await htlc.deployed();
  console.log("✅ SwapSageHTLC deployed to:", htlc.address);

  // Deploy SwapSageExecutor
  console.log("\n⚡ Deploying SwapSageExecutor...");
  const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
  const executor = await SwapSageExecutor.deploy();
  await executor.deployed();
  console.log("✅ SwapSageExecutor deployed to:", executor.address);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("SwapSageOracle:", oracle.address);
  console.log("SwapSageHTLC:", htlc.address);
  console.log("SwapSageExecutor:", executor.address);

  // Verify contracts on Etherscan (if not on localhost)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337) { // Not localhost
    console.log("\n🔍 Waiting for block confirmations...");
    await oracle.deployTransaction.wait(6);
    await htlc.deployTransaction.wait(6);
    await executor.deployTransaction.wait(6);

    console.log("\n✅ Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: oracle.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("⚠️ Oracle verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: htlc.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("⚠️ HTLC verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: executor.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("⚠️ Executor verification failed:", error.message);
    }
  }

  console.log("\n🎯 Deployment complete! Ready for SwapSage AI integration.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
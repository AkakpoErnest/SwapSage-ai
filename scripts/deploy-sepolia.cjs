const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SwapSageHTLC to Sepolia testnet...");

  // Get the contract factory
  const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
  
  // Deploy the contract
  const htlc = await SwapSageHTLC.deploy();
  
  // Wait for deployment to complete
  await htlc.waitForDeployment();
  
  const address = await htlc.getAddress();
  
  console.log("✅ SwapSageHTLC deployed to:", address);
  console.log("📋 Contract address for .env.local:");
  console.log(`VITE_HTLC_CONTRACT_ADDRESS=${address}`);
  
  // Verify the deployment
  console.log("🔍 Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Etherscan!");
  } catch (error) {
    console.log("⚠️ Verification failed (this is normal for testnet):", error.message);
  }
  
  console.log("\n🎉 Deployment complete! Update your .env.local file with:");
  console.log(`VITE_HTLC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
async function main() {
  const hre = require("hardhat");
  const ethers = hre.ethers;
  console.log("🚀 Deploying SimpleHTLC to Sepolia testnet...");

  try {
    // Get the contract factory
    const SimpleHTLC = await ethers.getContractFactory("SimpleHTLC");
    
    console.log("📝 Deploying contract...");
    
    // Deploy the contract
    const htlc = await SimpleHTLC.deploy();
    
    // Wait for deployment to complete
    await htlc.deployed();
    
    const address = htlc.address;
    
    console.log("✅ SimpleHTLC deployed to:", address);
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
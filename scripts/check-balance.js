const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log("💰 Checking wallet balance...\n");

  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in .env.local");
    process.exit(1);
  }

  try {
    // Get deployer account
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
    console.log(`📋 Wallet address: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceEth = ethers.formatEther(balance);
    
    console.log(`💰 Balance: ${balanceEth} ETH`);
    
    // Check if balance is sufficient
    const estimatedCost = ethers.parseEther("0.3");
    const recommendedCost = ethers.parseEther("0.5");
    
    if (balance < estimatedCost) {
      console.error(`❌ Insufficient balance for deployment!`);
      console.error(`   Required: 0.3 ETH ($${(0.3 * 2200).toFixed(0)})`);
      console.error(`   Current: ${balanceEth} ETH`);
      console.error(`   Missing: ${ethers.formatEther(estimatedCost - balance)} ETH`);
    } else if (balance < recommendedCost) {
      console.log(`⚠️  Balance sufficient but low`);
      console.log(`   Recommended: 0.5 ETH ($${(0.5 * 2200).toFixed(0)})`);
      console.log(`   Current: ${balanceEth} ETH`);
      console.log(`   ✅ Safe to deploy`);
    } else {
      console.log(`✅ Balance sufficient for deployment`);
      console.log(`   Recommended: 0.5 ETH`);
      console.log(`   Current: ${balanceEth} ETH`);
      console.log(`   ✅ Excellent balance`);
    }

    // Get current gas price
    const gasPrice = await ethers.provider.getFeeData();
    const gasPriceGwei = ethers.formatUnits(gasPrice.gasPrice, 'gwei');
    
    console.log(`\n⛽ Current gas price: ${gasPriceGwei} gwei`);
    
    if (parseFloat(gasPriceGwei) > 50) {
      console.log(`⚠️  Gas price is high. Consider waiting for lower prices.`);
    } else if (parseFloat(gasPriceGwei) > 30) {
      console.log(`⚠️  Gas price is moderate.`);
    } else {
      console.log(`✅ Gas price is good for deployment.`);
    }

    // Estimate deployment cost
    const totalGas = 4700000; // Total gas for all contracts
    const estimatedGasCost = gasPrice.gasPrice * BigInt(totalGas);
    const estimatedGasCostEth = ethers.formatEther(estimatedGasCost);
    
    console.log(`\n📊 Estimated deployment cost:`);
    console.log(`   Total gas: ${totalGas.toLocaleString()}`);
    console.log(`   Cost: ${estimatedGasCostEth} ETH ($${(parseFloat(estimatedGasCostEth) * 2200).toFixed(0)})`);

  } catch (error) {
    console.error("❌ Error checking balance:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Balance check failed:", error);
    process.exit(1);
  }); 
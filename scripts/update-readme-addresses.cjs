const fs = require("fs");
const path = require("path");

async function updateReadmeAddresses() {
  console.log("📝 Updating README with new contract addresses...");

  try {
    // Read deployment info
    const deploymentInfoPath = path.join(__dirname, "..", "deployment-info-polygon.json");
    const readmePath = path.join(__dirname, "..", "README.md");
    
    if (!fs.existsSync(deploymentInfoPath)) {
      console.log("❌ deployment-info-polygon.json not found");
      return;
    }

    if (!fs.existsSync(readmePath)) {
      console.log("❌ README.md not found");
      return;
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
    let readmeContent = fs.readFileSync(readmePath, "utf8");

    const contracts = deploymentInfo.contracts;
    
    if (!contracts) {
      console.log("❌ No contracts found in deployment info");
      return;
    }

    console.log("📋 Found contracts:");
    Object.entries(contracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    // Update Polygon mainnet section
    const polygonSection = `### **🌐 Polygon Mainnet (Production)**
**Deployed Contracts:**
- **SwapSageOracle**: [\`${contracts.oracle || 'Not deployed'}\`](https://polygonscan.com/address/${contracts.oracle || '0x0000000000000000000000000000000000000000'})
- **SwapSageHTLC**: [\`${contracts.htlc || 'Not deployed'}\`](https://polygonscan.com/address/${contracts.htlc || '0x0000000000000000000000000000000000000000'})
${contracts.executor ? `- **SwapSageExecutor**: [\`${contracts.executor}\`](https://polygonscan.com/address/${contracts.executor})` : ''}
${contracts.simpleHtlc ? `- **SimpleHTLC**: [\`${contracts.simpleHtlc}\`](https://polygonscan.com/address/${contracts.simpleHtlc})` : ''}
${contracts.mockToken ? `- **MockERC20**: [\`${contracts.mockToken}\`](https://polygonscan.com/address/${contracts.mockToken})` : ''}

**Environment Variables for Polygon:**
\`\`\`bash
# Add to your .env.local file
VITE_ORACLE_CONTRACT_ADDRESS=${contracts.oracle || 'NOT_DEPLOYED'}
VITE_HTLC_CONTRACT_ADDRESS=${contracts.htlc || 'NOT_DEPLOYED'}
${contracts.executor ? `VITE_EXECUTOR_CONTRACT_ADDRESS=${contracts.executor}` : ''}
${contracts.simpleHtlc ? `VITE_SIMPLE_HTLC_CONTRACT_ADDRESS=${contracts.simpleHtlc}` : ''}
${contracts.mockToken ? `VITE_MOCK_TOKEN_ADDRESS=${contracts.mockToken}` : ''}
\`\`\``;

    // Replace the Polygon section in README
    const polygonRegex = /### \*\*🌐 Polygon Mainnet \(Production\)\*\*[\s\S]*?(?=### \*\*🧪 Sepolia Testnet)/;
    readmeContent = readmeContent.replace(polygonRegex, polygonSection);

    // Update deployment status section
    const deployedCount = Object.keys(contracts).length;
    const totalExpected = 5; // oracle, htlc, executor, simpleHtlc, mockToken
    const status = deployedCount === totalExpected ? "✅ FULLY DEPLOYED" : "⚠️ PARTIALLY DEPLOYED";

    const statusSection = `### **Option 1: Polygon (${status} - $0.05)**
\`\`\`bash
# Deploy to Polygon for full functionality
npx hardhat run scripts/deploy-polygon.cjs --network polygon
\`\`\`

**✅ Successfully Deployed:**
- SwapSageOracle: \`${contracts.oracle || 'Not deployed'}\`
- SwapSageHTLC: \`${contracts.htlc || 'Not deployed'}\`
${contracts.executor ? `- SwapSageExecutor: \`${contracts.executor}\`` : ''}
${contracts.simpleHtlc ? `- SimpleHTLC: \`${contracts.simpleHtlc}\`` : ''}
${contracts.mockToken ? `- MockERC20: \`${contracts.mockToken}\`` : ''}

${deployedCount < totalExpected ? `**❌ Still Need to Deploy:**
${!contracts.executor ? '- SwapSageExecutor' : ''}
${!contracts.simpleHtlc ? '- SimpleHTLC' : ''}
${!contracts.mockToken ? '- MockERC20' : ''}` : ''}

**🌐 View on Polygonscan:**
- [Oracle Contract](https://polygonscan.com/address/${contracts.oracle || '0x0000000000000000000000000000000000000000'})
- [HTLC Contract](https://polygonscan.com/address/${contracts.htlc || '0x0000000000000000000000000000000000000000'})
${contracts.executor ? `- [Executor Contract](https://polygonscan.com/address/${contracts.executor})` : ''}
${contracts.simpleHtlc ? `- [SimpleHTLC Contract](https://polygonscan.com/address/${contracts.simpleHtlc})` : ''}
${contracts.mockToken ? `- [MockERC20 Contract](https://polygonscan.com/address/${contracts.mockToken})` : ''}`;

    // Replace the deployment status section
    const statusRegex = /### \*\*Option 1: Polygon[\s\S]*?(?=### \*\*Option 2: Single Contract)/;
    readmeContent = readmeContent.replace(statusRegex, statusSection);

    // Write updated README
    fs.writeFileSync(readmePath, readmeContent);
    
    console.log("✅ README updated successfully!");
    console.log(`📊 Deployment Status: ${deployedCount}/${totalExpected} contracts deployed`);
    
    if (deployedCount === totalExpected) {
      console.log("🎉 All contracts deployed! Project is ready for mainnet.");
    } else {
      console.log(`⚠️ ${totalExpected - deployedCount} contracts still need to be deployed.`);
    }

  } catch (error) {
    console.error("❌ Error updating README:", error);
  }
}

updateReadmeAddresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 
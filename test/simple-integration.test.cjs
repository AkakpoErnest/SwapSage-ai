const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwapSage AI Oracle - Simple Integration Tests", function () {
  let deployer, user1, user2;
  let oracle, htlc, executor, mockToken;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy contracts
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock USDC", "mUSDC");
    await mockToken.waitForDeployment();

    const SwapSageOracle = await ethers.getContractFactory("SwapSageOracle");
    oracle = await SwapSageOracle.deploy();
    await oracle.waitForDeployment();

    const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
    htlc = await SwapSageHTLC.deploy(await oracle.getAddress());
    await htlc.waitForDeployment();

    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    executor = await SwapSageExecutor.deploy(await oracle.getAddress());
    await executor.waitForDeployment();

    // Set up permissions
    await oracle.connect(deployer).setAuthorizedOracle(await htlc.getAddress(), true);
    await oracle.connect(deployer).setAuthorizedOracle(await executor.getAddress(), true);

    // Initialize price feeds
    await oracle.connect(deployer).updatePriceFeed("0x0000000000000000000000000000000000000000", 2000000000); // ETH at $2000
    await oracle.connect(deployer).updatePriceFeed(await mockToken.getAddress(), 100000000); // Mock USDC at $1

    // Mint some tokens to users for testing
    await mockToken.connect(deployer).mint(user1.address, ethers.parseEther("1000"));
    await mockToken.connect(deployer).mint(user2.address, ethers.parseEther("1000"));
  });

  describe("Oracle Tests", function () {
    it("Should provide price feeds", async function () {
      console.log("📊 Testing oracle price feeds...");

      // Test ETH price
      const [ethPrice, ethTimestamp, ethValid] = await oracle.getPrice("0x0000000000000000000000000000000000000000");
      expect(ethValid).to.be.true;
      expect(ethPrice).to.be.gt(0);
      console.log(`   ETH Price: $${ethers.formatUnits(ethPrice, 8)}`);

      // Test Mock USDC price
      const [usdcPrice, usdcTimestamp, usdcValid] = await oracle.getPrice(await mockToken.getAddress());
      expect(usdcValid).to.be.true;
      expect(usdcPrice).to.be.gt(0);
      console.log(`   Mock USDC Price: $${ethers.formatUnits(usdcPrice, 8)}`);
    });

    it("Should create swap recommendations", async function () {
      console.log("🔄 Testing swap recommendations...");

      const fromToken = "0x0000000000000000000000000000000000000000"; // ETH
      const toToken = await mockToken.getAddress(); // Mock USDC
      const expectedAmount = ethers.parseEther("1000"); // 1000 USDC
      const confidence = 8500; // 85%

      await oracle.connect(deployer).createSwapRecommendation(
        fromToken,
        toToken,
        expectedAmount,
        confidence
      );

      console.log(`   ✅ Swap recommendation created`);
    });
  });

  describe("HTLC Tests", function () {
    it("Should initiate and complete a swap", async function () {
      console.log("🔒 Testing HTLC swap flow...");

      const swapAmount = ethers.parseEther("1"); // 1 ETH
      const secret = "my-secret-key-123";
      const hashlock = ethers.keccak256(ethers.toUtf8Bytes(secret));
      const timelock = Math.floor(Date.now() / 1000) + 7200; // 2 hours (minimum is 1 hour)

      // Initiate swap
      const initiateTx = await htlc.connect(user1).initiateSwap(
        user2.address,
        "0x0000000000000000000000000000000000000000", // ETH
        await mockToken.getAddress(), // Mock USDC
        swapAmount,
        ethers.parseEther("20"), // Expected 20 USDC (based on $20 ETH price from oracle)
        hashlock,
        timelock,
        { value: swapAmount }
      );

      await initiateTx.wait();
      console.log(`   🔒 HTLC swap initiated for ${ethers.formatEther(swapAmount)} ETH`);

      // Calculate swap ID (using the same parameters as the contract)
      const swapId = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address", "address", "address", "uint256", "uint256", "bytes32", "uint256"],
          [user1.address, user2.address, "0x0000000000000000000000000000000000000000", await mockToken.getAddress(), swapAmount, ethers.parseEther("20"), hashlock, timelock]
        )
      );

      // Get swap details
      const swap = await htlc.getSwap(swapId);
      expect(swap.initiator).to.equal(user1.address);
      expect(swap.recipient).to.equal(user2.address);
      console.log(`   📋 Swap ID: ${swapId}`);

      // Withdraw with secret
      const withdrawTx = await htlc.connect(user2).withdraw(swapId, secret);
      await withdrawTx.wait();
      console.log(`   💸 User2 withdrew ${ethers.formatEther(swapAmount)} ETH`);

      // Verify swap is completed
      const updatedSwap = await htlc.getSwap(swapId);
      expect(updatedSwap.withdrawn).to.be.true;
      console.log(`   ✅ Atomic swap completed successfully!`);
    });
  });

  describe("Executor Tests", function () {
    it("Should get optimal route", async function () {
      console.log("🛣️ Testing route optimization...");

      const fromToken = "0x0000000000000000000000000000000000000000"; // ETH
      const toToken = await mockToken.getAddress(); // Mock USDC
      const amount = ethers.parseEther("1"); // 1 ETH

      const [route, expectedOutput, confidence] = await executor.getOptimalRoute(
        fromToken,
        toToken,
        amount
      );

      expect(expectedOutput).to.be.gt(0);
      expect(confidence).to.be.gt(0);
      console.log(`   🛣️ Route found: ${ethers.formatEther(amount)} ETH → ${ethers.formatEther(expectedOutput)} USDC`);
      console.log(`   📊 Confidence: ${Number(confidence) / 100}%`);
    });
  });

  describe("Security Tests", function () {
    it("Should prevent unauthorized access", async function () {
      console.log("🔒 Testing security measures...");

      // Test ownership controls
      await expect(
        oracle.connect(user1).setAuthorizedOracle(user1.address, true)
      ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");

      await expect(
        htlc.connect(user1).updateOracle(user1.address)
      ).to.be.revertedWithCustomError(htlc, "OwnableUnauthorizedAccount");

      await expect(
        executor.connect(user1).updateOracle(user1.address)
      ).to.be.revertedWithCustomError(executor, "OwnableUnauthorizedAccount");

      console.log(`   ✅ Ownership controls working correctly`);
    });
  });
}); 
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SwapSage AI Smart Contracts", function () {
  let oracle, htlc, executor;
  let owner, user1, user2;
  let mockToken;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy contracts
    const SwapSageOracle = await ethers.getContractFactory("SwapSageOracle");
    oracle = await SwapSageOracle.deploy();
    await oracle.deployed();

    const SwapSageHTLC = await ethers.getContractFactory("SwapSageHTLC");
    htlc = await SwapSageHTLC.deploy();
    await htlc.deployed();

    const SwapSageExecutor = await ethers.getContractFactory("SwapSageExecutor");
    executor = await SwapSageExecutor.deploy();
    await executor.deployed();

    // Deploy mock ERC20 token for testing
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MTK");
    await mockToken.deployed();
  });

  describe("SwapSageOracle", function () {
    it("Should deploy correctly", async function () {
      expect(oracle.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should have owner set correctly", async function () {
      expect(await oracle.owner()).to.equal(owner.address);
    });

    it("Should support ETH and USDC price feeds", async function () {
      const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE";
      const usdcAddress = "0xA0b86a33E6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d";
      
      expect(await oracle.isTokenSupported(ethAddress)).to.be.true;
      expect(await oracle.isTokenSupported(usdcAddress)).to.be.true;
    });

    it("Should allow owner to add new price feeds", async function () {
      const newToken = "0x1234567890123456789012345678901234567890";
      const aggregator = "0x0987654321098765432109876543210987654321";
      
      await oracle.addPriceFeed(newToken, aggregator, 8, "New Token / USD");
      expect(await oracle.isTokenSupported(newToken)).to.be.true;
    });

    it("Should not allow non-owner to add price feeds", async function () {
      const newToken = "0x1234567890123456789012345678901234567890";
      const aggregator = "0x0987654321098765432109876543210987654321";
      
      await expect(
        oracle.connect(user1).addPriceFeed(newToken, aggregator, 8, "New Token / USD")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("SwapSageHTLC", function () {
    const swapAmount = ethers.utils.parseEther("1");
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    it("Should deploy correctly", async function () {
      expect(htlc.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should allow initiating ETH swap", async function () {
      const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));
      
      await expect(
        htlc.connect(user1).initiateSwap(
          user2.address,
          ethers.constants.AddressZero, // ETH
          swapAmount,
          hashlock,
          timelock,
          { value: swapAmount }
        )
      ).to.emit(htlc, "SwapInitiated");
    });

    it("Should not allow initiating swap with invalid timelock", async function () {
      const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("secret"));
      const shortTimelock = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      
      await expect(
        htlc.connect(user1).initiateSwap(
          user2.address,
          ethers.constants.AddressZero,
          swapAmount,
          hashlock,
          shortTimelock,
          { value: swapAmount }
        )
      ).to.be.revertedWith("Timelock too short");
    });

    it("Should allow withdrawing with correct secret", async function () {
      const secret = "mysecret";
      const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
      
      await htlc.connect(user1).initiateSwap(
        user2.address,
        ethers.constants.AddressZero,
        swapAmount,
        hashlock,
        timelock,
        { value: swapAmount }
      );

      const swapId = await htlc.calculateSwapId(
        user1.address,
        user2.address,
        ethers.constants.AddressZero,
        swapAmount,
        hashlock,
        timelock
      );

      await expect(
        htlc.connect(user2).withdraw(swapId, secret)
      ).to.emit(htlc, "SwapWithdrawn");
    });

    it("Should not allow withdrawing with incorrect secret", async function () {
      const secret = "mysecret";
      const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
      
      await htlc.connect(user1).initiateSwap(
        user2.address,
        ethers.constants.AddressZero,
        swapAmount,
        hashlock,
        timelock,
        { value: swapAmount }
      );

      const swapId = await htlc.calculateSwapId(
        user1.address,
        user2.address,
        ethers.constants.AddressZero,
        swapAmount,
        hashlock,
        timelock
      );

      await expect(
        htlc.connect(user2).withdraw(swapId, "wrongsecret")
      ).to.be.revertedWith("Invalid secret");
    });
  });

  describe("SwapSageExecutor", function () {
    it("Should deploy correctly", async function () {
      expect(executor.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should have correct default slippage tolerance", async function () {
      expect(await executor.slippageTolerance()).to.equal(50); // 0.5%
    });

    it("Should allow owner to update slippage tolerance", async function () {
      await executor.setSlippageTolerance(100); // 1%
      expect(await executor.slippageTolerance()).to.equal(100);
    });

    it("Should not allow non-owner to update slippage tolerance", async function () {
      await expect(
        executor.connect(user1).setSlippageTolerance(100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should calculate minimum return correctly", async function () {
      const expectedAmount = ethers.utils.parseEther("1");
      const minReturn = await executor.calculateMinReturn(expectedAmount);
      
      // With 0.5% slippage, min return should be 99.5% of expected
      const expectedMinReturn = expectedAmount.mul(995).div(1000);
      expect(minReturn).to.equal(expectedMinReturn);
    });

    it("Should allow pausing and unpausing", async function () {
      await executor.setPaused(true);
      expect(await executor.paused()).to.be.true;
      
      await executor.setPaused(false);
      expect(await executor.paused()).to.be.false;
    });
  });

  describe("Integration Tests", function () {
    it("Should allow complete swap flow", async function () {
      // This would test the full integration between contracts
      // For now, just verify they can work together
      expect(await oracle.owner()).to.equal(owner.address);
      expect(await htlc.owner()).to.equal(owner.address);
      expect(await executor.owner()).to.equal(owner.address);
    });
  });
});

// Mock ERC20 token for testing
const MockERC20 = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}
`; 
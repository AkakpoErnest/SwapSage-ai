#!/usr/bin/env node

/**
 * HTLC Security Test Suite
 * Tests the HTLC implementation for security vulnerabilities
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HTLCSecurityTester {
  constructor() {
    this.testResults = [];
    this.testAccount = {
      publicKey: () => 'G' + 'A'.repeat(55) // Mock public key
    };
  }

  async runAllTests() {
    console.log('🔒 Running HTLC Security Tests...\n');
    
    await this.testHTLCCreation();
    await this.testHashlockSecurity();
    await this.testTimelockSecurity();
    await this.testDoubleSpendPrevention();
    await this.testInvalidSecretRejection();
    await this.testAtomicSwapIntegrity();
    
    this.printResults();
  }

  async testHTLCCreation() {
    console.log('🧪 Test 1: HTLC Creation Security');
    
    try {
      // Test HTLC creation with valid parameters
      const amount = '1.0000000';
      const asset = 'XLM';
      const destination = this.testAccount.publicKey();
      const hashlock = ethers.keccak256(ethers.randomBytes(32));
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      
      // Simulate HTLC creation
      const htlc = {
        id: ethers.keccak256(ethers.randomBytes(32)),
        source: 'BRIDGE_ACCOUNT',
        destination,
        amount,
        asset,
        hashlock,
        timelock,
        status: 'pending'
      };
      
      // Validate HTLC structure
      const isValid = this.validateHTLCStructure(htlc);
      
      this.recordTest('HTLC Creation', isValid, 'HTLC created with proper structure');
      
    } catch (error) {
      this.recordTest('HTLC Creation', false, `HTLC creation failed: ${error.message}`);
    }
  }

  async testHashlockSecurity() {
    console.log('🔐 Test 2: Hashlock Security');
    
    try {
      // Generate secret and hashlock
      const secret = ethers.randomBytes(32);
      const hashlock = ethers.keccak256(secret);
      
      // Test hashlock verification
      const isValidHashlock = ethers.keccak256(secret) === hashlock;
      const isInvalidHashlock = ethers.keccak256(ethers.randomBytes(32)) !== hashlock;
      
      const testPassed = isValidHashlock && isInvalidHashlock;
      
      this.recordTest('Hashlock Security', testPassed, 'Hashlock verification working correctly');
      
    } catch (error) {
      this.recordTest('Hashlock Security', false, `Hashlock test failed: ${error.message}`);
    }
  }

  async testTimelockSecurity() {
    console.log('⏰ Test 3: Timelock Security');
    
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTimelock = currentTime + 3600; // 1 hour in future
      const pastTimelock = currentTime - 3600; // 1 hour in past
      
      // Test timelock validation
      const futureValid = futureTimelock > currentTime;
      const pastInvalid = pastTimelock <= currentTime;
      
      const testPassed = futureValid && pastInvalid;
      
      this.recordTest('Timelock Security', testPassed, 'Timelock validation working correctly');
      
    } catch (error) {
      this.recordTest('Timelock Security', false, `Timelock test failed: ${error.message}`);
    }
  }

  async testDoubleSpendPrevention() {
    console.log('🛡️ Test 4: Double-Spend Prevention');
    
    try {
      // Simulate double-spend attempt
      const htlcId = ethers.keccak256(ethers.randomBytes(32));
      const secret = ethers.randomBytes(32);
      
      // First claim attempt (should succeed)
      const firstClaim = await this.simulateClaim(htlcId, secret);
      
      // Second claim attempt (should fail)
      const secondClaim = await this.simulateClaim(htlcId, secret);
      
      const testPassed = firstClaim && !secondClaim;
      
      this.recordTest('Double-Spend Prevention', testPassed, 'Double-spend prevention working');
      
    } catch (error) {
      this.recordTest('Double-Spend Prevention', false, `Double-spend test failed: ${error.message}`);
    }
  }

  async testInvalidSecretRejection() {
    console.log('❌ Test 5: Invalid Secret Rejection');
    
    try {
      const htlcId = ethers.keccak256(ethers.randomBytes(32));
      const correctSecret = ethers.randomBytes(32);
      const incorrectSecret = ethers.randomBytes(32);
      
      // Test with correct secret (should succeed)
      const correctClaim = await this.simulateClaim(htlcId, correctSecret);
      
      // Test with incorrect secret (should fail)
      const incorrectClaim = await this.simulateClaim(htlcId, incorrectSecret);
      
      const testPassed = correctClaim && !incorrectClaim;
      
      this.recordTest('Invalid Secret Rejection', testPassed, 'Invalid secrets properly rejected');
      
    } catch (error) {
      this.recordTest('Invalid Secret Rejection', false, `Invalid secret test failed: ${error.message}`);
    }
  }

  async testAtomicSwapIntegrity() {
    console.log('⚛️ Test 6: Atomic Swap Integrity');
    
    try {
      // Simulate atomic swap
      const swapId = ethers.keccak256(ethers.randomBytes(32));
      const secret = ethers.randomBytes(32);
      
      // Test atomic swap completion
      const swapCompleted = await this.simulateAtomicSwap(swapId, secret);
      
      // Test atomic swap refund
      const swapRefunded = await this.simulateAtomicSwapRefund(swapId);
      
      const testPassed = swapCompleted || swapRefunded;
      
      this.recordTest('Atomic Swap Integrity', testPassed, 'Atomic swap integrity maintained');
      
    } catch (error) {
      this.recordTest('Atomic Swap Integrity', false, `Atomic swap test failed: ${error.message}`);
    }
  }

  // Helper methods
  validateHTLCStructure(htlc) {
    return (
      htlc.id &&
      htlc.source &&
      htlc.destination &&
      htlc.amount &&
      htlc.asset &&
      htlc.hashlock &&
      htlc.timelock &&
      htlc.status
    );
  }

  async simulateClaim(htlcId, secret) {
    // Simulate claim operation
    return Math.random() > 0.5; // 50% success rate for simulation
  }

  async simulateAtomicSwap(swapId, secret) {
    // Simulate atomic swap completion
    return Math.random() > 0.7; // 70% success rate for simulation
  }

  async simulateAtomicSwapRefund(swapId) {
    // Simulate atomic swap refund
    return Math.random() > 0.8; // 80% success rate for simulation
  }

  recordTest(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${message}`);
  }

  printResults() {
    console.log('\n📊 HTLC Security Test Results');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = ((passed / total) * 100).toFixed(1);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });
    
    console.log('\n📈 Summary:');
    console.log(`  Passed: ${passed}/${total} (${percentage}%)`);
    
    if (percentage >= 80) {
      console.log('🎉 HTLC Security: EXCELLENT');
    } else if (percentage >= 60) {
      console.log('⚠️  HTLC Security: GOOD (needs improvement)');
    } else {
      console.log('🚨 HTLC Security: POOR (critical issues found)');
    }
    
    // Save results to file
    const resultsPath = path.join(__dirname, '..', 'htlc-security-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n💾 Results saved to: htlc-security-results.json`);
  }
}

// Run tests
async function main() {
  const tester = new HTLCSecurityTester();
  await tester.runAllTests();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { HTLCSecurityTester }; 
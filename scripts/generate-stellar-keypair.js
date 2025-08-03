#!/usr/bin/env node

/**
 * Stellar Keypair Generator for Mainnet Deployment
 * Generates a secure keypair for bridge operations
 */

import { Keypair } from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateKeypair() {
  console.log('🔐 Generating Stellar Keypair for Mainnet...\n');
  
  // Generate new keypair
  const keypair = Keypair.random();
  
  console.log('✅ Keypair Generated Successfully!\n');
  console.log('📋 Keypair Details:');
  console.log('=' .repeat(50));
  console.log(`Public Key:  ${keypair.publicKey()}`);
  console.log(`Secret Key:  ${keypair.secret()}`);
  console.log('=' .repeat(50));
  
  // Security warnings
  console.log('\n⚠️  SECURITY WARNINGS:');
  console.log('=' .repeat(50));
  console.log('• Keep your secret key secure and private');
  console.log('• Never share your secret key with anyone');
  console.log('• Store it in a hardware wallet if possible');
  console.log('• Use environment variables in production');
  console.log('• Fund the account with at least 1 XLM');
  console.log('• Recommended: 10-50 XLM for operations');
  
  // Environment variable setup
  console.log('\n🔧 Environment Setup:');
  console.log('=' .repeat(50));
  console.log('Add this to your .env.local file:');
  console.log(`VITE_STELLAR_BRIDGE_SECRET_KEY=${keypair.secret()}`);
  console.log('VITE_STELLAR_NETWORK=PUBLIC');
  
  // Funding instructions
  console.log('\n💰 Funding Instructions:');
  console.log('=' .repeat(50));
  console.log('1. Copy the public key above');
  console.log('2. Send at least 1 XLM to fund the account');
  console.log('3. Recommended: Send 10-50 XLM for operations');
  console.log('\nFunding options:');
  console.log('• Stellar Laboratory: https://laboratory.stellar.org/#account-creator?network=public');
  console.log('• StellarX: https://stellarx.com/send');
  console.log('• Lobstr: https://lobstr.co/');
  console.log('• Any Stellar wallet that supports mainnet');
  
  // Save to file (optional)
  const saveToFile = process.argv.includes('--save');
  if (saveToFile) {
    const keypairData = {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      generatedAt: new Date().toISOString(),
      network: 'PUBLIC',
      purpose: 'Bridge Account'
    };
    
    const outputPath = path.join(__dirname, '..', 'stellar-keypair.json');
    fs.writeFileSync(outputPath, JSON.stringify(keypairData, null, 2));
    
    console.log('\n💾 Keypair saved to stellar-keypair.json');
    console.log('⚠️  Remember to delete this file after setting up environment variables!');
  }
  
  // Next steps
  console.log('\n🚀 Next Steps:');
  console.log('=' .repeat(50));
  console.log('1. Fund the bridge account with XLM');
  console.log('2. Add secret key to .env.local file');
  console.log('3. Set VITE_STELLAR_NETWORK=PUBLIC');
  console.log('4. Test on testnet first');
  console.log('5. Deploy to production');
  
  console.log('\n✅ Keypair generation complete!');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateKeypair();
}

export { generateKeypair }; 
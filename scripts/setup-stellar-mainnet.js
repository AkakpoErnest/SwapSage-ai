// Stellar Mainnet Bridge Account Setup Script
console.log('🚀 Setting up Stellar Mainnet Bridge Account...\n');

import { Keypair, Networks } from '@stellar/stellar-sdk';

// Generate a new bridge account for mainnet
const bridgeAccount = Keypair.random();

console.log('📋 Bridge Account Details:');
console.log(`   Public Key: ${bridgeAccount.publicKey()}`);
console.log(`   Secret Key: ${bridgeAccount.secret()}`);
console.log(`   Network: MAINNET`);

console.log('\n💰 Funding Requirements:');
console.log('   • Minimum Balance: 1 XLM (base reserve)');
console.log('   • Recommended: 10 XLM for operations');
console.log('   • Current XLM Price: ~$0.11 USD');
console.log('   • Total Cost: ~$1.10 USD');

console.log('\n📝 Next Steps:');
console.log('   1. Fund the bridge account with at least 10 XLM');
console.log('   2. Add the secret key to your .env.local file:');
console.log(`      VITE_STELLAR_BRIDGE_SECRET_KEY=${bridgeAccount.secret()}`);
console.log('   3. Set VITE_STELLAR_NETWORK=mainnet in .env.local');
console.log('   4. Restart your application');

console.log('\n🔗 Funding Options:');
console.log('   • Buy XLM from any exchange (Coinbase, Binance, etc.)');
console.log('   • Send XLM to the bridge account address');
console.log('   • Use Stellar Laboratory: https://laboratory.stellar.org/');

console.log('\n⚠️  Security Notes:');
console.log('   • Keep the secret key secure and private');
console.log('   • Never commit the secret key to version control');
console.log('   • Consider using environment variables for production');

console.log('\n✅ Setup complete! Your bridge account is ready for mainnet operations.'); 
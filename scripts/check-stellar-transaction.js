// Check Stellar Transaction Status
console.log('🔍 Checking Stellar Transaction Status...\n');

import fetch from 'node-fetch';

const BRIDGE_PUBLIC_KEY = 'GARHFOVVOB4CQIXQLQI5JW5BJL574IF7N4A6QJE4B4XB6UADXQBCBPXT';
const STELLAR_MAINNET_URL = 'https://horizon.stellar.org';

async function checkTransactionStatus() {
  try {
    console.log('📡 Checking recent transactions for bridge account...');
    
    // Check if account exists
    const accountResponse = await fetch(`${STELLAR_MAINNET_URL}/accounts/${BRIDGE_PUBLIC_KEY}`);
    
    if (accountResponse.ok) {
      const account = await response.json();
      console.log('✅ Account is active on mainnet!');
      console.log(`   Balance: ${account.balances[0].balance} XLM`);
      return;
    }
    
    // If account doesn't exist, check for pending transactions
    console.log('⏳ Account not yet active, checking for pending transactions...');
    
    // Check recent transactions (this would need the sender's account)
    console.log('\n📋 To verify your transaction:');
    console.log('   1. Go to: https://stellar.expert/explorer/public');
    console.log('   2. Search for your sender account address');
    console.log('   3. Look for the payment transaction to:');
    console.log(`      ${BRIDGE_PUBLIC_KEY}`);
    console.log('   4. Check transaction status');
    
    console.log('\n🔗 Direct Links:');
    console.log(`   • Bridge Account: https://stellar.expert/explorer/public/account/${BRIDGE_PUBLIC_KEY}`);
    console.log('   • Stellar Laboratory: https://laboratory.stellar.org/');
    console.log('   • Stellar Expert: https://stellar.expert/explorer/public');
    
    console.log('\n⏰ Transaction Timing:');
    console.log('   • Stellar transactions are usually instant');
    console.log('   • Sometimes takes 1-2 minutes to appear');
    console.log('   • If not showing after 5 minutes, check:');
    console.log('     - Transaction hash from your wallet');
    console.log('     - Sender account balance');
    console.log('     - Network fees');
    
    console.log('\n🔄 Re-checking in 30 seconds...');
    setTimeout(async () => {
      console.log('\n🔄 Re-checking account status...');
      const retryResponse = await fetch(`${STELLAR_MAINNET_URL}/accounts/${BRIDGE_PUBLIC_KEY}`);
      if (retryResponse.ok) {
        const account = await retryResponse.json();
        console.log('✅ Account is now active!');
        console.log(`   Balance: ${account.balances[0].balance} XLM`);
      } else {
        console.log('❌ Account still not found');
        console.log('   Please check your transaction details');
      }
    }, 30000);
    
  } catch (error) {
    console.log('❌ Error checking transaction:', error.message);
  }
}

checkTransactionStatus(); 
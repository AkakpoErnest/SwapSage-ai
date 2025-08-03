// Verify Stellar Bridge Account Funding
console.log('🔍 Verifying Stellar Bridge Account Funding...\n');

import fetch from 'node-fetch';

const BRIDGE_PUBLIC_KEY = 'GARHFOVVOB4CQIXQLQI5JW5BJL574IF7N4A6QJE4B4XB6UADXQBCBPXT';
const STELLAR_MAINNET_URL = 'https://horizon.stellar.org';

async function verifyFunding() {
  try {
    console.log('📡 Checking account details on Stellar mainnet...');
    
    const response = await fetch(`${STELLAR_MAINNET_URL}/accounts/${BRIDGE_PUBLIC_KEY}`);
    
    if (response.ok) {
      const account = await response.json();
      
      console.log('✅ Account found on mainnet!');
      console.log(`   Account ID: ${account.id}`);
      console.log(`   Balance: ${account.balances[0].balance} XLM`);
      console.log(`   Sequence: ${account.sequence}`);
      console.log(`   Thresholds: ${account.thresholds.low_threshold}/${account.thresholds.med_threshold}/${account.thresholds.high_threshold}`);
      
      const xlmBalance = parseFloat(account.balances[0].balance);
      
      if (xlmBalance >= 10) {
        console.log('\n🎉 SUCCESS: Bridge account is properly funded!');
        console.log(`   Available XLM: ${xlmBalance} XLM`);
        console.log(`   Ready for: ${Math.floor(xlmBalance / 0.00001)} transactions`);
        console.log('   Status: READY FOR PRODUCTION');
      } else if (xlmBalance >= 1) {
        console.log('\n⚠️  WARNING: Bridge account has minimum funding');
        console.log(`   Available XLM: ${xlmBalance} XLM`);
        console.log('   Consider adding more XLM for operations');
      } else {
        console.log('\n❌ ERROR: Bridge account is not funded');
        console.log('   Please send XLM to the bridge account');
      }
      
      console.log('\n📊 Account Details:');
      console.log(`   • Base Reserve: 1 XLM (locked)`);
      console.log(`   • Available for Operations: ${xlmBalance - 1} XLM`);
      console.log(`   • Transaction Cost: 0.00001 XLM per transaction`);
      console.log(`   • Max Transactions: ${Math.floor((xlmBalance - 1) / 0.00001)}`);
      
    } else {
      console.log('❌ Account not found on mainnet');
      console.log('   This could mean:');
      console.log('   • The account hasn\'t been created yet');
      console.log('   • The funding transaction is still pending');
      console.log('   • There was an issue with the funding');
    }
    
  } catch (error) {
    console.log('❌ Error checking account:', error.message);
  }
}

verifyFunding(); 
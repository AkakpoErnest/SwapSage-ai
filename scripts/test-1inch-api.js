#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  dotenv.config({ path: envPath });
} catch (error) {
  console.log('No .env.local file found, checking for .env.example...');
}

console.log('🔍 Testing 1inch API Connection...\n');

// Check environment variables
const apiKey = process.env.VITE_1INCH_API_KEY;
console.log('📋 Environment Check:');
console.log(`   API Key: ${apiKey ? '✅ Set' : '❌ Not set'}`);
console.log(`   API Key Value: ${apiKey ? (apiKey === 'your_1inch_api_key_here' ? '❌ Default placeholder' : '✅ Custom key') : '❌ Missing'}`);

if (!apiKey || apiKey === 'your_1inch_api_key_here') {
  console.log('\n⚠️  Please set your 1inch API key in .env.local file');
  console.log('   Get your free API key at: https://portal.1inch.dev/');
  console.log('   Add: VITE_1INCH_API_KEY=your_actual_api_key_here');
  process.exit(1);
}

// Test API endpoints
const testEndpoints = [
  {
    name: 'Polygon Mainnet Tokens',
    url: `https://api.1inch.dev/swap/v6.0/137/tokens`,
    chainId: 137
  },
  {
    name: 'Polygon Mainnet Quote (MATIC to USDC)',
    url: `https://api.1inch.dev/swap/v6.0/137/quote?src=0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270&dst=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&amount=1000000000000000000&from=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6&slippage=1`,
    chainId: 137
  },
  {
    name: 'Ethereum Mainnet Tokens',
    url: `https://api.1inch.dev/swap/v6.0/1/tokens`,
    chainId: 1
  }
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  
  try {
    const response = await fetch(endpoint.url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (endpoint.name.includes('Tokens')) {
        const tokenCount = Object.keys(data.tokens || data).length;
        console.log(`   ✅ Success: Found ${tokenCount} tokens`);
      } else if (endpoint.name.includes('Quote')) {
        console.log(`   ✅ Success: Quote received`);
        console.log(`   📊 From: ${data.fromToken?.symbol || 'Unknown'}`);
        console.log(`   📊 To: ${data.toToken?.symbol || 'Unknown'}`);
        console.log(`   📊 Rate: 1 ${data.fromToken?.symbol || 'Unknown'} = ${data.dstAmount ? (parseFloat(data.dstAmount) / Math.pow(10, data.toToken?.decimals || 18)).toFixed(6) : 'Unknown'} ${data.toToken?.symbol || 'Unknown'}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n🚀 Starting API Tests...\n');
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Summary:');
  console.log('   If you see ✅ Success messages, your 1inch API is working correctly!');
  console.log('   If you see ❌ Error messages, check your API key and network connection.');
  console.log('\n🔗 Get your API key: https://portal.1inch.dev/');
}

runTests().catch(console.error); 
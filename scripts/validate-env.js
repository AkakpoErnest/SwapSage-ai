#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Validates all required environment variables for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables for production
const REQUIRED_VARS = {
  // Critical API Keys
  'VITE_1INCH_API_KEY': {
    description: '1inch API Key for swap quotes',
    validation: (value) => value && value !== 'demo-key' && value !== 'your_1inch_api_key_here',
    error: 'Valid 1inch API key is required for production'
  },
  
  // Stellar Configuration
  'VITE_STELLAR_NETWORK': {
    description: 'Stellar network (TESTNET or PUBLIC)',
    validation: (value) => ['TESTNET', 'PUBLIC'].includes(value),
    error: 'Must be either TESTNET or PUBLIC'
  },
  
  'VITE_STELLAR_BRIDGE_SECRET_KEY': {
    description: 'Stellar bridge account secret key',
    validation: (value) => value && value.length > 0,
    error: 'Bridge secret key is required for HTLC operations'
  },
  
  // Polygon Configuration
  'VITE_POLYGON_RPC_URL': {
    description: 'Polygon RPC URL',
    validation: (value) => value && value.includes('http'),
    error: 'Valid Polygon RPC URL is required'
  },
  
  // Contract Addresses
  'VITE_ORACLE_CONTRACT_ADDRESS': {
    description: 'Oracle contract address',
    validation: (value) => value && value.startsWith('0x') && value.length === 42,
    error: 'Valid Oracle contract address is required'
  },
  
  'VITE_HTLC_CONTRACT_ADDRESS': {
    description: 'HTLC contract address',
    validation: (value) => value && value.startsWith('0x') && value.length === 42,
    error: 'Valid HTLC contract address is required'
  },
  
  'VITE_EXECUTOR_CONTRACT_ADDRESS': {
    description: 'Executor contract address',
    validation: (value) => value && value.startsWith('0x') && value.length === 42,
    error: 'Valid Executor contract address is required'
  }
};

// Optional but recommended variables
const OPTIONAL_VARS = {
  'VITE_ETHEREUM_RPC_URL': {
    description: 'Ethereum RPC URL (optional)',
    validation: (value) => !value || value.includes('http'),
    error: 'Must be a valid HTTP URL if provided'
  },
  
  'POLYGONSCAN_API_KEY': {
    description: 'PolygonScan API key (optional)',
    validation: (value) => !value || value.length > 0,
    error: 'Must be a valid API key if provided'
  }
};

// Development variables that should be disabled in production
const DEV_VARS = {
  'VITE_DEV_MODE': {
    description: 'Development mode',
    validation: (value) => value !== 'true',
    error: 'Should be false or not set in production'
  },
  
  'VITE_DEBUG_LOGGING': {
    description: 'Debug logging',
    validation: (value) => value !== 'true',
    error: 'Should be false or not set in production'
  }
};

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=');
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

function validateVariable(key, value, config) {
  if (!config.validation(value)) {
    return {
      valid: false,
      error: config.error,
      description: config.description
    };
  }
  
  return {
    valid: true,
    description: config.description
  };
}

function main() {
  console.log('🔍 Validating SwapSage AI Environment Configuration...\n');
  
  // Load environment variables
  const envPath = path.join(process.cwd(), '.env.local');
  const env = loadEnvFile(envPath);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Validate required variables
  console.log('📋 Required Variables:');
  console.log('=' .repeat(50));
  
  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = env[key];
    const result = validateVariable(key, value, config);
    
    if (result.valid) {
      console.log(`✅ ${key}: ${result.description}`);
    } else {
      console.log(`❌ ${key}: ${result.error}`);
      hasErrors = true;
    }
  }
  
  console.log('\n📋 Optional Variables:');
  console.log('=' .repeat(50));
  
  for (const [key, config] of Object.entries(OPTIONAL_VARS)) {
    const value = env[key];
    const result = validateVariable(key, value, config);
    
    if (result.valid) {
      if (value) {
        console.log(`✅ ${key}: ${result.description}`);
      } else {
        console.log(`⚠️  ${key}: Not set (${result.description})`);
        hasWarnings = true;
      }
    } else {
      console.log(`❌ ${key}: ${result.error}`);
      hasErrors = true;
    }
  }
  
  console.log('\n📋 Development Variables:');
  console.log('=' .repeat(50));
  
  for (const [key, config] of Object.entries(DEV_VARS)) {
    const value = env[key];
    const result = validateVariable(key, value, config);
    
    if (result.valid) {
      console.log(`✅ ${key}: Properly configured for production`);
    } else {
      console.log(`⚠️  ${key}: ${result.error}`);
      hasWarnings = true;
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('=' .repeat(50));
  
  if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('Please fix the errors above before deploying to production.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Environment validation PASSED with warnings');
    console.log('Consider addressing the warnings above for optimal production setup.');
  } else {
    console.log('✅ Environment validation PASSED');
    console.log('All required variables are properly configured for production.');
  }
  
  // Additional checks
  console.log('\n🔒 Security Checks:');
  console.log('=' .repeat(50));
  
  // Check for common security issues
  const securityIssues = [];
  
  // Check for hardcoded demo values
  Object.entries(env).forEach(([key, value]) => {
    if (value && (
      value.includes('demo-key') ||
      value.includes('your_') ||
      value.includes('placeholder')
    )) {
      securityIssues.push(`${key}: Contains placeholder/demo value`);
    }
  });
  
  // Check for weak secrets
  Object.entries(env).forEach(([key, value]) => {
    if (key.includes('SECRET') && value && value.length < 20) {
      securityIssues.push(`${key}: Secret key appears to be too short`);
    }
  });
  
  if (securityIssues.length > 0) {
    console.log('⚠️  Security warnings:');
    securityIssues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ No obvious security issues detected');
  }
  
  console.log('\n🚀 Ready for production deployment!');
}

main(); 
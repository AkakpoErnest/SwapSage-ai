import { ethers } from 'ethers';
import type { BridgeRequest, BridgeQuote, BridgeStatus, Chain, Token } from './types';

class BridgeService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: any = null;
  private isInitialized = false;

  // Supported chains
  private supportedChains: Chain[] = [
    { id: 11155111, name: "Sepolia", symbol: "ETH", icon: "🔷", color: "blue", status: "testnet" },
    { id: 1, name: "Ethereum", symbol: "ETH", icon: "🔷", color: "blue", status: "live" },
    { id: 137, name: "Polygon", symbol: "MATIC", icon: "🟣", color: "purple", status: "live" },
    { id: 42161, name: "Arbitrum", symbol: "ARB", icon: "🔵", color: "cyan", status: "live" },
    { id: 10, name: "Optimism", symbol: "OP", icon: "🔴", color: "red", status: "live" },
    { id: 56, name: "BSC", symbol: "BNB", icon: "🟡", color: "yellow", status: "live" },
    { id: 100, name: "Stellar", symbol: "XLM", icon: "⭐", color: "white", status: "testnet" },
  ];

  // Supported tokens per chain
  private supportedTokens: Record<number, Token[]> = {
    11155111: [
      { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🔷", chainId: 11155111 },
      { symbol: "mUSDC", name: "Mock USDC", address: "0xE560De00F664dE3C0B3815dd1AF4b6DF64123563", decimals: 6, icon: "💵", chainId: 11155111 },
      { symbol: "USDC", name: "USD Coin", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6, icon: "💵", chainId: 11155111 },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574", decimals: 18, icon: "🟢", chainId: 11155111 },
    ],
    1: [
      { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE", decimals: 18, icon: "🔷", chainId: 1 },
      { symbol: "USDC", name: "USD Coin", address: "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C", decimals: 6, icon: "💵", chainId: 1 },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, icon: "🟢", chainId: 1 },
    ],
    137: [
      { symbol: "MATIC", name: "Polygon", address: "0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE", decimals: 18, icon: "🟣", chainId: 137 },
      { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, icon: "💵", chainId: 137 },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: 18, icon: "🟢", chainId: 137 },
    ],
    42161: [
      { symbol: "ARB", name: "Arbitrum", address: "0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE", decimals: 18, icon: "🔵", chainId: 42161 },
      { symbol: "USDC", name: "USD Coin", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6, icon: "💵", chainId: 42161 },
    ],
    10: [
      { symbol: "OP", name: "Optimism", address: "0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE", decimals: 18, icon: "🔴", chainId: 10 },
      { symbol: "USDC", name: "USD Coin", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", decimals: 6, icon: "💵", chainId: 10 },
    ],
    56: [
      { symbol: "BNB", name: "Binance Coin", address: "0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE", decimals: 18, icon: "🟡", chainId: 56 },
      { symbol: "USDC", name: "USD Coin", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, icon: "💵", chainId: 56 },
    ],
    100: [
      { symbol: "XLM", name: "Stellar Lumens", address: "native", decimals: 7, icon: "⭐", chainId: 100 },
      { symbol: "USDC", name: "USD Coin", address: "stellar:USDC", decimals: 6, icon: "💵", chainId: 100 },
    ],
  };

  // Bridge fee structure (in basis points)
  private bridgeFees: Record<number, number> = {
    11155111: 10, // Sepolia: 0.10% (testnet)
    1: 25,    // Ethereum: 0.25%
    137: 20,  // Polygon: 0.20%
    42161: 20, // Arbitrum: 0.20%
    10: 20,   // Optimism: 0.20%
    56: 15,   // BSC: 0.15%
    100: 30,  // Stellar: 0.30%
  };

  // Estimated bridge times (in minutes)
  private bridgeTimes: Record<number, number> = {
    11155111: 1,  // Sepolia: 1 minute (testnet)
    1: 5,     // Ethereum: 5 minutes
    137: 3,   // Polygon: 3 minutes
    42161: 4, // Arbitrum: 4 minutes
    10: 3,    // Optimism: 3 minutes
    56: 2,    // BSC: 2 minutes
    100: 1,   // Stellar: 1 minute
  };

  constructor() {}

  async initialize(provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.signer = await provider.getSigner();
    this.isInitialized = true;
  }

  // Get all supported chains
  async getSupportedChains(): Promise<Chain[]> {
    return this.supportedChains;
  }

  // Get supported tokens for a specific chain
  async getSupportedTokens(chainId: number): Promise<Token[]> {
    return this.supportedTokens[chainId] || [];
  }

  // Get bridge quote
  async getBridgeQuote(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    amount: string
  ): Promise<BridgeQuote> {
    if (!this.isInitialized) {
      throw new Error('Bridge service not initialized');
    }

    // Validate inputs
    if (!this.supportedChains.find(c => c.id === fromChainId)) {
      throw new Error(`Unsupported source chain: ${fromChainId}`);
    }

    if (!this.supportedChains.find(c => c.id === toChainId)) {
      throw new Error(`Unsupported destination chain: ${toChainId}`);
    }

    if (fromChainId === toChainId) {
      throw new Error('Source and destination chains must be different');
    }

    const fromTokens = this.supportedTokens[fromChainId] || [];
    const fromToken = fromTokens.find(t => t.address === fromTokenAddress);
    if (!fromToken) {
      throw new Error(`Unsupported token on source chain: ${fromTokenAddress}`);
    }

    // Calculate bridge fee
    const bridgeFeeBps = this.bridgeFees[fromChainId] || 25;
    const bridgeFeeAmount = (parseFloat(amount) * bridgeFeeBps) / 10000;
    const bridgeFee = bridgeFeeAmount.toFixed(6);

    // Estimate gas fee (simplified calculation)
    const gasPrice = await this.estimateGasPrice(fromChainId);
    const estimatedGas = 180000; // Standard bridge gas limit
    const gasFee = (parseFloat(gasPrice) * estimatedGas / 1e18).toFixed(6);
    const gasFeeUSD = (parseFloat(gasFee) * 2000).toFixed(2); // Assuming $2000 ETH

    // Calculate total fee
    const totalFee = (parseFloat(bridgeFee) + parseFloat(gasFee)).toFixed(6);
    const totalFeeUSD = (parseFloat(bridgeFee) * 2000 + parseFloat(gasFeeUSD)).toFixed(2);

    // Estimate bridge time
    const estimatedTime = this.bridgeTimes[fromChainId] + this.bridgeTimes[toChainId];

    // Calculate min/max amounts
    const minAmount = "0.001";
    const maxAmount = "1000000";

    return {
      estimatedTime,
      bridgeFee: `$${bridgeFeeUSD}`,
      gasFee: `$${gasFeeUSD}`,
      totalFee: `$${totalFeeUSD}`,
      minAmount,
      maxAmount,
    };
  }

  // Execute bridge transaction
  async executeBridge(bridgeRequest: BridgeRequest): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Bridge service not initialized');
    }

    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    // Validate bridge request
    this.validateBridgeRequest(bridgeRequest);

    try {
      // For demo purposes, we'll simulate the bridge transaction
      // In a real implementation, this would interact with bridge contracts
      
      // Generate a mock bridge ID
      const bridgeId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate bridge transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Store bridge status for monitoring
      this.storeBridgeStatus(bridgeId, {
        id: bridgeId,
        status: 'pending',
        fromChain: bridgeRequest.fromChain,
        toChain: bridgeRequest.toChain,
        fromToken: bridgeRequest.fromToken,
        toToken: bridgeRequest.toToken,
        fromAmount: bridgeRequest.amount,
        toAmount: bridgeRequest.amount, // Simplified for demo
        recipient: bridgeRequest.recipient,
        timestamp: Date.now(),
        txHash: mockTxHash,
        estimatedTime: bridgeRequest.estimatedTime,
      });

      // Simulate bridge processing
      setTimeout(() => {
        this.updateBridgeStatus(bridgeId, 'processing');
      }, 2000);

      setTimeout(() => {
        this.updateBridgeStatus(bridgeId, 'completed');
      }, bridgeRequest.estimatedTime * 60 * 1000);

      return bridgeId;
    } catch (error) {
      console.error('Bridge execution failed:', error);
      throw new Error('Bridge execution failed');
    }
  }

  // Get bridge status
  async getBridgeStatus(bridgeId: string): Promise<BridgeStatus | null> {
    const storedStatus = localStorage.getItem(`bridge_${bridgeId}`);
    return storedStatus ? JSON.parse(storedStatus) : null;
  }

  // Get all bridge transactions for an address
  async getBridgeHistory(address: string): Promise<BridgeStatus[]> {
    const bridges: BridgeStatus[] = [];
    
    // Get all bridge keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bridge_')) {
        const bridgeData = localStorage.getItem(key);
        if (bridgeData) {
          const bridge = JSON.parse(bridgeData);
          if (bridge.recipient === address) {
            bridges.push(bridge);
          }
        }
      }
    }

    return bridges.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Estimate gas price for a chain
  private async estimateGasPrice(chainId: number): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice?.toString() || '20000000000'; // 20 gwei default
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return '20000000000'; // 20 gwei fallback
    }
  }

  // Validate bridge request
  private validateBridgeRequest(request: BridgeRequest): void {
    if (!request.fromChain || !request.toChain) {
      throw new Error('Source and destination chains are required');
    }

    if (!request.fromToken || !request.toToken) {
      throw new Error('Source and destination tokens are required');
    }

    if (!request.amount || parseFloat(request.amount) <= 0) {
      throw new Error('Valid amount is required');
    }

    if (!request.recipient) {
      throw new Error('Recipient address is required');
    }

    if (request.fromChain === request.toChain) {
      throw new Error('Source and destination chains must be different');
    }
  }

  // Store bridge status in localStorage
  private storeBridgeStatus(bridgeId: string, status: BridgeStatus): void {
    localStorage.setItem(`bridge_${bridgeId}`, JSON.stringify(status));
  }

  // Update bridge status
  private updateBridgeStatus(bridgeId: string, newStatus: 'pending' | 'processing' | 'completed' | 'failed'): void {
    const storedStatus = localStorage.getItem(`bridge_${bridgeId}`);
    if (storedStatus) {
      const status = JSON.parse(storedStatus);
      status.status = newStatus;
      status.updatedAt = Date.now();
      localStorage.setItem(`bridge_${bridgeId}`, JSON.stringify(status));
    }
  }

  // Export bridge history
  async exportBridgeHistory(address: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const bridges = await this.getBridgeHistory(address);
    
    if (format === 'csv') {
      const headers = ['ID', 'Status', 'From Chain', 'To Chain', 'From Token', 'To Token', 'Amount', 'Recipient', 'Timestamp'];
      const rows = bridges.map(bridge => [
        bridge.id,
        bridge.status,
        bridge.fromChain,
        bridge.toChain,
        bridge.fromToken,
        bridge.toToken,
        bridge.fromAmount,
        bridge.recipient,
        new Date(bridge.timestamp).toISOString()
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      return csvContent;
    } else {
      return JSON.stringify(bridges, null, 2);
    }
  }

  // Get bridge statistics
  async getBridgeStats(address: string): Promise<{
    totalBridges: number;
    completedBridges: number;
    pendingBridges: number;
    totalVolume: string;
    averageTime: number;
  }> {
    const bridges = await this.getBridgeHistory(address);
    
    const totalBridges = bridges.length;
    const completedBridges = bridges.filter(b => b.status === 'completed').length;
    const pendingBridges = bridges.filter(b => b.status === 'pending' || b.status === 'processing').length;
    
    const totalVolume = bridges
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + parseFloat(b.fromAmount), 0)
      .toFixed(2);
    
    const completedBridgesWithTime = bridges.filter(b => b.status === 'completed' && b.estimatedTime);
    const averageTime = completedBridgesWithTime.length > 0 
      ? completedBridgesWithTime.reduce((sum, b) => sum + (b.estimatedTime || 0), 0) / completedBridgesWithTime.length
      : 0;

    return {
      totalBridges,
      completedBridges,
      pendingBridges,
      totalVolume,
      averageTime: Math.round(averageTime),
    };
  }
}

export const bridgeService = new BridgeService(); 
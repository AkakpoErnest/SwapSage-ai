import { ethers } from 'ethers';
import { oneInchAPI } from '../api/oneinch';

export interface PolygonStellarSwapRequest {
  fromChain: 'polygon' | 'stellar';
  toChain: 'polygon' | 'stellar';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  recipient: string;
  autoSelectWallet?: boolean;
  use1inchFusion?: boolean; // Enable 1inch Fusion for optimal routing
}

export interface PolygonStellarSwapResult {
  swapId: string;
  fromTxHash: string;
  stellarTxHash?: string;
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'refunded';
  secret: string;
  hashlock: string;
  timelock: number;
  estimatedTime: number;
  stellarAccount?: string;
  oneinchRoute?: any; // 1inch Fusion route data
}

export interface StellarHTLC {
  id: string;
  source: string;
  destination: string;
  amount: string;
  asset: string;
  hashlock: string;
  timelock: number;
  status: 'pending' | 'completed' | 'expired';
}

class PolygonStellarBridge {
  private polygonProvider: ethers.JsonRpcProvider | null = null;
  private polygonSigner: any = null;
  private stellarServer: string = 'https://horizon-testnet.stellar.org';
  private stellarNetwork: string = 'TESTNET';
  
  // Contract addresses
  private polygonHTLC = "0xd7c66D8B635152709fbe14E72eF91C9417391f37"; // Sepolia for demo
  private polygonOracle = "0xc6e0eF2453f08C0fbeC4b6a038d23f4D3A00E1B1";
  
  // HTLC ABI for Polygon
  private htlcABI = [
    'function initiateSwap(address recipient, address fromToken, address toToken, uint256 fromAmount, uint256 toAmount, bytes32 hashlock, uint256 timelock) external payable',
    'function withdraw(bytes32 swapId, string secret) external',
    'function refund(bytes32 swapId) external',
    'function swaps(bytes32) external view returns (address, address, address, address, uint256, uint256, bytes32, uint256, bool, bool, string, uint256, uint256)',
    'event SwapInitiated(bytes32 indexed swapId, address indexed initiator, address indexed recipient, address fromToken, address toToken, uint256 fromAmount, uint256 toAmount, bytes32 hashlock, uint256 timelock, uint256 oraclePrice, uint256 confidence)',
    'event SwapWithdrawn(bytes32 indexed swapId, string secret)',
    'event SwapRefunded(bytes32 indexed swapId)'
  ];

  constructor() {}

  /**
   * Initialize the bridge with providers
   */
  async initialize(polygonRpcUrl: string, stellarNetwork: 'TESTNET' | 'PUBLIC' = 'TESTNET') {
    // Initialize Polygon provider
    this.polygonProvider = new ethers.JsonRpcProvider(polygonRpcUrl);
    
    // Set Stellar network
    this.stellarNetwork = stellarNetwork;
    this.stellarServer = stellarNetwork === 'TESTNET' 
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org';
  }

  /**
   * Get bridge quote with 1inch Fusion integration
   */
  async getBridgeQuote(request: PolygonStellarSwapRequest): Promise<any> {
    const { fromChain, toChain, fromToken, toToken, fromAmount, use1inchFusion = true } = request;
    
    if (fromChain === 'polygon' && use1inchFusion) {
      // Use 1inch Fusion for optimal Polygon routing
      return await this.get1inchFusionQuote(request);
    } else {
      // Use traditional oracle pricing
      return await this.getTraditionalQuote(request);
    }
  }

  /**
   * Get quote using 1inch Fusion for optimal routing
   */
  private async get1inchFusionQuote(request: PolygonStellarSwapRequest): Promise<any> {
    const { fromToken, toToken, fromAmount, recipient } = request;
    
    // Prevent same token swaps
    if (fromToken === toToken) {
      console.warn('Same token selected, falling back to traditional quote');
      return await this.getTraditionalQuote(request);
    }
    
    try {
      // Get 1inch Fusion quote for Polygon
      const oneinchQuote = await oneInchAPI.getSwapQuote(
        137, // Polygon mainnet
        fromToken,
        toToken,
        fromAmount,
        recipient || '0x0000000000000000000000000000000000000000',
        1 // 1% slippage
      );

      // Calculate bridge fees
      const bridgeFee = parseFloat(fromAmount) * 0.0025; // 0.25%
      const gasFee = await this.estimatePolygonGasFee();
      const stellarFee = 0.00001; // Stellar transaction fee
      const totalFee = bridgeFee + gasFee + stellarFee;

      return {
        fromAmount,
        toAmount: oneinchQuote.toTokenAmount,
        fee: bridgeFee.toFixed(6),
        gasFee: gasFee.toFixed(6),
        stellarFee: stellarFee.toFixed(6),
        totalFee: totalFee.toFixed(6),
        estimatedTime: 4, // 3 min Polygon + 1 min Stellar
        minAmount: "0.001",
        maxAmount: "1000000",
        confidence: 95, // High confidence with 1inch Fusion
        oneinchRoute: oneinchQuote,
        routingMethod: '1inch-fusion'
      };
    } catch (error) {
      console.error('1inch Fusion quote failed, falling back to traditional:', error);
      return await this.getTraditionalQuote(request);
    }
  }

  /**
   * Get traditional quote using oracles
   */
  private async getTraditionalQuote(request: PolygonStellarSwapRequest): Promise<any> {
    const { fromChain, toChain, fromToken, toToken, fromAmount } = request;
    
    // Get token prices
    const fromPrice = await this.getTokenPrice(fromChain, fromToken);
    const toPrice = await this.getTokenPrice(toChain, toToken);
    
    // Use fallback prices if Oracle is not accessible
    const finalFromPrice = fromPrice || this.getFallbackPrice(fromChain, fromToken);
    const finalToPrice = toPrice || this.getFallbackPrice(toChain, toToken);
    
    if (!finalFromPrice || !finalToPrice) {
      throw new Error('Unable to get token prices from Oracle or fallback');
    }

    // Calculate exchange rate
    const exchangeRate = finalFromPrice / finalToPrice;
    const toAmount = (parseFloat(fromAmount) * exchangeRate).toFixed(6);
    
    // Calculate fees
    const bridgeFee = parseFloat(fromAmount) * 0.0025; // 0.25%
    const gasFee = await this.estimatePolygonGasFee();
    const stellarFee = 0.00001; // Stellar transaction fee (XLM)
    const totalFee = bridgeFee + gasFee + stellarFee;
    
    return {
      fromAmount,
      toAmount,
      fee: bridgeFee.toFixed(6),
      gasFee: gasFee.toFixed(6),
      stellarFee: stellarFee.toFixed(6),
      totalFee: totalFee.toFixed(6),
      estimatedTime: this.getEstimatedTime(fromChain, toChain),
      minAmount: "0.001",
      maxAmount: "1000000",
      confidence: 85,
      routingMethod: 'oracle'
    };
  }

  /**
   * Execute Polygon to Stellar swap with 1inch Fusion
   */
  async executePolygonToStellarSwap(request: PolygonStellarSwapRequest): Promise<PolygonStellarSwapResult> {
    const { fromAmount, recipient, use1inchFusion = true } = request;
    
    if (!this.polygonProvider) {
      throw new Error('Polygon provider not initialized');
    }

    // Generate secret and hashlock
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hashlock = ethers.keccak256(secret);
    
    // Calculate timelock (1 hour from now)
    const timelock = Math.floor(Date.now() / 1000) + 3600;
    
    // Get quote (with 1inch Fusion if enabled)
    const quote = await this.getBridgeQuote(request);
    
    // Create Stellar account for recipient if needed
    const stellarAccount = await this.createStellarAccount(recipient);
    
    let oneinchRoute = null;
    
    if (use1inchFusion && quote.routingMethod === '1inch-fusion') {
      // Execute 1inch Fusion swap first
      oneinchRoute = await this.execute1inchFusionSwap(request, quote);
    }
    
    // Initiate HTLC on Polygon
    const htlcContract = new ethers.Contract(this.polygonHTLC, this.htlcABI, this.polygonProvider);
    
    const fromAmountWei = ethers.parseEther(fromAmount);
    const toAmountWei = ethers.parseEther(quote.toAmount);
    
    // For demo, we'll simulate the transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    // Generate swap ID
    const swapId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'string', 'address', 'string', 'uint256', 'string', 'bytes32', 'uint256'],
      [recipient, stellarAccount, request.fromToken, request.toToken, fromAmountWei, quote.toAmount, hashlock, timelock]
    ));
    
    // Create Stellar HTLC
    const stellarHTLC = await this.createStellarHTLC(
      stellarAccount,
      quote.toAmount,
      request.toToken,
      hashlock,
      timelock
    );
    
    return {
      swapId,
      fromTxHash: mockTxHash,
      stellarTxHash: stellarHTLC.id,
      status: 'initiated',
      secret,
      hashlock,
      timelock,
      estimatedTime: quote.estimatedTime,
      stellarAccount,
      oneinchRoute
    };
  }

  /**
   * Execute 1inch Fusion swap
   */
  private async execute1inchFusionSwap(request: PolygonStellarSwapRequest, quote: any): Promise<any> {
    try {
      // For 1inch Fusion, we return the quote data for the user to execute
      // The actual execution happens through the user's wallet
      return {
        quote: quote.oneinchRoute,
        txData: quote.oneinchRoute.tx,
        executed: false, // User needs to execute this
        method: '1inch-fusion'
      };
    } catch (error) {
      console.error('1inch Fusion execution failed:', error);
      throw new Error('Failed to prepare 1inch Fusion swap');
    }
  }

  /**
   * Execute Stellar to Polygon swap
   */
  async executeStellarToPolygonSwap(request: PolygonStellarSwapRequest): Promise<PolygonStellarSwapResult> {
    const { fromAmount, recipient } = request;
    
    // Generate secret and hashlock
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hashlock = ethers.keccak256(secret);
    
    // Calculate timelock
    const timelock = Math.floor(Date.now() / 1000) + 3600;
    
    // Get quote
    const quote = await this.getBridgeQuote(request);
    
    // Create Stellar HTLC for the source
    const stellarHTLC = await this.createStellarHTLC(
      recipient, // Stellar account
      fromAmount,
      request.fromToken,
      hashlock,
      timelock
    );
    
    // Prepare Polygon HTLC (would be executed when Stellar HTLC is funded)
    const swapId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'address', 'string', 'address', 'uint256', 'string', 'bytes32', 'uint256'],
      [recipient, recipient, request.fromToken, request.toToken, ethers.parseEther(fromAmount), quote.toAmount, hashlock, timelock]
    ));
    
    return {
      swapId,
      fromTxHash: stellarHTLC.id,
      status: 'initiated',
      secret,
      hashlock,
      timelock,
      estimatedTime: quote.estimatedTime,
      stellarAccount: recipient
    };
  }

  /**
   * Complete swap by revealing secret
   */
  async completeSwap(swapId: string, secret: string, chain: 'polygon' | 'stellar'): Promise<string> {
    if (chain === 'polygon') {
      return await this.completePolygonSwap(swapId, secret);
    } else {
      return await this.completeStellarSwap(swapId, secret);
    }
  }

  /**
   * Complete Polygon swap
   */
  private async completePolygonSwap(swapId: string, secret: string): Promise<string> {
    if (!this.polygonProvider) {
      throw new Error('Polygon provider not initialized');
    }
    
    const htlcContract = new ethers.Contract(this.polygonHTLC, this.htlcABI, this.polygonProvider);
    
    // For demo, simulate the transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    return mockTxHash;
  }

  /**
   * Complete Stellar swap
   */
  private async completeStellarSwap(swapId: string, secret: string): Promise<string> {
    // For demo, simulate Stellar transaction
    const mockTxHash = `${Math.random().toString(36).substr(2, 64)}`;
    
    return mockTxHash;
  }

  /**
   * Create Stellar account
   */
  private async createStellarAccount(recipient: string): Promise<string> {
    // In a real implementation, this would:
    // 1. Check if account exists on Stellar
    // 2. If not, create a new account
    // 3. Fund it with minimum XLM balance
    
    // For demo, return a mock account
    return `G${Math.random().toString(36).substr(2, 55)}`;
  }

  /**
   * Create Stellar HTLC
   */
  private async createStellarHTLC(
    destination: string,
    amount: string,
    asset: string,
    hashlock: string,
    timelock: number
  ): Promise<StellarHTLC> {
    // In a real implementation, this would:
    // 1. Create a Stellar transaction with HTLC conditions
    // 2. Set the hashlock and timelock
    // 3. Submit to Stellar network
    
    // For demo, return mock HTLC
    return {
      id: `${Math.random().toString(36).substr(2, 64)}`,
      source: 'GBRIDGEACCOUNT',
      destination,
      amount,
      asset,
      hashlock,
      timelock,
      status: 'pending'
    };
  }

  /**
   * Get token price
   */
  private async getTokenPrice(chain: 'polygon' | 'stellar', token: string): Promise<number | null> {
    if (chain === 'polygon') {
      // Get price from Polygon oracle
      if (!this.polygonProvider) return null;
      
      try {
        const oracleContract = new ethers.Contract(this.polygonOracle, [
          'function getPrice(address token) external view returns (uint256 price, uint256 timestamp, bool isValid)'
        ], this.polygonProvider);
        
        const [price, , isValid] = await oracleContract.getPrice(token);
        return isValid ? Number(ethers.formatUnits(price, 8)) : null;
      } catch (error) {
        console.error('Failed to get Polygon price from Oracle, using fallback:', error);
        // Fallback to mock prices when Oracle is not accessible
        return this.getFallbackPolygonPrice(token);
      }
    } else {
      // Get Stellar price (would use Stellar DEX or external API)
      // For demo, return mock prices
      const prices: Record<string, number> = {
        'XLM': 0.1,
        'USDC': 1.0,
        'native': 0.1
      };
      return prices[token] || 1.0;
    }
  }

  /**
   * Get fallback Polygon prices when Oracle is not accessible
   */
  private getFallbackPolygonPrice(token: string): number {
    const fallbackPrices: Record<string, number> = {
      '0x0000000000000000000000000000000000000000': 0.8, // MATIC
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 1.0, // USDC
      '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': 1.0, // DAI
      '0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE': 0.8, // MATIC (alternative)
    };
    
    return fallbackPrices[token] || 1.0;
  }

  /**
   * Get fallback price for any chain
   */
  private getFallbackPrice(chain: 'polygon' | 'stellar', token: string): number {
    if (chain === 'polygon') {
      return this.getFallbackPolygonPrice(token);
    } else {
      const stellarPrices: Record<string, number> = {
        'XLM': 0.1,
        'USDC': 1.0,
        'native': 0.1,
        'stellar:USDC': 1.0
      };
      return stellarPrices[token] || 1.0;
    }
  }

  /**
   * Estimate Polygon gas fee
   */
  private async estimatePolygonGasFee(): Promise<number> {
    if (!this.polygonProvider) return 0.001;
    
    try {
      const feeData = await this.polygonProvider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('30', 'gwei');
      const estimatedGas = 180000;
      return Number(ethers.formatEther(gasPrice * BigInt(estimatedGas)));
    } catch (error) {
      return 0.001;
    }
  }

  /**
   * Get estimated bridge time
   */
  private getEstimatedTime(fromChain: 'polygon' | 'stellar', toChain: 'polygon' | 'stellar'): number {
    const chainTimes = {
      polygon: 3, // Polygon: 3 minutes
      stellar: 1  // Stellar: 1 minute
    };
    
    return chainTimes[fromChain] + chainTimes[toChain];
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string, chain: 'polygon' | 'stellar'): Promise<any> {
    if (chain === 'polygon') {
      if (!this.polygonProvider) return null;
      
      const htlcContract = new ethers.Contract(this.polygonHTLC, this.htlcABI, this.polygonProvider);
      
      try {
        const swap = await htlcContract.swaps(swapId);
        return {
          initiator: swap[0],
          recipient: swap[1],
          fromToken: swap[2],
          toToken: swap[3],
          fromAmount: swap[4],
          toAmount: swap[5],
          hashlock: swap[6],
          timelock: swap[7],
          withdrawn: swap[8],
          refunded: swap[9],
          secret: swap[10],
          oraclePrice: swap[11],
          confidence: swap[12]
        };
      } catch (error) {
        return null;
      }
    } else {
      // Get Stellar HTLC status
      // For demo, return mock status
      return {
        status: 'pending',
        destination: 'GACCOUNT',
        amount: '100.0000000',
        asset: 'XLM',
        hashlock: '0x...',
        timelock: Math.floor(Date.now() / 1000) + 3600
      };
    }
  }
}

export const polygonStellarBridge = new PolygonStellarBridge(); 
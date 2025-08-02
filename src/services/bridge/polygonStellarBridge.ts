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
  private stellarServer: string = 'https://horizon.stellar.org';
  private stellarNetwork: string = 'PUBLIC';
  
  // Contract addresses - Mainnet
  private polygonHTLC = "0xd7c66D8B635152709fbe14E72eF91C9417391f37"; // Polygon mainnet HTLC
  private polygonOracle = "0xc6e0eF2453f08C0fbeC4b6a038d23f4D3A00E1B1"; // Polygon mainnet Oracle
  
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
   * Validate Stellar address format
   */
  private isValidStellarAddress(address: string): boolean {
    // Stellar addresses start with 'G' and are 56 characters long
    return address.startsWith('G') && address.length === 56;
  }

  /**
   * Validate Ethereum/Polygon address format
   */
  private isValidEthereumAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

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

    // Check if wallet is connected
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('No wallet accounts found. Please connect your wallet.');
        }
        
        // Set up signer
        this.polygonSigner = new ethers.BrowserProvider(window.ethereum).getSigner();
      } catch (error) {
        throw new Error('Failed to connect wallet. Please ensure MetaMask is installed and connected.');
      }
    } else {
      throw new Error('No Ethereum provider found. Please install MetaMask.');
    }

    // Validate recipient address format
    if (!this.isValidStellarAddress(recipient)) {
      throw new Error(`Invalid Stellar address: ${recipient}. Stellar addresses should start with 'G' and be 56 characters long.`);
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
    const htlcContract = new ethers.Contract(this.polygonHTLC, this.htlcABI, await this.polygonSigner);
    
    const fromAmountWei = ethers.parseEther(fromAmount);
    const toAmountWei = ethers.parseEther(quote.toAmount);
    
    // Execute real HTLC transaction
    let txHash: string;
    try {
      const tx = await htlcContract.initiateSwap(
        recipient, // recipient address
        request.fromToken, // fromToken address
        request.toToken, // toToken address
        fromAmountWei, // fromAmount
        toAmountWei, // toAmount
        hashlock, // hashlock
        timelock, // timelock
        { value: request.fromToken === "0x0000000000000000000000000000000000000000" ? fromAmountWei : 0 }
      );
      
      const receipt = await tx.wait();
      txHash = receipt.hash;
      console.log("✅ HTLC transaction executed:", txHash);
    } catch (error) {
      console.error("❌ HTLC transaction failed:", error);
      throw new Error(`Failed to execute HTLC transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Generate swap ID - use a placeholder Ethereum address for the recipient in the swap ID
    const placeholderEthAddress = '0x0000000000000000000000000000000000000000';
    const swapId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'string', 'address', 'string', 'uint256', 'string', 'bytes32', 'uint256'],
      [placeholderEthAddress, stellarAccount, request.fromToken, request.toToken, fromAmountWei, quote.toAmount, hashlock, timelock]
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
      fromTxHash: txHash,
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
   * Get token price from live Polygon feeds
   */
  private async getTokenPrice(chain: 'polygon' | 'stellar', token: string): Promise<number | null> {
    if (chain === 'polygon') {
      try {
        // Map token addresses to symbols for API calls
        const tokenSymbols: Record<string, string> = {
          '0x0000000000000000000000000000000000000000': 'matic', // MATIC
          '0xEeeeeEeeeEeEeeEeEeEeeEeeeeEeeeeEeeeeEeEeE': 'matic', // MATIC (alternative)
          '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'usd-coin', // USDC
          '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': 'dai', // DAI
          '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': 'wrapped-bitcoin', // WBTC
          '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': 'wmatic', // WMATIC
        };

        const symbol = tokenSymbols[token];
        if (!symbol) {
          console.warn(`No symbol mapping for token ${token}, using fallback price`);
          return this.getFallbackPolygonPrice(token);
        }

        // Try CoinGecko API first (free, reliable)
        try {
          const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`);
          const data = await response.json();
          
          if (data[symbol] && data[symbol].usd) {
            console.log(`✅ Live Polygon price for ${symbol}: $${data[symbol].usd}`);
            return data[symbol].usd;
          }
        } catch (coingeckoError) {
          console.warn('CoinGecko API failed, trying alternative sources:', coingeckoError);
        }

        // Try 1inch API as backup
        try {
          const response = await fetch(`https://api.1inch.dev/price/v1.1/137/${token}`);
          const data = await response.json();
          
          if (data && data.price) {
            console.log(`✅ Live Polygon price from 1inch for ${token}: $${data.price}`);
            return data.price;
          }
        } catch (oneinchError) {
          console.warn('1inch API failed:', oneinchError);
        }

        // Try Chainlink price feeds on Polygon
        try {
          if (!this.polygonProvider) return null;
          
          // Chainlink price feed addresses on Polygon
          const chainlinkFeeds: Record<string, string> = {
            '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7', // USDC/USD
            '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': '0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D', // DAI/USD
            '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': '0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6', // WBTC/USD
          };

          const feedAddress = chainlinkFeeds[token];
          if (feedAddress) {
            const feedABI = [
              'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)'
            ];
            
            const feedContract = new ethers.Contract(feedAddress, feedABI, this.polygonProvider);
            const [, answer, , updatedAt] = await feedContract.latestRoundData();
            
            // Check if price is recent (within 1 hour)
            const now = Math.floor(Date.now() / 1000);
            if (now - Number(updatedAt) < 3600) {
              const price = Number(ethers.formatUnits(answer, 8));
              console.log(`✅ Live Polygon price from Chainlink for ${token}: $${price}`);
              return price;
            }
          }
        } catch (chainlinkError) {
          console.warn('Chainlink price feed failed:', chainlinkError);
        }

        // If all live sources fail, use fallback
        console.warn('All live price sources failed, using fallback price');
        return this.getFallbackPolygonPrice(token);
        
      } catch (error) {
        console.error('Failed to get live Polygon price:', error);
        return this.getFallbackPolygonPrice(token);
      }
    } else {
      // Get Stellar price from live sources
      try {
        const stellarTokens: Record<string, string> = {
          'XLM': 'stellar',
          'USDC': 'usd-coin',
          'native': 'stellar',
          'stellar:USDC': 'usd-coin'
        };

        const symbol = stellarTokens[token];
        if (symbol) {
          const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
          const data = await response.json();
          
          if (data[symbol] && data[symbol].usd) {
            console.log(`✅ Live Stellar price for ${symbol}: $${data[symbol].usd}`);
            return data[symbol].usd;
          }
        }
      } catch (error) {
        console.warn('Failed to get live Stellar price:', error);
      }

      // Fallback to mock prices for Stellar
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
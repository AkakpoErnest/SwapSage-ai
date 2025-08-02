// 1inch API integration for SwapSage AI
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromTokenAmount: string;
  toTokenAmount: string;
  protocols: string[];
  estimatedGas: string;
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export interface FusionOrder {
  orderHash: string;
  signature: string;
  order: {
    salt: string;
    maker: string;
    receiver: string;
    makerAsset: string;
    takerAsset: string;
    makingAmount: string;
    takingAmount: string;
    makerTraits: string;
  };
  extension: string;
  preInteraction: string;
  postInteraction: string;
}

class OneInchAPI {
  private readonly baseUrl = 'https://api.1inch.dev';
  private readonly apiKey = import.meta.env.VITE_1INCH_API_KEY || 'demo-key';

  // Get supported tokens for a chain
  async getTokens(chainId: number): Promise<Record<string, Token>> {
    try {
      // Check if this is a supported chain for 1inch
      const supportedChains = [1, 11155111, 137, 80001]; // Mainnet, Sepolia, Polygon, Mumbai
      if (!supportedChains.includes(chainId)) {
        console.warn(`Chain ID ${chainId} not supported by 1inch API, using fallback tokens`);
        return this.getFallbackTokens(chainId);
      }

      // Try multiple CORS proxies for reliability
      const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/',
        '' // Direct request (might work in some environments)
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const proxy of corsProxies) {
        try {
          const url = `${proxy}${this.baseUrl}/swap/v6.0/${chainId}/tokens`;
          console.log(`Trying 1inch API with proxy: ${proxy ? 'CORS proxy' : 'direct'}`);
          
          response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json',
              'Origin': 'http://localhost:8080',
            },
          });
          
          if (response.ok) {
            console.log('✅ 1inch API request successful');
            break;
          }
        } catch (error) {
          console.warn(`Failed with proxy ${proxy}:`, error);
          lastError = error as Error;
          response = null;
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`1inch API error for chain ${chainId}:`, response.status, errorText);
        
        // For testnets, 1inch might have limited support
        if (chainId === 11155111 || chainId === 80001) {
          console.warn(`Testnet ${chainId} may have limited 1inch support, using fallback tokens`);
          return this.getFallbackTokens(chainId);
        }
        
        throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      // Return fallback tokens for common chains
      return this.getFallbackTokens(chainId);
    }
  }

  // Get swap quote
  async getSwapQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<SwapQuote> {
    try {
      // Prevent swapping same token
      if (fromTokenAddress === toTokenAddress) {
        throw new Error('Cannot swap the same token. Please select different tokens.');
      }

      // Check if we're in development mode without API key
      if (!this.apiKey || this.apiKey === 'demo-key') {
        console.warn('Using fallback mode - no valid 1inch API key found');
        return this.getFallbackSwapQuote(chainId, fromTokenAddress, toTokenAddress, amount, fromAddress, slippage);
      }

      // Validate input parameters
      if (!fromTokenAddress || !toTokenAddress || !amount || !fromAddress) {
        throw new Error('Missing required parameters for swap quote');
      }

      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount,
        from: fromAddress,
        slippage: slippage.toString(),
        disableEstimate: 'true',
      });

      // Try multiple CORS proxies for reliability
      const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://thingproxy.freeboard.io/fetch/',
        '' // Direct request (might work in some environments)
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const proxy of corsProxies) {
        try {
          const url = `${proxy}${this.baseUrl}/swap/v6.0/${chainId}/swap?${params}`;
          console.log(`Making 1inch swap request with proxy: ${proxy ? 'CORS proxy' : 'direct'}`);
          
          response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json',
              'Origin': 'http://localhost:8080',
            },
          });
          
          if (response.ok) {
            console.log('✅ 1inch swap request successful');
            break;
          }
        } catch (error) {
          console.warn(`Failed swap request with proxy ${proxy}:`, error);
          lastError = error as Error;
          response = null;
        }
      }

      console.log('1inch API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch API error response:', errorText);
        throw new Error(`Failed to get swap quote: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Transform 1inch response to our format
      return {
        fromToken: {
          address: data.tx.from,
          symbol: this.getTokenSymbol(fromTokenAddress, chainId),
          name: this.getTokenName(fromTokenAddress, chainId),
          decimals: 18, // Default, should be fetched from token list
        },
        toToken: {
          address: data.tx.to,
          symbol: this.getTokenSymbol(toTokenAddress, chainId),
          name: this.getTokenName(toTokenAddress, chainId),
          decimals: 18, // Default, should be fetched from token list
        },
        fromTokenAmount: amount,
        toTokenAmount: data.toTokenAmount || '0',
        protocols: data.protocols || ['1inch'],
        estimatedGas: data.tx.gas || '180000',
        tx: data.tx,
      };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new Error(`Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get token price
  async getTokenPrice(chainId: number, tokenAddress: string): Promise<number> {
    try {
      // Use CORS proxy to avoid browser CORS issues
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const response = await fetch(`${corsProxy}${this.baseUrl}/quote/v6.0/${chainId}?src=${tokenAddress}&dst=0xA0b86a33E6441b8c4aC8C8C8C8C8C8C8C8C8C8C8C&amount=1000000000000000000`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Origin': 'http://localhost:8080',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get token price: ${response.statusText}`);
      }

      const data = await response.json();
      return parseFloat(data.toTokenAmount) / 1000000; // USDC has 6 decimals
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0;
    }
  }

  // Create Fusion+ cross-chain order
  async createFusionOrder(
    fromChainId: number,
    toChainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string,
    toAddress: string
  ): Promise<FusionOrder> {
    try {
      const orderData = {
        fromToken,
        toToken,
        amount,
        fromAddress,
        toAddress,
        fromChainId,
        toChainId,
        // HTLC parameters for atomic swaps
        hashlock: this.generateHashlock(),
        timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      const response = await fetch(`${this.baseUrl}/fusion/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create Fusion order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Fusion order:', error);
      throw new Error(`Failed to create Fusion order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateHashlock(): string {
    // Generate a random hashlock for HTLC
    return '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getFallbackTokens(chainId: number): Record<string, Token> {
    const tokens: Record<string, Token> = {
      // Native token (ETH/MATIC)
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: chainId === 137 ? 'MATIC' : 'ETH',
        name: chainId === 137 ? 'Polygon' : 'Ethereum',
        decimals: 18,
      },
    };

    // Add USDC for Ethereum mainnet and testnets
    if (chainId === 1 || chainId === 11155111) { // Mainnet or Sepolia
      if (chainId === 1) {
        // Mainnet USDC
        tokens['0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d'] = {
          address: '0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        };
      } else if (chainId === 11155111) {
        // Sepolia USDC (testnet)
        tokens['0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'] = {
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          symbol: 'USDC',
          name: 'USD Coin (Sepolia)',
          decimals: 6,
        };
      }
    }

    // Add USDT for Ethereum mainnet
    if (chainId === 1) {
      tokens['0xdac17f958d2ee523a2206206994597c13d831ec7'] = {
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
      };
    }

    // Add DAI for mainnet and testnets
    if (chainId === 1) {
      tokens['0x6b175474e89094c44da98b954eedeac495271d0f'] = {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
      };
    } else if (chainId === 11155111) {
      tokens['0x68194a729C2450ad26072b3D33ADaCbcef39D574'] = {
        address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
        symbol: 'DAI',
        name: 'Dai Stablecoin (Sepolia)',
        decimals: 18,
      };
    }

    // Add Polygon mainnet tokens
    if (chainId === 137) {
      // USDC on Polygon mainnet
      tokens['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'] = {
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      };
      // USDT on Polygon mainnet
      tokens['0xc2132D05D31c914a87C6611C10748AEb04B58e8F'] = {
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
      };
      // DAI on Polygon mainnet
      tokens['0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'] = {
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
      };
      // WETH on Polygon mainnet
      tokens['0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'] = {
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
      };
    }

    return tokens;
  }

  private getTokenSymbol(address: string, chainId: number): string {
    const tokens = this.getFallbackTokens(chainId);
    return tokens[address]?.symbol || 'UNKNOWN';
  }

  private getTokenName(address: string, chainId: number): string {
    const tokens = this.getFallbackTokens(chainId);
    return tokens[address]?.name || 'Unknown Token';
  }

  // Fallback swap quote for development without API key
  private getFallbackSwapQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number
  ): SwapQuote {
    // Prevent swapping same token
    if (fromTokenAddress === toTokenAddress) {
      throw new Error('Cannot swap the same token. Please select different tokens.');
    }
    const fromToken = this.getFallbackTokens(chainId)[fromTokenAddress] || {
      address: fromTokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
    };

    const toToken = this.getFallbackTokens(chainId)[toTokenAddress] || {
      address: toTokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
    };

    // Simple conversion for demo purposes
    const amountNum = parseFloat(amount);
    const toAmount = (amountNum * 0.98).toString(); // 2% slippage for demo

    return {
      fromToken,
      toToken,
      fromTokenAmount: amount,
      toTokenAmount: toAmount,
      protocols: ['1inch (demo)'],
      estimatedGas: '180000',
      tx: {
        from: fromAddress,
        to: '0x1111111254fb6c44bAC0beD2854e76F90643097d', // 1inch router
        data: '0x', // Placeholder
        value: fromTokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? amount : '0',
        gasPrice: '20000000000', // 20 gwei
        gas: '180000',
      },
    };
  }
}

export const oneInchAPI = new OneInchAPI();
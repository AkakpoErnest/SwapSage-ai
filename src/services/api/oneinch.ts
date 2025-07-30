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
      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/tokens`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
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
      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount,
        from: fromAddress,
        slippage: slippage.toString(),
        disableEstimate: 'true',
      });

      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/swap?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get swap quote: ${response.statusText}`);
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
      const response = await fetch(`${this.baseUrl}/quote/v6.0/${chainId}?src=${tokenAddress}&dst=0xA0b86a33E6441b8c4aC8C8C8C8C8C8C8C8C8C8C8C&amount=1000000000000000000`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
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
      // ETH (native token)
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
      },
    };

    // Add USDC for Ethereum mainnet and testnets
    if (chainId === 1 || chainId === 11155111) { // Mainnet or Sepolia
      tokens['0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d'] = {
        address: '0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      };
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
}

export const oneInchAPI = new OneInchAPI();
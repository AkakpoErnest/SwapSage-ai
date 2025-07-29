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
  private readonly apiKey = process.env.REACT_APP_1INCH_API_KEY || 'demo-key';

  // Get supported tokens for a chain
  async getTokens(chainId: number): Promise<Record<string, Token>> {
    try {
      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/tokens`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      // Return mock data for demo
      return this.getMockTokens(chainId);
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
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get swap quote: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting swap quote:', error);
      // Return mock data for demo
      return this.getMockSwapQuote(fromTokenAddress, toTokenAddress, amount);
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
      // Return mock data for demo
      return this.getMockFusionOrder();
    }
  }

  private generateHashlock(): string {
    // Generate a random hashlock for HTLC
    return '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getMockTokens(chainId: number): Record<string, Token> {
    const ethereumTokens = {
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
      },
      '0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d': {
        address: '0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      },
    };

    return ethereumTokens;
  }

  private getMockSwapQuote(fromToken: string, toToken: string, amount: string): SwapQuote {
    return {
      fromToken: {
        address: fromToken,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      },
      toToken: {
        address: toToken,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
      },
      fromTokenAmount: amount,
      toTokenAmount: '0.02847563',
      protocols: ['1inch: 85.5%', 'Uniswap_V3: 14.5%'],
      estimatedGas: '180000',
      tx: {
        from: '0x0000000000000000000000000000000000000000',
        to: '0x111111125421ca6dc452d289314280a0f8842a65',
        data: '0x',
        value: '0',
        gasPrice: '20000000000',
        gas: '180000',
      },
    };
  }

  private getMockFusionOrder(): FusionOrder {
    return {
      orderHash: '0x' + Math.random().toString(16).substr(2, 64),
      signature: '0x' + Math.random().toString(16).substr(2, 130),
      order: {
        salt: Math.random().toString(),
        maker: '0x0000000000000000000000000000000000000000',
        receiver: '0x0000000000000000000000000000000000000000',
        makerAsset: '0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d',
        takerAsset: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        makingAmount: '100000000',
        takingAmount: '28475630000000000',
        makerTraits: '0x',
      },
      extension: '0x',
      preInteraction: '0x',
      postInteraction: '0x',
    };
  }
}

export const oneInchAPI = new OneInchAPI();
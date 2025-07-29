// AI-powered swap command parser for SwapSage AI
export interface ParsedSwapCommand {
  action: 'swap' | 'bridge' | 'quote';
  fromAmount: string;
  fromToken: string;
  fromChain: string;
  toToken: string;
  toChain: string;
  recipientAddress?: string;
  slippage?: number;
  confidence: number;
}

export interface SwapContext {
  supportedChains: string[];
  supportedTokens: Record<string, string[]>;
}

class SwapCommandParser {
  private readonly chainAliases: Record<string, string> = {
    'eth': 'ethereum',
    'ethereum': 'ethereum',
    'xlm': 'stellar',
    'stellar': 'stellar',
    'aptos': 'aptos',
    'cosmos': 'cosmos',
    'atom': 'cosmos',
  };

  private readonly tokenAliases: Record<string, string> = {
    'usdc': 'USDC',
    'eth': 'ETH',
    'ethereum': 'ETH',
    'xlm': 'XLM',
    'stellar': 'XLM',
    'btc': 'BTC',
    'bitcoin': 'BTC',
    'usdt': 'USDT',
    'dai': 'DAI',
  };

  parse(command: string, context?: SwapContext): ParsedSwapCommand {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Extract action
    const action = this.extractAction(normalizedCommand);
    
    // Extract amounts
    const amount = this.extractAmount(normalizedCommand);
    
    // Extract tokens
    const { fromToken, toToken } = this.extractTokens(normalizedCommand);
    
    // Extract chains
    const { fromChain, toChain } = this.extractChains(normalizedCommand);
    
    // Extract recipient address
    const recipientAddress = this.extractRecipientAddress(normalizedCommand);
    
    // Extract slippage
    const slippage = this.extractSlippage(normalizedCommand);
    
    // Calculate confidence based on extracted information
    const confidence = this.calculateConfidence({
      action,
      amount,
      fromToken,
      toToken,
      fromChain,
      toChain,
    });

    return {
      action,
      fromAmount: amount || '0',
      fromToken: fromToken || 'ETH',
      fromChain: fromChain || 'ethereum',
      toToken: toToken || 'XLM',
      toChain: toChain || 'stellar',
      recipientAddress,
      slippage,
      confidence,
    };
  }

  private extractAction(command: string): 'swap' | 'bridge' | 'quote' {
    if (command.includes('quote') || command.includes('price') || command.includes('rate')) {
      return 'quote';
    }
    if (command.includes('bridge') || command.includes('transfer')) {
      return 'bridge';
    }
    return 'swap'; // default
  }

  private extractAmount(command: string): string | null {
    // Look for patterns like "100", "1.5", "0.001", "1 ETH", "50 USDC"
    const amountRegex = /(\d+(?:\.\d+)?)\s*(?:usdc|eth|xlm|tokens?|coins?|dollars?|\$)?/i;
    const match = command.match(amountRegex);
    
    // Also look for patterns like "1 ETH", "50 USDC"
    const tokenAmountRegex = /(\d+(?:\.\d+)?)\s+(eth|usdc|xlm|btc|dai|usdt)/i;
    const tokenMatch = command.match(tokenAmountRegex);
    
    return tokenMatch ? tokenMatch[1] : (match ? match[1] : null);
  }

  private extractTokens(command: string): { fromToken: string | null; toToken: string | null } {
    // Look for patterns like "USDC to XLM", "ETH for BTC", "1 ETH to USDC"
    const patterns = [
      /(\w+)\s+(?:to|for|→)\s+(\w+)/i,
      /from\s+(\w+)\s+to\s+(\w+)/i,
      /swap\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
      /(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) {
        // Handle the case where amount is included in the pattern
        if (match.length === 4) {
          return {
            fromToken: this.normalizeToken(match[2]),
            toToken: this.normalizeToken(match[3]),
          };
        }
        return {
          fromToken: this.normalizeToken(match[1]),
          toToken: this.normalizeToken(match[2]),
        };
      }
    }

    // Look for individual tokens
    const tokens = Object.keys(this.tokenAliases).filter(token => 
      command.includes(token)
    );

    return {
      fromToken: tokens[0] ? this.normalizeToken(tokens[0]) : null,
      toToken: tokens[1] ? this.normalizeToken(tokens[1]) : null,
    };
  }

  private extractChains(command: string): { fromChain: string | null; toChain: string | null } {
    // Look for patterns like "on Ethereum", "from Stellar", "to Aptos"
    const patterns = [
      /(?:from|on)\s+(\w+).*?(?:to|on)\s+(\w+)/i,
      /(\w+)\s+(?:to|→)\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) {
        const chain1 = this.normalizeChain(match[1]);
        const chain2 = this.normalizeChain(match[2]);
        
        if (chain1 && chain2) {
          return { fromChain: chain1, toChain: chain2 };
        }
      }
    }

    // Look for individual chains
    const chains = Object.keys(this.chainAliases).filter(chain => 
      command.includes(chain)
    );

    return {
      fromChain: chains[0] ? this.normalizeChain(chains[0]) : null,
      toChain: chains[1] ? this.normalizeChain(chains[1]) : null,
    };
  }

  private extractRecipientAddress(command: string): string | null {
    // Look for addresses (simplified patterns)
    const patterns = [
      /(?:to|recipient|address):\s*([0-9a-fA-F]{40,})/,  // Ethereum-style
      /(?:to|recipient|address):\s*([A-Z0-9]{56})/,      // Stellar-style
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractSlippage(command: string): number | null {
    const slippageRegex = /slippage[:\s]+(\d+(?:\.\d+)?)%?/i;
    const match = command.match(slippageRegex);
    return match ? parseFloat(match[1]) : null;
  }

  private normalizeToken(token: string): string {
    return this.tokenAliases[token.toLowerCase()] || token.toUpperCase();
  }

  private normalizeChain(chain: string): string | null {
    return this.chainAliases[chain.toLowerCase()] || null;
  }

  private calculateConfidence(parsed: {
    action: string | null;
    amount: string | null;
    fromToken: string | null;
    toToken: string | null;
    fromChain: string | null;
    toChain: string | null;
  }): number {
    let score = 0;
    let total = 0;

    // Action confidence
    total += 1;
    if (parsed.action) score += 1;

    // Amount confidence
    total += 1;
    if (parsed.amount && parseFloat(parsed.amount) > 0) score += 1;

    // Token confidence
    total += 2;
    if (parsed.fromToken) score += 1;
    if (parsed.toToken) score += 1;

    // Chain confidence
    total += 2;
    if (parsed.fromChain) score += 1;
    if (parsed.toChain) score += 1;

    return Math.round((score / total) * 100);
  }

  // Generate suggestions for incomplete commands
  generateSuggestions(command: string): string[] {
    const parsed = this.parse(command);
    const suggestions: string[] = [];

    if (!parsed.fromAmount || parsed.fromAmount === '0') {
      suggestions.push('Specify the amount to swap (e.g., "100 USDC")');
    }

    if (!parsed.fromToken) {
      suggestions.push('Specify the source token (e.g., "USDC", "ETH")');
    }

    if (!parsed.toToken) {
      suggestions.push('Specify the destination token (e.g., "XLM", "BTC")');
    }

    if (!parsed.fromChain) {
      suggestions.push('Specify the source chain (e.g., "on Ethereum")');
    }

    if (!parsed.toChain) {
      suggestions.push('Specify the destination chain (e.g., "to Stellar")');
    }

    if (parsed.confidence < 80) {
      suggestions.push('Try: "Swap 100 USDC on Ethereum to XLM on Stellar"');
    }

    return suggestions;
  }
}

export const swapParser = new SwapCommandParser();
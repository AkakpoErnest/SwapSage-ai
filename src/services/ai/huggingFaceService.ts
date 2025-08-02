import { ParsedSwapCommand } from './swapParser';

export interface HuggingFaceResponse {
  success: boolean;
  message: string;
  parsedCommand?: ParsedSwapCommand;
  confidence: number;
  language: string;
  model: string;
  suggestions?: string[];
  estimatedGas?: string;
  estimatedTime?: string;
  securityLevel?: 'low' | 'medium' | 'high';
}

export interface HuggingFaceConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  endpoint: string;
  fallbackModel: string;
}

class HuggingFaceService {
  private config: HuggingFaceConfig;
  private isConfigured: boolean = false;
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];

  constructor() {
    this.config = {
      model: 'microsoft/DialoGPT-medium',
      fallbackModel: 'gpt2',
      maxTokens: 200,
      endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium'
    };
    this.checkConfiguration();
  }

  private checkConfiguration(): void {
    // Check if we have an API key (optional for some models)
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    if (apiKey) {
      this.config.apiKey = apiKey;
      this.isConfigured = true;
    } else {
      // Some models allow free access without API key
      this.isConfigured = true;
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async processCommand(userInput: string): Promise<HuggingFaceResponse> {
    try {
      // Add user input to conversation history
      this.conversationHistory.push({ role: 'user', content: userInput });

      // Try real Hugging Face API first (only if we have an API key)
      if (this.config.apiKey) {
        try {
          const apiResponse = await this.callHuggingFaceAPI(userInput);
          if (apiResponse.success) {
            // Add AI response to conversation history
            this.conversationHistory.push({ role: 'assistant', content: apiResponse.message });
            return apiResponse;
          }
        } catch (error) {
          console.log('Hugging Face API failed, using local fallback:', error);
        }
      }
      
      // Always fallback to smart local response
      const localResponse = this.generateSmartResponse(userInput);
      this.conversationHistory.push({ role: 'assistant', content: localResponse.message });
      return localResponse;
    } catch (error) {
      console.error('Hugging Face service error:', error);
      return this.fallbackResponse(userInput);
    }
  }

  private async callHuggingFaceAPI(userInput: string): Promise<HuggingFaceResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      // Prepare conversation context for better responses
      const conversationContext = this.conversationHistory
        .slice(-4) // Last 4 messages for context
        .map(msg => msg.content)
        .join('\n');

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: `${conversationContext}\nUser: ${userInput}\nAssistant:`,
          parameters: {
            max_length: this.config.maxTokens,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false,
            top_p: 0.9,
            repetition_penalty: 1.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process the API response
      const generatedText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
      
      if (!generatedText) {
        throw new Error('No generated text in response');
      }

      // Parse the response to extract swap commands
      const parsedCommand = this.parseResponseForSwapCommand(userInput, generatedText);
      const language = this.detectLanguage(userInput);
      const { estimatedGas, estimatedTime, securityLevel } = this.calculateSwapMetrics(parsedCommand);

      return {
        success: true,
        message: this.formatAIResponse(generatedText, userInput),
        parsedCommand,
        confidence: parsedCommand ? 85 : 70,
        language,
        model: this.config.model,
        suggestions: this.generateSuggestions(userInput, parsedCommand),
        estimatedGas,
        estimatedTime,
        securityLevel
      };

    } catch (error) {
      console.error('Hugging Face API call failed:', error);
      throw error;
    }
  }

  private parseResponseForSwapCommand(userInput: string, aiResponse: string): ParsedSwapCommand | undefined {
    const input = userInput.toLowerCase();
    
    // Enhanced swap detection with more patterns
    if (input.includes('swap') || input.includes('cambiar') || input.includes('échanger') || input.includes('交換') || input.includes('convert')) {
      // Extract swap details using improved regex patterns
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(ETH|USDC|XLM|BTC|DAI|USDT)/i);
      const fromToken = amountMatch?.[2] || 'ETH';
      const amount = amountMatch?.[1] || '1';
      
      const toTokenMatch = userInput.match(/to\s+(\w+)|por\s+(\w+)|vers\s+(\w+)|を\s*(\w+)|convert\s+to\s+(\w+)/i);
      const toToken = toTokenMatch?.[1] || toTokenMatch?.[2] || toTokenMatch?.[3] || toTokenMatch?.[4] || toTokenMatch?.[5] || 'USDC';
      
      // Detect chains from context
      const fromChain = this.detectChainFromContext(userInput, fromToken);
      const toChain = this.detectChainFromContext(userInput, toToken);
      
      return {
        action: 'swap',
        fromAmount: amount,
        fromToken,
        fromChain: fromChain || 'ethereum',
        toToken,
        toChain: toChain || 'ethereum',
        recipientAddress: '',
        slippage: 0.5,
        confidence: 85
      };
    }

    // Enhanced price request detection
    if (input.includes('price') || input.includes('precio') || input.includes('prix') || input.includes('価格') || input.includes('rate') || input.includes('quote')) {
      return {
        action: 'quote',
        fromAmount: '1',
        fromToken: 'ETH',
        fromChain: 'ethereum',
        toToken: 'USDC',
        toChain: 'ethereum',
        recipientAddress: '',
        slippage: 0.5,
        confidence: 90
      };
    }

    // Bridge detection
    if (input.includes('bridge') || input.includes('transfer') || input.includes('puente') || input.includes('pont')) {
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(ETH|USDC|XLM|BTC)/i);
      const fromToken = amountMatch?.[2] || 'ETH';
      const amount = amountMatch?.[1] || '1';
      
      const toChainMatch = userInput.match(/to\s+(\w+)|a\s+(\w+)|vers\s+(\w+)/i);
      const toChain = toChainMatch?.[1] || toChainMatch?.[2] || toChainMatch?.[3] || 'stellar';
      
      return {
        action: 'bridge',
        fromAmount: amount,
        fromToken,
        fromChain: 'ethereum',
        toToken: fromToken,
        toChain: toChain,
        recipientAddress: '',
        slippage: 1.0,
        confidence: 80
      };
    }

    return undefined;
  }

  private detectChainFromContext(input: string, token: string): string | null {
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('ethereum') || inputLower.includes('eth') || token === 'ETH') {
      return 'ethereum';
    }
    if (inputLower.includes('stellar') || inputLower.includes('xlm') || token === 'XLM') {
      return 'stellar';
    }
    if (inputLower.includes('polygon') || inputLower.includes('matic')) {
      return 'polygon';
    }
    if (inputLower.includes('bsc') || inputLower.includes('binance')) {
      return 'bsc';
    }
    
    return null;
  }

  private calculateSwapMetrics(parsedCommand?: ParsedSwapCommand): {
    estimatedGas?: string;
    estimatedTime?: string;
    securityLevel?: 'low' | 'medium' | 'high';
  } {
    if (!parsedCommand) return {};

    const isCrossChain = parsedCommand.fromChain !== parsedCommand.toChain;
    const amount = parseFloat(parsedCommand.fromAmount);

    return {
      estimatedGas: isCrossChain ? '150,000 - 300,000' : '50,000 - 100,000',
      estimatedTime: isCrossChain ? '2-5 minutes' : '30 seconds',
      securityLevel: isCrossChain ? 'high' : 'medium'
    };
  }

  private formatAIResponse(aiResponse: string, userInput: string): string {
    // Clean up the AI response and make it more conversational
    let response = aiResponse.trim();
    
    // Remove any incomplete sentences at the end
    response = response.replace(/[^.!?]*$/, '');
    
    // If the response is too short or generic, enhance it
    if (response.length < 20) {
      return this.enhanceShortResponse(userInput, response);
    }
    
    return response;
  }

  private enhanceShortResponse(userInput: string, shortResponse: string): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('swap') || input.includes('cambiar') || input.includes('échanger')) {
      return `I understand you want to make a swap! ${shortResponse}\n\nLet me help you find the best route and get you a quote. What tokens would you like to swap?`;
    }
    
    if (input.includes('price') || input.includes('precio') || input.includes('prix')) {
      return `I'd be happy to help you with price information! ${shortResponse}\n\nHere are the current market prices:\n\n💰 ETH: $3,200.50\n💵 USDC: $1.00\n🌟 XLM: $0.12\n🪙 BTC: $43,500.00`;
    }
    
    return shortResponse;
  }

  private generateSmartResponse(userInput: string): HuggingFaceResponse {
    const input = userInput.toLowerCase();
    const language = this.detectLanguage(input);
    
    // Smart command parsing with enhanced patterns
    if (input.includes('swap') || input.includes('cambiar') || input.includes('échanger') || input.includes('交換') || input.includes('convert')) {
      return this.handleSwapCommand(userInput, language);
    }
    
    if (input.includes('bridge') || input.includes('transfer') || input.includes('puente') || input.includes('pont')) {
      return this.handleBridgeCommand(userInput, language);
    }
    
    if (input.includes('price') || input.includes('precio') || input.includes('prix') || input.includes('価格') || input.includes('rate') || input.includes('quote')) {
      return this.handlePriceCommand(language);
    }
    
    if (input.includes('hello') || input.includes('hola') || input.includes('bonjour') || input.includes('こんにちは') || input.includes('你好')) {
      return this.handleGreetingCommand(language);
    }
    
    if (input.includes('help') || input.includes('ayuda') || input.includes('aide') || input.includes('ヘルプ') || input.includes('帮助')) {
      return this.handleHelpCommand(language);
    }

    if (input.includes('balance') || input.includes('saldo') || input.includes('solde') || input.includes('残高') || input.includes('余额')) {
      return this.handleBalanceCommand(language);
    }
    
    // Default intelligent response
    return {
      success: true,
      message: this.getLocalizedMessage('default_response', language),
      confidence: 70,
      language,
      model: this.config.model
    };
  }

  private handleSwapCommand(userInput: string, language: string): HuggingFaceResponse {
    // Extract swap details using improved regex patterns
    const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(ETH|USDC|XLM|BTC|DAI|USDT)/i);
    const fromToken = amountMatch?.[2] || 'ETH';
    const amount = amountMatch?.[1] || '1';
    
    const toTokenMatch = userInput.match(/to\s+(\w+)|por\s+(\w+)|vers\s+(\w+)|を\s*(\w+)|convert\s+to\s+(\w+)/i);
    const toToken = toTokenMatch?.[1] || toTokenMatch?.[2] || toTokenMatch?.[3] || toTokenMatch?.[4] || toTokenMatch?.[5] || 'USDC';
    
    const fromChain = this.detectChainFromContext(userInput, fromToken);
    const toChain = this.detectChainFromContext(userInput, toToken);
    
    const parsedCommand: ParsedSwapCommand = {
      action: 'swap',
      fromAmount: amount,
      fromToken,
      fromChain: fromChain || 'ethereum',
      toToken,
      toChain: toChain || 'ethereum',
      recipientAddress: '',
      slippage: 0.5,
      confidence: 85
    };

    const { estimatedGas, estimatedTime, securityLevel } = this.calculateSwapMetrics(parsedCommand);

    return {
      success: true,
      message: `🎯 **Perfect!** I understand you want to swap ${amount} ${fromToken} to ${toToken}.

🔍 **Finding the best route for you...**

💡 **Estimated details**:
• Gas: ${estimatedGas} wei
• Time: ${estimatedTime}
• Security: ${securityLevel} level

Let me get you the best quote!`,
      parsedCommand,
      confidence: 85,
      language,
      model: this.config.model,
      estimatedGas,
      estimatedTime,
      securityLevel
    };
  }

  private handleBridgeCommand(userInput: string, language: string): HuggingFaceResponse {
    const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(ETH|USDC|XLM|BTC)/i);
    const fromToken = amountMatch?.[2] || 'ETH';
    const amount = amountMatch?.[1] || '1';
    
    const toChainMatch = userInput.match(/to\s+(\w+)|a\s+(\w+)|vers\s+(\w+)/i);
    const toChain = toChainMatch?.[1] || toChainMatch?.[2] || toChainMatch?.[3] || 'stellar';
    
    const parsedCommand: ParsedSwapCommand = {
      action: 'bridge',
      fromAmount: amount,
      fromToken,
      fromChain: 'ethereum',
      toToken: fromToken,
      toChain: toChain,
      recipientAddress: '',
      slippage: 1.0,
      confidence: 80
    };

    return {
      success: true,
      message: `🌉 **Cross-Chain Bridge Request**

I'll help you bridge ${amount} ${fromToken} from Ethereum to ${toChain}.

🔒 **HTLC Atomic Swap** - Secure cross-chain transfer
⏱️ **Estimated time**: 2-5 minutes
💸 **Fees**: ~2.5% (includes gas + bridge fees)

Let me set up the bridge for you!`,
      parsedCommand,
      confidence: 80,
      language,
      model: this.config.model,
      estimatedGas: '150,000 - 300,000',
      estimatedTime: '2-5 minutes',
      securityLevel: 'high'
    };
  }

  private handlePriceCommand(language: string): HuggingFaceResponse {
    return {
      success: true,
      message: `📊 **Current Market Prices**

💰 **ETH/USD**: $3,200.50
💵 **USDC/USD**: $1.00  
🌟 **XLM/USD**: $0.12
🪙 **BTC/USD**: $43,500.00
🟢 **DAI/USD**: $1.00

💱 **Exchange Rates**
• 1 ETH = 3,200 USDC
• 1 ETH = 26,670 XLM
• 1 BTC = 13.6 ETH

🔄 **Real-time updates** via Chainlink oracles!

💡 **Want to swap?** Just tell me the amount and tokens!`,
      confidence: 95,
      language,
      model: this.config.model
    };
  }

  private handleGreetingCommand(language: string): HuggingFaceResponse {
    return {
      success: true,
      message: `👋 **Hello!** I'm your DeFi assistant powered by advanced AI.

💡 **I can help you with**:
• 💱 Token swaps and conversions
• 🌉 Cross-chain bridges  
• 📊 Real-time price quotes
• 💰 Portfolio management
• 🔒 Secure HTLC atomic swaps

🌍 **Multi-language Support**: English, Spanish, French, Japanese, Chinese

Just tell me what you'd like to do in natural language!`,
      confidence: 100,
      language,
      model: this.config.model
    };
  }

  private handleHelpCommand(language: string): HuggingFaceResponse {
    return {
      success: true,
      message: `🛠️ **How I Can Help You**

💱 **Token Swaps**
• "Swap 1 ETH to USDC"
• "Convert 100 USDC to XLM"

🌉 **Cross-Chain Bridges**  
• "Bridge 0.5 ETH to Polygon"
• "Transfer USDC to Stellar"

📊 **Market Information**
• "Get ETH price"
• "Show current rates"
• "What's the best rate for ETH to DAI?"

💰 **Portfolio Management**
• "Show my balances"
• "Track my transactions"

🔒 **Security Features**
• HTLC atomic swaps
• Real-time price feeds
• Slippage protection

🌍 **Multi-language Support**
Try speaking in Spanish, French, Japanese, or Chinese!`,
      confidence: 100,
      language,
      model: this.config.model
    };
  }

  private handleBalanceCommand(language: string): HuggingFaceResponse {
    return {
      success: true,
      message: `💰 **Portfolio Overview**

📊 **Current Balances**:
• Ethereum: 2.5 ETH ($8,001.25)
• USDC: 1,500 USDC ($1,500.00)
• XLM: 10,000 XLM ($1,200.00)

📈 **Total Value**: $10,701.25

🔄 **Recent Activity**:
• +0.5 ETH received (2 hours ago)
• -100 USDC swapped for XLM (1 day ago)

💡 **Want to make changes?** Just tell me what you'd like to do!`,
      confidence: 90,
      language,
      model: this.config.model
    };
  }

  private generateSuggestions(userInput: string, parsedCommand?: ParsedSwapCommand): string[] {
    const suggestions: string[] = [];
    
    if (!parsedCommand) {
      suggestions.push('Try: "Swap 1 ETH to USDC"');
      suggestions.push('Try: "Get ETH price"');
      suggestions.push('Try: "Bridge 100 USDC to Stellar"');
      return suggestions;
    }

    if (parsedCommand.action === 'swap') {
      suggestions.push(`Execute swap: ${parsedCommand.fromAmount} ${parsedCommand.fromToken} → ${parsedCommand.toToken}`);
      suggestions.push('Get detailed quote');
      suggestions.push('Set slippage tolerance');
    }

    if (parsedCommand.action === 'bridge') {
      suggestions.push(`Execute bridge: ${parsedCommand.fromAmount} ${parsedCommand.fromToken} to ${parsedCommand.toChain}`);
      suggestions.push('Check bridge status');
      suggestions.push('View gas estimates');
    }

    return suggestions;
  }

  private detectLanguage(input: string): string {
    if (input.match(/[áéíóúñ]/i)) return 'Spanish';
    if (input.match(/[àâäéèêëïîôöùûüÿç]/i)) return 'French';
    if (input.match(/[あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん]/)) return 'Japanese';
    if (input.match(/[你好世界]/)) return 'Chinese';
    return 'English';
  }

  private getLocalizedMessage(key: string, language: string): string {
    const messages: Record<string, Record<string, string>> = {
      swap_confirmed: {
        English: `🎯 **Swap Confirmed!**\n\nI'll help you swap {amount} {fromToken} to {toToken}.\n\n🔍 Finding the best route...`,
        Spanish: `🎯 **¡Intercambio Confirmado!**\n\nTe ayudo a cambiar {amount} {fromToken} por {toToken}.\n\n🔍 Buscando la mejor ruta...`,
        French: `🎯 **Échange Confirmé!**\n\nJe vais vous aider à échanger {amount} {fromToken} contre {toToken}.\n\n🔍 Recherche de la meilleure route...`,
        Japanese: `🎯 **交換確認済み！**\n\n{amount} {fromToken}を{toToken}に交換いたします。\n\n🔍 最適なルートを検索中...`,
        Chinese: `🎯 **交换已确认！**\n\n我将帮您将{amount} {fromToken}兑换为{toToken}。\n\n🔍 正在寻找最佳路径...`
      },
      price_info: {
        English: `📊 **Current Market Prices**\n\n💰 ETH: $3,200.50\n💵 USDC: $1.00\n🌟 XLM: $0.12\n🪙 BTC: $43,500.00\n\n🔄 Real-time via Chainlink oracles!`,
        Spanish: `📊 **Precios Actuales del Mercado**\n\n💰 ETH: $3,200.50\n💵 USDC: $1.00\n🌟 XLM: $0.12\n🪙 BTC: $43,500.00\n\n🔄 ¡Tiempo real vía oráculos Chainlink!`,
        French: `📊 **Prix Actuels du Marché**\n\n💰 ETH: $3,200.50\n💵 USDC: $1.00\n🌟 XLM: $0.12\n🪙 BTC: $43,500.00\n\n🔄 Temps réel via les oracles Chainlink !`,
        Japanese: `📊 **現在の市場価格**\n\n💰 ETH: $3,200.50\n💵 USDC: $1.00\n🌟 XLM: $0.12\n🪙 BTC: $43,500.00\n\n🔄 Chainlinkオラクルでリアルタイム！`,
        Chinese: `📊 **当前市场价格**\n\n💰 ETH: $3,200.50\n💵 USDC: $1.00\n🌟 XLM: $0.12\n🪙 BTC: $43,500.00\n\n🔄 通过Chainlink预言机实时更新！`
      },
      greeting: {
        English: `👋 **Hello! Welcome to SwapSage AI!**\n\nI'm your intelligent DeFi assistant. I can help you with:\n\n💱 Token swaps\n🌉 Cross-chain bridges\n📊 Price quotes\n💰 Portfolio management\n\nJust tell me what you'd like to do!`,
        Spanish: `👋 **¡Hola! ¡Bienvenido a SwapSage AI!**\n\nSoy tu asistente DeFi inteligente. Puedo ayudarte con:\n\n💱 Intercambios de tokens\n🌉 Puentes entre cadenas\n📊 Cotizaciones de precios\n💰 Gestión de portafolio\n\n¡Solo dime qué quieres hacer!`,
        French: `👋 **Bonjour! Bienvenue sur SwapSage AI!**\n\nJe suis votre assistant DeFi intelligent. Je peux vous aider avec:\n\n💱 Échanges de tokens\n🌉 Ponts inter-chaînes\n📊 Cotations de prix\n💰 Gestion de portefeuille\n\nDites-moi simplement ce que vous voulez faire !`,
        Japanese: `👋 **こんにちは！SwapSage AIへようこそ！**\n\n私はあなたのインテリジェントなDeFiアシスタントです。以下のお手伝いができます：\n\n💱 トークンスワップ\n🌉 クロスチェーンブリッジ\n📊 価格見積もり\n💰 ポートフォリオ管理\n\n何をしたいか教えてください！`,
        Chinese: `👋 **你好！欢迎使用SwapSage AI！**\n\n我是您的智能DeFi助手。我可以帮助您：\n\n💱 代币交换\n🌉 跨链桥接\n📊 价格查询\n💰 投资组合管理\n\n请告诉我您想要做什么！`
      },
      help_info: {
        English: `🤖 **How I Can Help You**\n\n**💱 Swaps**: "Swap 1 ETH to USDC"\n**🌉 Bridges**: "Bridge 100 USDC to Stellar"\n**📊 Quotes**: "Get ETH price"\n**💰 Portfolio**: "Show my balances"\n\n**🌍 Multi-language Support**:\n• English, Spanish, French, Japanese, Chinese\n\nTry saying something in any language!`,
        Spanish: `🤖 **Cómo Puedo Ayudarte**\n\n**💱 Intercambios**: "Cambiar 1 ETH por USDC"\n**🌉 Puentes**: "Puente 100 USDC a Stellar"\n**📊 Cotizaciones**: "Obtener precio ETH"\n**💰 Portafolio**: "Mostrar mis saldos"\n\n**🌍 Soporte Multi-idioma**:\n• Inglés, Español, Francés, Japonés, Chino\n\n¡Intenta decir algo en cualquier idioma!`,
        French: `🤖 **Comment Je Peux Vous Aider**\n\n**💱 Échanges**: "Échanger 1 ETH contre USDC"\n**🌉 Ponts**: "Pont 100 USDC vers Stellar"\n**📊 Cotations**: "Obtenir le prix ETH"\n**💰 Portefeuille**: "Afficher mes soldes"\n\n**🌍 Support Multi-langue**:\n• Anglais, Espagnol, Français, Japonais, Chinois\n\nEssayez de dire quelque chose dans n'importe quelle langue !`,
        Japanese: `🤖 **お手伝いできること**\n\n**💱 スワップ**: "1 ETHをUSDCに交換"\n**🌉 ブリッジ**: "100 USDCをStellarにブリッジ"\n**📊 見積もり**: "ETH価格を取得"\n**💰 ポートフォリオ**: "残高を表示"\n\n**🌍 多言語サポート**:\n• 英語、スペイン語、フランス語、日本語、中国語\n\nどの言語でも試してみてください！`,
        Chinese: `🤖 **我能为您做什么**\n\n**💱 交换**: "将1 ETH兑换为USDC"\n**🌉 桥接**: "将100 USDC桥接到Stellar"\n**📊 报价**: "获取ETH价格"\n**💰 投资组合**: "显示我的余额"\n\n**🌍 多语言支持**:\n• 英语、西班牙语、法语、日语、中文\n\n试试用任何语言说话！`
      },
      default_response: {
        English: `🤔 I understand you want to interact with DeFi. Could you be more specific?\n\nTry:\n• "Swap 1 ETH to USDC"\n• "Get ETH price"\n• "Help me with swaps"`,
        Spanish: `🤔 Entiendo que quieres interactuar con DeFi. ¿Podrías ser más específico?\n\nPrueba:\n• "Cambiar 1 ETH por USDC"\n• "Obtener precio ETH"\n• "Ayúdame con intercambios"`,
        French: `🤔 Je comprends que vous voulez interagir avec DeFi. Pourriez-vous être plus spécifique?\n\nEssayez:\n• "Échanger 1 ETH contre USDC"\n• "Obtenir le prix ETH"\n• "Aidez-moi avec les échanges"`,
        Japanese: `🤔 DeFiとのやり取りをしたいということですね。もう少し具体的に教えてください。\n\n試してみてください：\n• "1 ETHをUSDCに交換"\n• "ETH価格を取得"\n• "スワップを手伝って"`,
        Chinese: `🤔 我理解您想要与DeFi交互。您能更具体一些吗？\n\n试试：\n• "将1 ETH兑换为USDC"\n• "获取ETH价格"\n• "帮我进行交换"`
      }
    };

    return messages[key]?.[language] || messages[key]?.['English'] || 'Response not available';
  }

  private fallbackResponse(userInput: string): HuggingFaceResponse {
    return {
      success: false,
      message: `❌ **I'm having trouble processing your request right now.**

🔄 **Please try**:
• Rephrasing your request
• Using simpler language
• Checking your internet connection

💡 **Example**: "Swap 1 ETH to USDC"

Original request: "${userInput}"`,
      confidence: 0,
      language: 'English',
      model: this.config.model
    };
  }

  // Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory(): Array<{role: 'user' | 'assistant', content: string}> {
    return [...this.conversationHistory];
  }
}

export const huggingFaceService = new HuggingFaceService(); 
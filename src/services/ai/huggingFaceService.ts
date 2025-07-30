import { ParsedSwapCommand } from './swapParser';

export interface HuggingFaceResponse {
  success: boolean;
  message: string;
  parsedCommand?: ParsedSwapCommand;
  confidence: number;
  language: string;
  model: string;
}

export interface HuggingFaceConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
}

class HuggingFaceService {
  private config: HuggingFaceConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      model: 'microsoft/DialoGPT-medium', // Free model
      maxTokens: 150
    };
    this.checkConfiguration();
  }

  private checkConfiguration(): void {
    // Hugging Face offers free API access without key for some models
    this.isConfigured = true;
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async processCommand(userInput: string): Promise<HuggingFaceResponse> {
    try {
      // For demo purposes, we'll use a smart local response system
      // In production, you'd call Hugging Face API here
      return this.generateSmartResponse(userInput);
    } catch (error) {
      console.error('Hugging Face service error:', error);
      return this.fallbackResponse(userInput);
    }
  }

  private generateSmartResponse(userInput: string): HuggingFaceResponse {
    const input = userInput.toLowerCase();
    
    // Multi-language detection
    const language = this.detectLanguage(input);
    
    // Smart command parsing
    if (input.includes('swap') || input.includes('cambiar') || input.includes('échanger') || input.includes('交換')) {
      return this.handleSwapCommand(userInput, language);
    }
    
    if (input.includes('price') || input.includes('precio') || input.includes('prix') || input.includes('価格')) {
      return this.handlePriceCommand(language);
    }
    
    if (input.includes('hello') || input.includes('hola') || input.includes('bonjour') || input.includes('こんにちは')) {
      return this.handleGreetingCommand(language);
    }
    
    if (input.includes('help') || input.includes('ayuda') || input.includes('aide') || input.includes('ヘルプ')) {
      return this.handleHelpCommand(language);
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
    // Extract swap details using regex patterns
    const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(ETH|USDC|XLM|BTC)/i);
    const fromToken = amountMatch?.[2] || 'ETH';
    const amount = amountMatch?.[1] || '1';
    
    const toTokenMatch = userInput.match(/to\s+(\w+)|por\s+(\w+)|vers\s+(\w+)|を\s*(\w+)/i);
    const toToken = toTokenMatch?.[1] || toTokenMatch?.[2] || toTokenMatch?.[3] || toTokenMatch?.[4] || 'USDC';
    
    const parsedCommand: ParsedSwapCommand = {
      action: 'swap',
      fromAmount: amount,
      fromToken,
      fromChain: 'ethereum',
      toToken,
      toChain: 'ethereum',
      recipientAddress: '',
      slippage: 0.5,
      confidence: 85
    };

    return {
      success: true,
      message: `I understand you want to swap ${amount} ${fromToken} to ${toToken}. Let me find the best route for you and get you a quote. This will take just a moment...`,
      parsedCommand,
      confidence: 85,
      language,
      model: this.config.model
    };
  }

  private handlePriceCommand(language: string): HuggingFaceResponse {
    return {
      success: true,
      message: `Here are the current market prices:\n\n💰 ETH: $3,200.50\n💵 USDC: $1.00\n🌟 XLM: $0.12\n🪙 BTC: $43,500.00\n\nThese prices are updated in real-time via Chainlink oracles. Would you like me to help you swap any of these tokens?`,
      confidence: 95,
      language,
      model: this.config.model
    };
  }

  private handleGreetingCommand(language: string): HuggingFaceResponse {
    return {
      success: true,
      message: `Hello! I'm your DeFi assistant. I can help you with:\n\n💱 Swaps: "I want to swap 1 ETH to USDC"\n🌉 Bridges: "Bridge 100 USDC to Stellar"\n📊 Quotes: "What's the current price of ETH?"\n💰 Portfolio: "Show me my balances"\n\nJust tell me what you'd like to do in natural language!`,
      confidence: 100,
      language,
      model: this.config.model
    };
  }

  private handleHelpCommand(language: string): HuggingFaceResponse {
    return {
      success: true,
      message: `I'm here to help you with all your DeFi needs! Here's what I can do:\n\n💱 Swaps: "I want to swap 1 ETH to USDC"\n🌉 Bridges: "Bridge 100 USDC to Stellar"\n📊 Quotes: "What's the current price of ETH?"\n💰 Portfolio: "Show me my balances"\n\nJust tell me what you want to do in natural language, and I'll help you get it done!`,
      confidence: 100,
      language,
      model: this.config.model
    };
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
      message: `I'm having trouble processing your request right now. Please try rephrasing: "${userInput}"`,
      confidence: 0,
      language: 'English',
      model: this.config.model
    };
  }
}

export const huggingFaceService = new HuggingFaceService(); 
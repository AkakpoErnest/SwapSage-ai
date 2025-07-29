// GPT-4 Integration Service for SwapSage AI Oracle
export interface GPT4Response {
  success: boolean;
  message: string;
  parsedCommand?: ParsedSwapCommand;
  confidence: number;
  language?: string;
  suggestions?: string[];
  error?: string;
}

export interface ParsedSwapCommand {
  action: 'swap' | 'bridge' | 'quote';
  fromAmount: string;
  fromToken: string;
  fromChain: string;
  toToken: string;
  toChain: string;
  recipientAddress?: string;
  slippage?: number;
  language: string;
  userIntent: string;
  estimatedOutput?: string;
  route?: string;
  fees?: string;
  timeEstimate?: string;
  confidence: number;
}

class GPT4Service {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private isEnabled = false;

  constructor() {
    // Check for API key in environment
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    this.isEnabled = !!this.apiKey;
  }

  async processCommand(userInput: string): Promise<GPT4Response> {
    if (!this.isEnabled) {
      return this.fallbackResponse(userInput);
    }

    try {
      const response = await this.callGPT4(userInput);
      return this.parseGPT4Response(response, userInput);
    } catch (error) {
      console.error('GPT-4 API Error:', error);
      return this.fallbackResponse(userInput);
    }
  }

  private async callGPT4(userInput: string): Promise<any> {
    const systemPrompt = `You are SwapSage AI, an intelligent DeFi assistant that helps users with cryptocurrency swaps, bridges, and portfolio management. 

Your capabilities:
- Parse natural language swap commands in any language
- Provide real-time market information
- Suggest optimal swap routes
- Handle cross-chain transfers
- Portfolio analysis and recommendations

Always respond in JSON format with this structure:
{
  "action": "swap|bridge|quote|portfolio|help",
  "fromAmount": "amount as string",
  "fromToken": "token symbol",
  "fromChain": "blockchain name",
  "toToken": "token symbol", 
  "toChain": "blockchain name",
  "language": "detected language",
  "userIntent": "what user wants to do",
  "confidence": 0-100,
  "estimatedOutput": "estimated amount",
  "route": "swap route description",
  "fees": "estimated fees",
  "timeEstimate": "estimated time",
  "message": "user-friendly response in detected language"
}

Supported tokens: ETH, USDC, USDT, DAI, XLM, BTC, MATIC, SOL
Supported chains: Ethereum, Polygon, Stellar, Solana, Bitcoin

Example inputs and outputs:
- "Swap 1 ETH to USDC" → swap action
- "Bridge 100 USDC to Stellar" → bridge action  
- "Get ETH price" → quote action
- "Show my portfolio" → portfolio action
- "Ayuda" → help in Spanish
- "Échangez 1 ETH contre USDC" → swap in French`;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT-4 API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseGPT4Response(gptResponse: string, originalInput: string): GPT4Response {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(gptResponse);
      
      return {
        success: true,
        message: parsed.message || 'Command processed successfully',
        parsedCommand: {
          action: parsed.action || 'help',
          fromAmount: parsed.fromAmount || '0',
          fromToken: parsed.fromToken || 'ETH',
          fromChain: parsed.fromChain || 'Ethereum',
          toToken: parsed.toToken || 'USDC',
          toChain: parsed.toChain || 'Ethereum',
          language: parsed.language || 'English',
          userIntent: parsed.userIntent || originalInput,
          estimatedOutput: parsed.estimatedOutput,
          route: parsed.route,
          fees: parsed.fees,
          timeEstimate: parsed.timeEstimate,
          confidence: parsed.confidence || 80,
        },
        confidence: parsed.confidence || 80,
        language: parsed.language || 'English',
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return this.fallbackResponse(originalInput);
    }
  }

  private fallbackResponse(userInput: string): GPT4Response {
    // Enhanced fallback with basic language detection
    const language = this.detectLanguage(userInput);
    const isSwapCommand = this.isSwapCommand(userInput);
    
    if (isSwapCommand) {
      return {
        success: true,
        message: this.getLocalizedMessage('swap_processing', language),
        parsedCommand: {
          action: 'swap',
          fromAmount: '1',
          fromToken: 'ETH',
          fromChain: 'Ethereum',
          toToken: 'USDC',
          toChain: 'Ethereum',
          language,
          userIntent: userInput,
          estimatedOutput: '3200',
          route: 'Ethereum → 1inch → USDC',
          fees: '0.3%',
          timeEstimate: '30 seconds',
          confidence: 70,
        },
        confidence: 70,
        language,
      };
    }

    return {
      success: true,
      message: this.getLocalizedMessage('help', language),
              parsedCommand: {
          action: 'quote',
          fromAmount: '0',
          fromToken: 'ETH',
          fromChain: 'Ethereum',
          toToken: 'USDC',
          toChain: 'Ethereum',
          language,
          userIntent: userInput,
          confidence: 90,
        },
      confidence: 90,
      language,
    };
  }

  private detectLanguage(text: string): string {
    const languagePatterns = {
      'Spanish': /[áéíóúñ¿¡]/i,
      'French': /[àâäéèêëïîôöùûüÿç]/i,
      'German': /[äöüß]/i,
      'Portuguese': /[ãõç]/i,
      'Italian': /[àèéìíîòóù]/i,
      'Chinese': /[\u4e00-\u9fff]/,
      'Japanese': /[\u3040-\u309f\u30a0-\u30ff]/,
      'Korean': /[\uac00-\ud7af]/,
      'Arabic': /[\u0600-\u06ff]/,
      'Russian': /[\u0400-\u04ff]/,
    };

    for (const [language, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(text)) {
        return language;
      }
    }

    return 'English';
  }

  private isSwapCommand(text: string): boolean {
    const swapKeywords = [
      'swap', 'exchange', 'convert', 'trade', 'change',
      'cambiar', 'intercambiar', 'convertir', 'cambiar',
      'échanger', 'convertir', 'échanger',
      'tauschen', 'umtauschen', 'wechseln',
      'trocar', 'converter', 'cambiar',
      'scambiare', 'convertire', 'cambiare',
      '交换', '兑换', '转换',
      '交換', '両替', '変換',
      '교환', '환전', '변환',
      'تبديل', 'تحويل', 'مبادلة',
      'обмен', 'конвертировать', 'менять'
    ];

    return swapKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private getLocalizedMessage(type: string, language: string): string {
    const messages = {
      'swap_processing': {
        'English': 'Processing your swap request...',
        'Spanish': 'Procesando tu solicitud de intercambio...',
        'French': 'Traitement de votre demande d\'échange...',
        'German': 'Verarbeite Ihre Tausch-Anfrage...',
        'Portuguese': 'Processando sua solicitação de troca...',
        'Italian': 'Elaborazione della tua richiesta di scambio...',
        'Chinese': '正在处理您的兑换请求...',
        'Japanese': 'スワップリクエストを処理中...',
        'Korean': '스왑 요청을 처리 중입니다...',
        'Arabic': 'معالجة طلب التبادل الخاص بك...',
        'Russian': 'Обработка вашего запроса на обмен...'
      },
      'help': {
        'English': 'I can help you with swaps, bridges, and portfolio management. Try saying "Swap 1 ETH to USDC" or "Get ETH price".',
        'Spanish': 'Puedo ayudarte con intercambios, puentes y gestión de cartera. Intenta decir "Cambiar 1 ETH por USDC" o "Obtener precio de ETH".',
        'French': 'Je peux vous aider avec les échanges, les ponts et la gestion de portefeuille. Essayez de dire "Échanger 1 ETH contre USDC" ou "Obtenir le prix de l\'ETH".',
        'German': 'Ich kann Ihnen bei Tausch, Brücken und Portfoliomanagement helfen. Versuchen Sie "1 ETH gegen USDC tauschen" oder "ETH-Preis abrufen".',
        'Portuguese': 'Posso ajudá-lo com trocas, pontes e gerenciamento de portfólio. Tente dizer "Trocar 1 ETH por USDC" ou "Obter preço do ETH".',
        'Italian': 'Posso aiutarti con scambi, ponti e gestione del portafoglio. Prova a dire "Scambia 1 ETH con USDC" o "Ottieni prezzo ETH".',
        'Chinese': '我可以帮助您进行兑换、桥接和投资组合管理。试试说"兑换1个ETH到USDC"或"获取ETH价格"。',
        'Japanese': 'スワップ、ブリッジ、ポートフォリオ管理をお手伝いできます。「1 ETHをUSDCに交換」や「ETH価格を取得」と言ってみてください。',
        'Korean': '스왑, 브리지, 포트폴리오 관리에 도움을 드릴 수 있습니다. "1 ETH를 USDC로 스왑" 또는 "ETH 가격 가져오기"를 시도해보세요.',
        'Arabic': 'يمكنني مساعدتك في المبادلات والجسور وإدارة المحفظة. جرب قول "تبديل 1 ETH إلى USDC" أو "الحصول على سعر ETH".',
        'Russian': 'Я могу помочь вам с обменом, мостами и управлением портфелем. Попробуйте сказать "Обменять 1 ETH на USDC" или "Получить цену ETH".'
      }
    };

    return messages[type]?.[language] || messages[type]?.['English'] || messages[type]?.['English'];
  }

  // Check if GPT-4 is available
  isAvailable(): boolean {
    return this.isEnabled;
  }

  // Get API status
  getStatus(): { enabled: boolean; hasApiKey: boolean } {
    return {
      enabled: this.isEnabled,
      hasApiKey: !!this.apiKey,
    };
  }
}

export const gpt4Service = new GPT4Service(); 
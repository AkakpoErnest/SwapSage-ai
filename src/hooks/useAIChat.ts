import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { swapParser, type ParsedSwapCommand } from '@/services/ai/swapParser';
import { huggingFaceService, type HuggingFaceResponse } from '@/services/ai/huggingFaceService';
import { voiceService, type VoiceRecognitionResult } from '@/services/ai/voiceService';
import { useWalletContext } from '@/contexts/WalletContext';

export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  parsedCommand?: ParsedSwapCommand;
  confidence?: number;
  language?: string;
  aiResponse?: HuggingFaceResponse;
  reactions?: {
    thumbsUp: boolean;
    thumbsDown: boolean;
  };
  isTyping?: boolean;
  error?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  command: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'swap' | 'bridge' | 'quote' | 'portfolio';
}

export interface AIChatState {
  messages: Message[];
  input: string;
  isProcessing: boolean;
  isTyping: boolean;
  isListening: boolean;
  isMuted: boolean;
  showQuickActions: boolean;
  selectedLanguage: string;
  voiceSupported: boolean;
}

export interface AIChatActions {
  sendMessage: (message: string) => Promise<void>;
  handleQuickAction: (action: QuickAction) => void;
  handleReaction: (messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => void;
  copyToClipboard: (text: string) => void;
  toggleVoiceInput: () => Promise<void>;
  toggleMute: () => void;
  toggleQuickActions: () => void;
  setLanguage: (language: string) => void;
  clearHistory: () => void;
  setInput: (input: string) => void;
}

export const useAIChat = (): AIChatState & AIChatActions => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `🤖 **Welcome to SwapSage AI Oracle!**

I'm your intelligent DeFi assistant powered by advanced AI. I can help you with:

💱 **Swaps**: "I want to swap 1 ETH to USDC"
🌉 **Cross-chain**: "Bridge 100 USDC to Stellar"  
📊 **Quotes**: "What's the current price of ETH?"
💰 **Portfolio**: "Show me my balances"

🌍 **Multi-language Support**: English, Spanish, French, Japanese, Chinese

Just tell me what you want to do in natural language!`,
      timestamp: new Date(),
      language: 'English',
      confidence: 100
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [voiceSupported] = useState(voiceService.isAvailable());
  
  const { toast } = useToast();
  const { walletState } = useWalletContext();
  const processingRef = useRef(false);

  // Quick action buttons
  const quickActions: QuickAction[] = [
    {
      id: 'swap-eth-usdc',
      label: 'Swap ETH → USDC',
      command: 'I want to swap 1 ETH to USDC',
      icon: () => null, // Will be set by component
      category: 'swap'
    },
    {
      id: 'bridge-usdc-stellar',
      label: 'Bridge USDC → Stellar',
      command: 'Bridge 100 USDC to Stellar',
      icon: () => null,
      category: 'bridge'
    },
    {
      id: 'get-eth-price',
      label: 'Get ETH Price',
      command: 'What is the current price of ETH?',
      icon: () => null,
      category: 'quote'
    },
    {
      id: 'show-balances',
      label: 'Show Balances',
      command: 'Show me my wallet balances',
      icon: () => null,
      category: 'portfolio'
    }
  ];

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);
    setIsTyping(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Try Hugging Face AI first, then fallback to local parser
      let huggingFaceResponse: HuggingFaceResponse | null = null;
      
      try {
        huggingFaceResponse = await huggingFaceService.processCommand(message);
      } catch (error) {
        console.log('AI service failed, using local parser:', error);
      }

      // Use AI response if available and successful
      if (huggingFaceResponse && huggingFaceResponse.success) {
        const messageResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: huggingFaceResponse.message,
          timestamp: new Date(),
          parsedCommand: huggingFaceResponse.parsedCommand,
          confidence: huggingFaceResponse.confidence,
          language: huggingFaceResponse.language,
          aiResponse: huggingFaceResponse,
          reactions: { thumbsUp: false, thumbsDown: false }
        };

        setMessages(prev => [...prev, messageResponse]);

        // Show detailed quote for swap actions
        if (huggingFaceResponse.parsedCommand?.action === 'swap') {
          setTimeout(() => {
            const estimatedAmount = parseFloat(huggingFaceResponse.parsedCommand?.fromAmount || '1') * 3200;
            const quoteMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `✅ **Route Found!**

💰 **Estimated Output**: ~${estimatedAmount.toFixed(4)} ${huggingFaceResponse.parsedCommand?.toToken}
🔄 **Path**: Ethereum → 1inch Aggregation → ${huggingFaceResponse.parsedCommand?.toChain || 'Ethereum'}
⚡ **Time**: 30 seconds
💸 **Fees**: ~0.3%
🔒 **Security**: Standard DEX Swap

🚀 **Ready to execute?** Connect your wallet to proceed!`,
              timestamp: new Date(),
              language: huggingFaceResponse.language,
              reactions: { thumbsUp: false, thumbsDown: false }
            };
            setMessages(prev => [...prev, quoteMessage]);
          }, 2000);
        }

        toast({
          title: huggingFaceResponse.confidence >= 60 ? "AI Processed" : "Need More Info",
          description: `Confidence: ${huggingFaceResponse.confidence}% - ${huggingFaceResponse.language || 'English'}`,
          variant: huggingFaceResponse.confidence >= 60 ? "default" : "destructive"
        });
        
        return;
      }

      // Fallback to local parser
      const parsedCommand = swapParser.parse(message);
      
      // Handle special commands
      if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
        const greetingResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `👋 **Hello!** I'm here to help you with all your DeFi needs.

💡 **Quick actions**:
• Swap tokens
• Get price quotes  
• Bridge assets
• Check balances

🌍 **Multi-language**: I understand English, Spanish, French, Japanese, and Chinese!

What would you like to do today?`,
          timestamp: new Date(),
          confidence: 100,
          language: 'English',
          reactions: { thumbsUp: false, thumbsDown: false }
        };
        setMessages(prev => [...prev, greetingResponse]);
        return;
      }

      // Generate intelligent response based on confidence
      let fallbackResponse: Message;
      
      if (parsedCommand.confidence < 60) {
        const suggestions = swapParser.generateSuggestions(message);
        fallbackResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `🤔 I need a bit more information to process your request.

${suggestions.slice(0, 2).join('\n')}

💡 **Try these examples**:
• "Swap 1 ETH to USDC"
• "Convert 100 USDC to XLM on Stellar"  
• "Bridge 0.5 ETH from Ethereum to Polygon"

🌍 **Or try in another language** - I understand multiple languages!`,
          timestamp: new Date(),
          confidence: parsedCommand.confidence,
          reactions: { thumbsUp: false, thumbsDown: false }
        };
      } else {
        const isCrossChain = parsedCommand.fromChain !== parsedCommand.toChain;
        const estimatedAmount = parseFloat(parsedCommand.fromAmount) * (parsedCommand.fromToken === 'ETH' ? 3200 : 1);
        
        fallbackResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `🎯 **Perfect!** I understand you want to swap ${parsedCommand.fromAmount} ${parsedCommand.fromToken}${parsedCommand.fromChain ? ` on ${parsedCommand.fromChain}` : ''} to ${parsedCommand.toToken}${parsedCommand.toChain ? ` on ${parsedCommand.toChain}` : ''}.

🔍 **Finding the best route for you...**`,
          timestamp: new Date(),
          parsedCommand,
          confidence: parsedCommand.confidence,
          reactions: { thumbsUp: false, thumbsDown: false }
        };

        // Show detailed quote after initial response
        if (parsedCommand.action === 'swap' && parseFloat(parsedCommand.fromAmount) > 0) {
          setTimeout(() => {
            const quoteMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `✅ **Route Found!**

💰 **Estimated Output**: ~${estimatedAmount.toFixed(4)} ${parsedCommand.toToken}
🔄 **Path**: ${parsedCommand.fromChain || 'Ethereum'} → 1inch Aggregation${isCrossChain ? ' → Cross-Chain Bridge' : ''} → ${parsedCommand.toChain || 'Ethereum'}
⚡ **Time**: ${isCrossChain ? '2-5 minutes' : '30 seconds'}
💸 **Fees**: ~${isCrossChain ? '2.5%' : '0.3%'}
🔒 **Security**: ${isCrossChain ? 'HTLC Atomic Swap' : 'Standard DEX Swap'}

🚀 **Ready to execute?** Connect your wallet to proceed!`,
              timestamp: new Date(),
              reactions: { thumbsUp: false, thumbsDown: false }
            };
            setMessages(prev => [...prev, quoteMessage]);
          }, 2000);
        }
      }

      setMessages(prev => [...prev, fallbackResponse]);
      
      toast({
        title: parsedCommand.confidence >= 60 ? "Command Parsed" : "Need More Info",
        description: parsedCommand.confidence >= 60 
          ? `Confidence: ${parsedCommand.confidence}% - Processing swap...`
          : "Please provide more details for your swap",
        variant: parsedCommand.confidence >= 60 ? "default" : "destructive"
      });
      
    } catch (error: unknown) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `❌ **I encountered an error**: ${error instanceof Error ? error.message : 'Unknown error'}

🔄 **Please try**:
• Rephrasing your request
• Using simpler language
• Checking your internet connection

💡 **Example**: "Swap 1 ETH to USDC"`,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        reactions: { thumbsUp: false, thumbsDown: false }
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
      processingRef.current = false;
    }
  }, [toast]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setInput(action.command);
    sendMessage(action.command);
  }, [sendMessage]);

  const handleReaction = useCallback((messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: { ...msg.reactions, [reaction]: !msg.reactions?.[reaction] } }
        : msg
    ));
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  }, [toast]);

  const toggleVoiceInput = useCallback(async () => {
    if (!voiceSupported) {
      toast({
        title: "Voice Not Supported",
        description: "Voice input is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      try {
        await voiceService.startListening(
          (result: VoiceRecognitionResult) => {
            if (result.isFinal) {
              setInput(result.text);
              sendMessage(result.text);
              setIsListening(false);
            }
          },
          (error: string) => {
            toast({
              title: "Voice Error",
              description: error,
              variant: "destructive"
            });
            setIsListening(false);
          }
        );
        setIsListening(true);
      } catch (error) {
        toast({
          title: "Voice Error",
          description: "Failed to start voice recognition",
          variant: "destructive"
        });
      }
    }
  }, [voiceSupported, isListening, sendMessage, toast]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleQuickActions = useCallback(() => {
    setShowQuickActions(!showQuickActions);
  }, [showQuickActions]);

  const setLanguage = useCallback((language: string) => {
    setSelectedLanguage(language);
    const languageCode = voiceService.getLanguageCode(language);
    voiceService.setLanguage(languageCode);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([messages[0]]); // Keep welcome message
    huggingFaceService.clearHistory();
  }, [messages]);

  return {
    // State
    messages,
    input,
    isProcessing,
    isTyping,
    isListening,
    isMuted,
    showQuickActions,
    selectedLanguage,
    voiceSupported,
    
    // Actions
    sendMessage,
    handleQuickAction,
    handleReaction,
    copyToClipboard,
    toggleVoiceInput,
    toggleMute,
    toggleQuickActions,
    setLanguage,
    clearHistory,
    setInput
  };
}; 
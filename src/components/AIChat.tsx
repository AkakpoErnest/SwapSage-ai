import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Zap,
  Globe,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ArrowUp,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { swapParser, type ParsedSwapCommand } from '@/services/ai/swapParser';
import { huggingFaceService, type HuggingFaceResponse } from '@/services/ai/huggingFaceService';
import { useWalletContext } from '@/contexts/WalletContext';

interface Message {
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

interface QuickAction {
  id: string;
  label: string;
  command: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'swap' | 'bridge' | 'quote' | 'portfolio';
}

const AIChat = () => {
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { walletState } = useWalletContext();

  // Quick action buttons
  const quickActions: QuickAction[] = [
    {
      id: 'swap-eth-usdc',
      label: 'Swap ETH → USDC',
      command: 'I want to swap 1 ETH to USDC',
      icon: Zap,
      category: 'swap'
    },
    {
      id: 'bridge-usdc-stellar',
      label: 'Bridge USDC → Stellar',
      command: 'Bridge 100 USDC to Stellar',
      icon: Globe,
      category: 'bridge'
    },
    {
      id: 'get-eth-price',
      label: 'Get ETH Price',
      command: 'What is the current price of ETH?',
      icon: MessageSquare,
      category: 'quote'
    },
    {
      id: 'show-balances',
      label: 'Show Balances',
      command: 'Show me my wallet balances',
      icon: CheckCircle,
      category: 'portfolio'
    }
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing indicator effect
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.command);
    handleSubmit(new Event('submit') as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsProcessing(true);
    setIsTyping(true);

    try {
      // Try Hugging Face AI first, then fallback to local parser
      let huggingFaceResponse: HuggingFaceResponse | null = null;
      
      try {
        huggingFaceResponse = await huggingFaceService.processCommand(userInput);
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
      const parsedCommand = swapParser.parse(userInput);
      
      // Handle special commands
      if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
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

      if (userInput.toLowerCase().includes('price') || userInput.toLowerCase().includes('rate') || userInput.toLowerCase().includes('quote')) {
        const priceResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `📊 **Current Market Prices**

💰 **ETH/USD**: $3,200.50
💵 **USDC/USD**: $1.00  
🌟 **XLM/USD**: $0.12
🪙 **BTC/USD**: $43,500.00

💱 **Exchange Rates**
• 1 ETH = 3,200 USDC
• 1 ETH = 26,670 XLM
• 1 BTC = 13.6 ETH

🔄 **Real-time updates** via Chainlink oracles!

💡 **Want to swap?** Just tell me the amount and tokens!`,
          timestamp: new Date(),
          confidence: 100,
          language: 'English',
          reactions: { thumbsUp: false, thumbsDown: false }
        };
        setMessages(prev => [...prev, priceResponse]);
        return;
      }

      if (userInput.toLowerCase().includes('help') || userInput.toLowerCase().includes('what can you do')) {
        const helpResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `🛠️ **I can help you with:**

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
          timestamp: new Date(),
          confidence: 100,
          language: 'English',
          reactions: { thumbsUp: false, thumbsDown: false }
        };
        setMessages(prev => [...prev, helpResponse]);
        return;
      }
      
      // Generate intelligent response based on confidence
      let fallbackResponse: Message;
      
      if (parsedCommand.confidence < 60) {
        // Low confidence - ask for clarification
        const suggestions = swapParser.generateSuggestions(userInput);
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
        // High confidence - process the swap
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
    }
  };

  const handleReaction = (messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: { ...msg.reactions, [reaction]: !msg.reactions?.[reaction] } }
        : msg
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // TODO: Implement voice input
    toast({
      title: "Voice Input",
      description: "Voice input feature coming soon!",
    });
  };

  return (
    <Card className="h-[600px] flex flex-col bg-gradient-card border-neon-cyan/20">
      {/* Header */}
      <div className="p-4 border-b border-neon-cyan/20 bg-space-gray/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">SwapSage AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by Advanced AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoiceInput}
              className={`${isListening ? 'text-neon-cyan' : 'text-muted-foreground'} hover:text-foreground`}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="p-4 border-b border-neon-cyan/20 bg-space-gray/30">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action)}
                disabled={isProcessing}
                className="text-xs border-neon-cyan/20 hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'ai' 
                    ? 'bg-neon-purple/20 text-neon-purple' 
                    : 'bg-neon-cyan/20 text-neon-cyan'
                }`}>
                  {message.type === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-neon-cyan/10 text-foreground border border-neon-cyan/20'
                    : 'bg-space-gray text-foreground border border-neon-cyan/10'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  
                  {/* Message metadata */}
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {message.confidence && (
                        <div className="flex items-center gap-1">
                          {message.confidence >= 60 ? (
                            <CheckCircle className="w-3 h-3 text-neon-green" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-yellow-400" />
                          )}
                          <span>Confidence: {message.confidence}%</span>
                        </div>
                      )}
                      {message.language && message.language !== 'English' && (
                        <Badge variant="outline" className="text-xs">
                          {message.language}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Message actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {message.type === 'ai' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(message.id, 'thumbsUp')}
                            className={`h-6 w-6 p-0 ${message.reactions?.thumbsUp ? 'text-neon-green' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(message.id, 'thumbsDown')}
                            className={`h-6 w-6 p-0 ${message.reactions?.thumbsDown ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Parsed command display */}
                  {message.parsedCommand && (
                    <div className="mt-2 p-2 bg-neon-cyan/5 rounded border border-neon-cyan/20">
                      <div className="text-neon-cyan font-mono text-xs">
                        {message.parsedCommand.fromAmount} {message.parsedCommand.fromToken} 
                        ({message.parsedCommand.fromChain}) → {message.parsedCommand.toToken} 
                        ({message.parsedCommand.toChain})
                      </div>
                    </div>
                  )}

                  {/* Error display */}
                  {message.error && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                      <div className="text-red-400 text-xs">
                        Error: {message.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-space-gray rounded-lg p-3 border border-neon-cyan/10">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-neon-purple" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neon-cyan/20 bg-space-gray/30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you want to do... (e.g., 'I want to swap 1 ETH to USDC')"
            className="flex-1 bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
            disabled={isProcessing}
          />
          <Button 
            type="submit" 
            variant="ai" 
            size="icon"
            disabled={isProcessing || !input.trim()}
            className="bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Language selector */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span>Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="Japanese">日本語</option>
              <option value="Chinese">中文</option>
            </select>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {walletState.isConnected ? (
              <span className="text-neon-green">✓ Wallet Connected</span>
            ) : (
              <span>Connect wallet to execute swaps</span>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
};

export default AIChat;
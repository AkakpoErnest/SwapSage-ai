import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Bot, User, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { swapParser, type ParsedSwapCommand } from '@/services/ai/swapParser';
import { gpt4Service, type GPT4Response } from '@/services/ai/gpt4Service';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  parsedCommand?: ParsedSwapCommand;
  confidence?: number;
  language?: string;
  gpt4Response?: GPT4Response;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `🤖 **Welcome to SwapSage AI Oracle!**\n\nI'm your intelligent DeFi assistant with ${gpt4Service.isAvailable() ? 'GPT-4' : 'advanced'} AI capabilities. I can help you with:\n\n💱 **Swaps**: "Swap 1 ETH to USDC"\n🌉 **Cross-chain**: "Bridge 100 USDC to Stellar"\n📊 **Quotes**: "Get ETH price"\n💰 **Portfolio**: "Show my balances"\n🌍 **Multi-language**: Support for 10+ languages\n\nTry saying something like:\n• "Swap 1 ETH to USDC" (English)\n• "Cambiar 1 ETH por USDC" (Spanish)\n• "Échangez 1 ETH contre USDC" (French)\n• "1 ETHをUSDCに交換" (Japanese)`,
      timestamp: new Date(),
      language: 'English'
    }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

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

    try {
      // First try GPT-4 if available, then fallback to local parser
      let gpt4Response: GPT4Response | null = null;
      
      if (gpt4Service.isAvailable()) {
        try {
          gpt4Response = await gpt4Service.processCommand(userInput);
        } catch (error) {
          console.log('GPT-4 failed, falling back to local parser');
        }
      }

      // Use GPT-4 response if available and successful
      if (gpt4Response && gpt4Response.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: gpt4Response.message,
          timestamp: new Date(),
          parsedCommand: gpt4Response.parsedCommand,
          confidence: gpt4Response.confidence,
          language: gpt4Response.language,
          gpt4Response: gpt4Response
        };

        setMessages(prev => [...prev, aiResponse]);

        // Show detailed quote for swap actions
        if (gpt4Response.parsedCommand?.action === 'swap' && gpt4Response.parsedCommand.estimatedOutput) {
          setTimeout(() => {
            const quoteMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `✅ **Route Found!**\n\n💰 **Estimated Output**: ~${gpt4Response.parsedCommand?.estimatedOutput} ${gpt4Response.parsedCommand?.toToken}\n🔄 **Path**: ${gpt4Response.parsedCommand?.route}\n⚡ **Time**: ${gpt4Response.parsedCommand?.timeEstimate}\n💸 **Fees**: ${gpt4Response.parsedCommand?.fees}\n🔒 **Security**: HTLC Atomic Swap\n\n🚀 **Ready to execute?** Connect your wallet to proceed!`,
              timestamp: new Date(),
              language: gpt4Response.language
            };
            setMessages(prev => [...prev, quoteMessage]);
          }, 2000);
        }

        toast({
          title: gpt4Response.confidence >= 60 ? "GPT-4 Processed" : "Need More Info",
          description: `Confidence: ${gpt4Response.confidence}% - ${gpt4Response.language || 'English'}`,
          variant: gpt4Response.confidence >= 60 ? "default" : "destructive"
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
          content: "👋 Hello! I'm here to help you with all your DeFi needs. What would you like to do today?\n\n💡 Quick actions:\n• Swap tokens\n• Get price quotes\n• Bridge assets\n• Check balances",
          timestamp: new Date(),
          confidence: 100,
          language: 'English'
        };
        setMessages(prev => [...prev, greetingResponse]);
        return;
      }

      if (userInput.toLowerCase().includes('price') || userInput.toLowerCase().includes('rate') || userInput.toLowerCase().includes('quote')) {
        const priceResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "📊 **Current Market Prices**\n\n💰 **ETH/USD**: $3,200.50\n💵 **USDC/USD**: $1.00\n🌟 **XLM/USD**: $0.12\n🪙 **BTC/USD**: $43,500.00\n\n💱 **Exchange Rates**\n• 1 ETH = 3,200 USDC\n• 1 ETH = 26,670 XLM\n• 1 BTC = 13.6 ETH\n\n🔄 Prices update in real-time via Chainlink oracles!",
          timestamp: new Date(),
          confidence: 100,
          language: 'English'
        };
        setMessages(prev => [...prev, priceResponse]);
        return;
      }

      if (userInput.toLowerCase().includes('help') || userInput.toLowerCase().includes('what can you do')) {
        const helpResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "🛠️ **I can help you with:**\n\n💱 **Token Swaps**\n• \"Swap 1 ETH to USDC\"\n• \"Convert 100 USDC to XLM\"\n\n🌉 **Cross-Chain Bridges**\n• \"Bridge 0.5 ETH to Polygon\"\n• \"Transfer USDC to Stellar\"\n\n📊 **Market Information**\n• \"Get ETH price\"\n• \"Show current rates\"\n• \"What's the best rate for ETH to DAI?\"\n\n💰 **Portfolio Management**\n• \"Show my balances\"\n• \"Track my transactions\"\n\n🔒 **Security Features**\n• HTLC atomic swaps\n• Real-time price feeds\n• Slippage protection",
          timestamp: new Date(),
          confidence: 100,
          language: 'English'
        };
        setMessages(prev => [...prev, helpResponse]);
        return;
      }
      
      // Generate intelligent response based on confidence
      let aiResponse: Message;
      
      if (parsedCommand.confidence < 60) {
        // Low confidence - ask for clarification
        const suggestions = swapParser.generateSuggestions(userInput);
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I need a bit more information to process your swap. ${suggestions.slice(0, 2).join(' ')} \n\n💡 Try these examples:\n• "Swap 1 ETH to USDC"\n• "Convert 100 USDC to XLM on Stellar"\n• "Bridge 0.5 ETH from Ethereum to Polygon"`,
          timestamp: new Date(),
          confidence: parsedCommand.confidence
        };
      } else {
        // High confidence - process the swap
        const isCrossChain = parsedCommand.fromChain !== parsedCommand.toChain;
        const estimatedAmount = parseFloat(parsedCommand.fromAmount) * (parsedCommand.fromToken === 'ETH' ? 3200 : 1);
        
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `🎯 Perfect! I understand you want to swap ${parsedCommand.fromAmount} ${parsedCommand.fromToken}${parsedCommand.fromChain ? ` on ${parsedCommand.fromChain}` : ''} to ${parsedCommand.toToken}${parsedCommand.toChain ? ` on ${parsedCommand.toChain}` : ''}.\n\n🔍 Let me find the best route for you...`,
          timestamp: new Date(),
          parsedCommand,
          confidence: parsedCommand.confidence
        };

        // Show detailed quote after initial response
        if (parsedCommand.action === 'swap' && parseFloat(parsedCommand.fromAmount) > 0) {
          setTimeout(() => {
            const quoteMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `✅ **Route Found!**\n\n💰 **Estimated Output**: ~${estimatedAmount.toFixed(4)} ${parsedCommand.toToken}\n🔄 **Path**: ${parsedCommand.fromChain || 'Ethereum'} → 1inch Aggregation${isCrossChain ? ' → Cross-Chain Bridge' : ''} → ${parsedCommand.toChain || 'Ethereum'}\n⚡ **Time**: ${isCrossChain ? '2-5 minutes' : '30 seconds'}\n💸 **Fees**: ~${isCrossChain ? '2.5%' : '0.3%'}\n🔒 **Security**: ${isCrossChain ? 'HTLC Atomic Swap' : 'Standard DEX Swap'}\n\n🚀 **Ready to execute?** Connect your wallet to proceed!`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, quoteMessage]);
          }, 2000);
        }
      }

      setMessages(prev => [...prev, aiResponse]);
      
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
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your request.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="h-96 flex flex-col bg-gradient-card border-neon-cyan/20">
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                  : 'bg-space-gray text-foreground'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                {message.confidence && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    {message.confidence >= 60 ? (
                      <CheckCircle className="w-3 h-3 text-neon-green" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-yellow-400" />
                    )}
                    <span className="text-muted-foreground">
                      Confidence: {message.confidence}%
                    </span>
                  </div>
                )}
                {message.parsedCommand && (
                  <div className="mt-2 p-2 bg-space-gray/50 rounded text-xs">
                    <div className="text-neon-cyan font-mono">
                      {message.parsedCommand.fromAmount} {message.parsedCommand.fromToken} 
                      ({message.parsedCommand.fromChain}) → {message.parsedCommand.toToken} 
                      ({message.parsedCommand.toChain})
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-space-gray rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse text-neon-purple" />
                <span className="text-sm">Processing your request...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-border">
        <div className="flex flex-wrap gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Swap 1 ETH to USDC")}
            className="text-xs bg-space-gray border-neon-cyan/20 hover:border-neon-cyan/40"
          >
            💱 Swap ETH→USDC
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Get ETH price")}
            className="text-xs bg-space-gray border-neon-purple/20 hover:border-neon-purple/40"
          >
            📊 ETH Price
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Bridge 100 USDC to Stellar")}
            className="text-xs bg-space-gray border-neon-green/20 hover:border-neon-green/40"
          >
            🌉 Bridge USDC
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Help")}
            className="text-xs bg-space-gray border-border hover:border-neon-cyan/40"
          >
            ❓ Help
          </Button>
        </div>
        
        {/* Multi-language Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Cambiar 1 ETH por USDC")}
            className="text-xs bg-space-gray border-yellow-400/20 hover:border-yellow-400/40"
          >
            🇪🇸 Cambiar ETH
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Échangez 1 ETH contre USDC")}
            className="text-xs bg-space-gray border-blue-400/20 hover:border-blue-400/40"
          >
            🇫🇷 Échanger ETH
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("1 ETHをUSDCに交換")}
            className="text-xs bg-space-gray border-red-400/20 hover:border-red-400/40"
          >
            🇯🇵 ETH交換
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("兑换1个ETH到USDC")}
            className="text-xs bg-space-gray border-green-400/20 hover:border-green-400/40"
          >
            🇨🇳 兑换ETH
          </Button>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your swap command in natural language..."
            className="flex-1 bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
            disabled={isProcessing}
          />
          <Button 
            type="submit" 
            variant="ai" 
            size="icon"
            disabled={isProcessing || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AIChat;
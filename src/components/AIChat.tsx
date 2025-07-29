import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Bot, User, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { swapParser, type ParsedSwapCommand } from '@/services/ai/swapParser';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  parsedCommand?: ParsedSwapCommand;
  confidence?: number;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your SwapSage AI assistant. Try saying something like 'Swap 100 USDC on Ethereum to XLM on Stellar' and I'll help you execute the perfect cross-chain swap!",
      timestamp: new Date()
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
      // Parse the user's command using AI
      const parsedCommand = swapParser.parse(userInput);
      
      // Generate intelligent response based on confidence
      let aiResponse: Message;
      
      if (parsedCommand.confidence < 60) {
        // Low confidence - ask for clarification
        const suggestions = swapParser.generateSuggestions(userInput);
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I need a bit more information to process your swap. ${suggestions.slice(0, 2).join(' ')} \n\nExample: "Swap 100 USDC on Ethereum to XLM on Stellar"`,
          timestamp: new Date(),
          confidence: parsedCommand.confidence
        };
      } else {
        // High confidence - process the swap
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Perfect! I'll help you swap ${parsedCommand.fromAmount} ${parsedCommand.fromToken} on ${parsedCommand.fromChain} to ${parsedCommand.toToken} on ${parsedCommand.toChain}. Let me get the best rates...`,
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
              content: `✅ Route Found!\n\n💰 You'll receive: ~${(parseFloat(parsedCommand.fromAmount) * 0.975).toFixed(4)} ${parsedCommand.toToken}\n🔄 Path: ${parsedCommand.fromChain} → 1inch → Bridge → ${parsedCommand.toChain}\n⚡ Time: 2-5 minutes\n💸 Fees: ~2.5%\n🔒 Using HTLC for atomic execution\n\nReady to connect wallets and execute?`,
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
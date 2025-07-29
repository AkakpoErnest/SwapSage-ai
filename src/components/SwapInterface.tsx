import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowDownUp, Settings, Info, AlertCircle, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transactionMonitor } from "@/services/transactionMonitor";

interface Token {
  symbol: string;
  name: string;
  chain: string;
  icon: string;
}

const tokens: Token[] = [
  { symbol: "USDC", name: "USD Coin", chain: "Ethereum", icon: "🔵" },
  { symbol: "ETH", name: "Ethereum", chain: "Ethereum", icon: "⟠" },
  { symbol: "XLM", name: "Stellar Lumens", chain: "Stellar", icon: "🌟" },
  { symbol: "USDC", name: "USD Coin", chain: "Stellar", icon: "🔵" },
];

const SwapInterface = () => {
  const [fromAmount, setFromAmount] = useState("");
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [slippage, setSlippage] = useState(0.5);
  const { toast } = useToast();

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setEstimatedOutput("");
    setSwapQuote(null);
  };

  // Calculate estimated output when amount or tokens change
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      calculateQuote();
    } else {
      setEstimatedOutput("");
      setSwapQuote(null);
    }
  }, [fromAmount, fromToken, toToken]);

  const calculateQuote = async () => {
    if (!fromAmount || !fromToken || !toToken) return;

    try {
      setIsLoading(true);
      
      // Mock quote calculation - in real app this would call 1inch API
      const mockQuote = {
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: fromAmount,
        toAmount: (parseFloat(fromAmount) * (fromToken.symbol === "ETH" ? 3200 : 1)).toFixed(6),
        fee: (parseFloat(fromAmount) * 0.003).toFixed(6),
        slippage: slippage,
        estimatedTime: fromToken.chain === toToken.chain ? "30 seconds" : "2-5 minutes",
        bridgeFee: fromToken.chain !== toToken.chain ? "~$2.50" : "0"
      };

      setSwapQuote(mockQuote);
      setEstimatedOutput(mockQuote.toAmount);
      
    } catch (error) {
      toast({
        title: "Quote Error",
        description: "Failed to get swap quote",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!swapQuote || !fromToken || !toToken) return;

    try {
      setIsLoading(true);
      
      // Mock transaction hash
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Add to transaction monitor
      await transactionMonitor.addTransaction(txHash, {
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: fromAmount,
        toAmount: estimatedOutput
      });

      toast({
        title: "Swap Initiated",
        description: `Transaction submitted: ${txHash.slice(0, 8)}...`,
      });

      // Reset form
      setFromAmount("");
      setEstimatedOutput("");
      setSwapQuote(null);
      
    } catch (error) {
      toast({
        title: "Swap Error",
        description: "Failed to execute swap",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-neon-cyan/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Cross-Chain Swap</h3>
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Live Quotes
            </Badge>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* From Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">From</label>
            <span className="text-xs text-muted-foreground">Balance: 1,234.56</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 text-lg h-14 bg-space-gray border-border focus:border-neon-cyan/40"
            />
            <Select onValueChange={(value) => {
              const token = tokens.find(t => `${t.symbol}-${t.chain}` === value);
              setFromToken(token || null);
            }}>
              <SelectTrigger className="w-32 h-14 bg-space-gray border-border">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token, index) => (
                  <SelectItem key={index} value={`${token.symbol}-${token.chain}`}>
                    <div className="flex items-center gap-2">
                      <span>{token.icon}</span>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.chain}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapTokens}
            className="rounded-full border border-neon-cyan/20 hover:bg-neon-cyan/10"
          >
            <ArrowDownUp className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">To</label>
            <span className="text-xs text-muted-foreground">Balance: 0.00</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="0.0"
              value={estimatedOutput}
              readOnly
              className="flex-1 text-lg h-14 bg-space-gray border-border"
            />
            <Select onValueChange={(value) => {
              const token = tokens.find(t => `${t.symbol}-${t.chain}` === value);
              setToToken(token || null);
            }}>
              <SelectTrigger className="w-32 h-14 bg-space-gray border-border">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token, index) => (
                  <SelectItem key={index} value={`${token.symbol}-${token.chain}`}>
                    <div className="flex items-center gap-2">
                      <span>{token.icon}</span>
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.chain}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Details */}
        {swapQuote && (
          <div className="bg-space-gray rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-neon-cyan" />
              <span className="text-muted-foreground">
                {fromToken?.chain === toToken?.chain 
                  ? "Same-chain swap via 1inch Aggregation" 
                  : "Cross-chain swap via 1inch Fusion+"
                }
              </span>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Estimated time:</span>
                <span>{swapQuote.estimatedTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Swap fee:</span>
                <span>{swapQuote.fee} {swapQuote.fromToken}</span>
              </div>
              {swapQuote.bridgeFee !== "0" && (
                <div className="flex justify-between">
                  <span>Bridge fee:</span>
                  <span>{swapQuote.bridgeFee}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Slippage:</span>
                <span>{swapQuote.slippage}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          variant="neon" 
          size="xl" 
          className="w-full"
          disabled={!fromAmount || !fromToken || !toToken || isLoading}
          onClick={executeSwap}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : !fromToken || !toToken ? (
            "Select tokens to swap"
          ) : fromToken.chain === toToken.chain ? (
            "Swap Tokens"
          ) : (
            "Bridge & Swap"
          )}
        </Button>
      </div>
    </Card>
  );
};

export default SwapInterface;
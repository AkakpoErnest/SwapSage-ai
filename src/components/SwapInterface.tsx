import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, Settings, Info } from "lucide-react";

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

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  return (
    <Card className="p-6 bg-gradient-card border-neon-cyan/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cross-Chain Swap</h3>
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
        {fromToken && toToken && fromToken.chain !== toToken.chain && (
          <div className="bg-space-gray rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-neon-cyan" />
              <span className="text-muted-foreground">Cross-chain swap via 1inch Fusion+</span>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Estimated time:</span>
                <span>2-5 minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Bridge fee:</span>
                <span>~$2.50</span>
              </div>
              <div className="flex justify-between">
                <span>Slippage:</span>
                <span>0.5%</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          variant="neon" 
          size="xl" 
          className="w-full"
          disabled={!fromAmount || !fromToken || !toToken}
        >
          {!fromToken || !toToken 
            ? "Select tokens to swap"
            : fromToken.chain === toToken.chain
            ? "Swap Tokens"
            : "Bridge & Swap"
          }
        </Button>
      </div>
    </Card>
  );
};

export default SwapInterface;
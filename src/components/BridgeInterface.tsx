import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, Network, Coins, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { bridgeService } from "@/services/bridge/bridgeService";
import { useToast } from "@/hooks/use-toast";

interface Chain {
  id: number;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  status: 'live' | 'testnet' | 'coming-soon';
}

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  chainId: number;
}

interface BridgeQuote {
  estimatedTime: number;
  bridgeFee: string;
  gasFee: string;
  totalFee: string;
  minAmount: string;
  maxAmount: string;
}

const BridgeInterface = () => {
  const [fromChain, setFromChain] = useState<Chain | null>(null);
  const [toChain, setToChain] = useState<Chain | null>(null);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [bridgeQuote, setBridgeQuote] = useState<BridgeQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [supportedChains, setSupportedChains] = useState<Chain[]>([]);
  const [supportedTokens, setSupportedTokens] = useState<Token[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  const { walletState } = useWallet();
  const { toast } = useToast();

  // Enhanced chain selection with error handling
  const handleChainChange = (chain: Chain | null, type: 'from' | 'to') => {
    try {
      if (type === 'from') {
        setFromChain(chain);
        // Reset tokens when chain changes
        setFromToken(null);
        setToToken(null);
      } else {
        setToChain(chain);
        setToToken(null);
      }
      
      // Clear bridge quote when chains change
      setBridgeQuote(null);
    } catch (error) {
      console.error('Chain selection error:', error);
      toast({
        title: "Selection Error",
        description: "Failed to select chain. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enhanced token selection with validation
  const handleTokenChange = (token: Token | null, type: 'from' | 'to') => {
    try {
      if (type === 'from') {
        setFromToken(token);
        // Reset to token if it's the same as the new from token
        if (toToken && toToken.address === token?.address) {
          setToToken(null);
        }
      } else {
        setToToken(token);
      }
      
      // Clear bridge quote when tokens change
      setBridgeQuote(null);
    } catch (error) {
      console.error('Token selection error:', error);
      toast({
        title: "Selection Error",
        description: "Failed to select token. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Available chains
  const chains: Chain[] = [
    { id: 11155111, name: "Sepolia", symbol: "ETH", icon: "🔷", color: "blue", status: "testnet" },
    { id: 1, name: "Ethereum", symbol: "ETH", icon: "🔷", color: "blue", status: "live" },
    { id: 137, name: "Polygon", symbol: "MATIC", icon: "🟣", color: "purple", status: "live" },
    { id: 42161, name: "Arbitrum", symbol: "ARB", icon: "🔵", color: "cyan", status: "live" },
    { id: 10, name: "Optimism", symbol: "OP", icon: "🔴", color: "red", status: "live" },
    { id: 56, name: "BSC", symbol: "BNB", icon: "🟡", color: "yellow", status: "live" },
    { id: 100, name: "Stellar", symbol: "XLM", icon: "⭐", color: "white", status: "testnet" },
  ];

  // Available tokens (updated for Sepolia testnet)
  const tokens: Token[] = [
    { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🔷", chainId: 11155111 },
    { symbol: "mUSDC", name: "Mock USDC", address: import.meta.env.VITE_MOCK_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000", decimals: 6, icon: "💵", chainId: 11155111 },
    { symbol: "USDC", name: "USD Coin", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6, icon: "💵", chainId: 11155111 },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574", decimals: 18, icon: "🟢", chainId: 11155111 },
    { symbol: "MATIC", name: "Polygon", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🟣", chainId: 137 },
    { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, icon: "💵", chainId: 137 },
    { symbol: "ARB", name: "Arbitrum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🔵", chainId: 42161 },
    { symbol: "XLM", name: "Stellar Lumens", address: "native", decimals: 7, icon: "⭐", chainId: 100 },
  ];

  useEffect(() => {
    initializeBridge();
  }, []);

  useEffect(() => {
    if (fromChain && toChain && fromToken && amount) {
      calculateBridgeQuote();
    }
  }, [fromChain, toChain, fromToken, amount]);

  const initializeBridge = async () => {
    try {
      setIsLoading(true);
      const chains = await bridgeService.getSupportedChains();
      setSupportedChains(chains);
      
      if (walletState.isConnected && walletState.chainId) {
        const currentChain = chains.find(c => c.id === walletState.chainId);
        if (currentChain) {
          setFromChain(currentChain);
        }
      }
    } catch (error) {
      console.error('Failed to initialize bridge:', error);
      toast({
        title: "Bridge Error",
        description: "Failed to initialize bridge service",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBridgeQuote = async () => {
    if (!fromChain || !toChain || !fromToken || !amount) return;

    try {
      setIsCalculating(true);
      const quote = await bridgeService.getBridgeQuote(
        fromChain.id,
        toChain.id,
        fromToken.address,
        amount
      );
      setBridgeQuote(quote);
    } catch (error) {
      console.error('Failed to calculate bridge quote:', error);
      setBridgeQuote(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExecuteBridge = async () => {
    if (!fromChain || !toChain || !fromToken || !toToken || !amount || !recipient || !bridgeQuote) {
      toast({
        title: "Bridge Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!walletState.isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to execute bridge",
        variant: "destructive",
      });
      return;
    }

    try {
      setBridgeStatus('processing');
      
      const bridgeRequest = {
        fromChain: fromChain.id,
        toChain: toChain.id,
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount,
        recipient: recipient || walletState.address || '',
        bridgeFee: bridgeQuote.bridgeFee,
        estimatedTime: bridgeQuote.estimatedTime
      };

      const bridgeId = await bridgeService.executeBridge(bridgeRequest);
      
      toast({
        title: "Bridge Initiated",
        description: `Bridge transaction submitted: ${bridgeId.slice(0, 8)}...`,
      });

      setBridgeStatus('completed');
      
      // Reset form
      setAmount("");
      setRecipient("");
      setBridgeQuote(null);
      
    } catch (error) {
      console.error('Bridge execution failed:', error);
      setBridgeStatus('failed');
      toast({
        title: "Bridge Failed",
        description: error instanceof Error ? error.message : "Bridge execution failed",
        variant: "destructive",
      });
    }
  };

  const getFilteredTokens = (chainId: number) => {
    return tokens.filter(token => token.chainId === chainId);
  };

  const getStatusIcon = () => {
    switch (bridgeStatus) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-neon-cyan" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-neon-green" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Network className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (bridgeStatus) {
      case 'processing':
        return "Processing Bridge";
      case 'completed':
        return "Bridge Completed";
      case 'failed':
        return "Bridge Failed";
      default:
        return "Ready to Bridge";
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Initializing bridge...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bridge Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Network className="w-8 h-8 text-neon-cyan" />
          Cross-Chain Bridge
        </h2>
        <p className="text-muted-foreground">
          Bridge tokens between different blockchain networks securely
        </p>
      </div>

      {/* Bridge Form */}
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Chain & Token */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Chain</label>
              <Select value={fromChain?.id.toString()} onValueChange={(value) => {
                const chain = chains.find(c => c.id.toString() === value);
                handleChainChange(chain || null, 'from');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{chain.icon}</span>
                        <span>{chain.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {chain.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">From Token</label>
              <Select value={fromToken?.address} onValueChange={(value) => {
                const token = tokens.find(t => t.address === value);
                handleTokenChange(token || null, 'from');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {fromChain && getFilteredTokens(fromChain.id).map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        <span>{token.icon}</span>
                        <span>{token.symbol}</span>
                        <span className="text-muted-foreground">({token.name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          {/* Destination Chain & Token */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">To Chain</label>
              <Select value={toChain?.id.toString()} onValueChange={(value) => {
                const chain = chains.find(c => c.id.toString() === value);
                handleChainChange(chain || null, 'to');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.filter(c => c.id !== fromChain?.id).map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{chain.icon}</span>
                        <span>{chain.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {chain.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Token</label>
              <Select value={toToken?.address} onValueChange={(value) => {
                const token = tokens.find(t => t.address === value);
                handleTokenChange(token || null, 'to');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {toChain && getFilteredTokens(toChain.id).map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        <span>{token.icon}</span>
                        <span>{token.symbol}</span>
                        <span className="text-muted-foreground">({token.name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Recipient Address (Optional)</label>
              <Input
                placeholder={walletState.address || "Enter recipient address"}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
        </div>

        {/* Bridge Quote */}
        {bridgeQuote && (
          <div className="mt-6 p-4 bg-space-gray rounded-lg">
            <h3 className="font-semibold mb-3">Bridge Quote</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bridge Fee:</span>
                <span className="font-medium">{bridgeQuote.bridgeFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas Fee:</span>
                <span className="font-medium">{bridgeQuote.gasFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Fee:</span>
                <span className="font-medium text-neon-cyan">{bridgeQuote.totalFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Time:</span>
                <span className="font-medium">{bridgeQuote.estimatedTime} minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Bridge Button */}
        <div className="mt-6">
          <Button
            onClick={handleExecuteBridge}
            disabled={!fromChain || !toChain || !fromToken || !toToken || !amount || isCalculating || bridgeStatus === 'processing'}
            className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
          >
            {bridgeStatus === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Bridge...
              </>
            ) : (
              <>
                {getStatusIcon()}
                <span className="ml-2">{getStatusText()}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Bridge Status */}
      {bridgeStatus !== 'idle' && (
        <Alert className={bridgeStatus === 'completed' ? 'border-neon-green/30 bg-neon-green/10' : 
                         bridgeStatus === 'failed' ? 'border-destructive/30 bg-destructive/10' : 
                         'border-neon-cyan/30 bg-neon-cyan/10'}>
          <AlertDescription className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </AlertDescription>
        </Alert>
      )}

      {/* Bridge Info */}
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-neon-cyan" />
          Bridge Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-space-gray rounded-lg">
            <div className="text-2xl mb-1">🔒</div>
            <div className="font-medium">Secure HTLC</div>
            <div className="text-muted-foreground">Atomic cross-chain swaps</div>
          </div>
          <div className="text-center p-3 bg-space-gray rounded-lg">
            <div className="text-2xl mb-1">⚡</div>
            <div className="font-medium">Fast Processing</div>
            <div className="text-muted-foreground">2-5 minutes completion</div>
          </div>
          <div className="text-center p-3 bg-space-gray rounded-lg">
            <div className="text-2xl mb-1">🌉</div>
            <div className="font-medium">Multi-Chain</div>
            <div className="text-muted-foreground">6+ networks supported</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BridgeInterface; 
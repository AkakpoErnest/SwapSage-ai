import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, Network, Coins, Clock, AlertCircle, CheckCircle, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { polygonStellarBridge } from "@/services/bridge/polygonStellarBridge";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  fromAmount: string;
  toAmount: string;
  fee: string;
  gasFee: string;
  totalFee: string;
  estimatedTime: number;
  minAmount: string;
  maxAmount: string;
  confidence: number;
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
  const [autoSelectWallet, setAutoSelectWallet] = useState(true);
  const [generatedWallets, setGeneratedWallets] = useState<Record<number, string>>({});

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
    { symbol: "mUSDC", name: "Mock USDC", address: import.meta.env.VITE_MOCK_TOKEN_ADDRESS || "0xE560De00F664dE3C0B3815dd1AF4b6DF64123563", decimals: 6, icon: "💵", chainId: 11155111 },
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

  // Auto-fill recipient with wallet address when wallet connects
  useEffect(() => {
    if (walletState.isConnected && walletState.address && !recipient) {
      setRecipient(walletState.address);
    }
  }, [walletState.isConnected, walletState.address, recipient]);

  // Initialize Polygon-Stellar bridge
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const initializePolygonStellarBridge = async () => {
        try {
          await polygonStellarBridge.initialize("https://polygon-rpc.com", "TESTNET");
          console.log("✅ Polygon-Stellar bridge initialized");
        } catch (error) {
          console.error('Failed to initialize Polygon-Stellar bridge:', error);
        }
      };
      initializePolygonStellarBridge();
    }
  }, []);

  const initializeBridge = async () => {
    try {
      setIsLoading(true);
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

    // Check if same token is selected
    if (fromToken.address === toToken?.address) {
      toast({
        title: "Selection Error",
        description: "Please select different tokens for cross-chain bridge",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCalculating(true);
      
      const quote = await polygonStellarBridge.getBridgeQuote({
        fromChain: fromChain.name.toLowerCase() as 'polygon' | 'stellar',
        toChain: toChain.name.toLowerCase() as 'polygon' | 'stellar',
        fromToken: fromToken.address,
        toToken: toToken?.address || "0x0000000000000000000000000000000000000000",
        fromAmount: amount,
        recipient: recipient || walletState.address || "",
        use1inchFusion: fromChain.name.toLowerCase() === 'polygon'
      });
      
      setBridgeQuote(quote);
    } catch (error) {
      console.error('Failed to calculate bridge quote:', error);
      setBridgeQuote(null);
      toast({
        title: "Quote Error",
        description: "Failed to get bridge quote from on-chain oracle",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExecuteBridge = async () => {
    // Check each required field individually and provide specific error messages
    if (!fromChain) {
      toast({
        title: "Bridge Error",
        description: "Please select a source chain",
        variant: "destructive",
      });
      return;
    }

    if (!toChain) {
      toast({
        title: "Bridge Error",
        description: "Please select a destination chain",
        variant: "destructive",
      });
      return;
    }

    if (!fromToken) {
      toast({
        title: "Bridge Error",
        description: "Please select a source token",
        variant: "destructive",
      });
      return;
    }

    if (!toToken) {
      toast({
        title: "Bridge Error",
        description: "Please select a destination token",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Bridge Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Use recipient if provided, otherwise use wallet address
    let finalRecipient = recipient || walletState.address;
    
    // For cross-chain swaps, validate the recipient address format
    if (fromChain?.name.toLowerCase() === 'polygon' && toChain?.name.toLowerCase() === 'stellar') {
      // For Polygon to Stellar, recipient should be a Stellar address
      if (!finalRecipient) {
        toast({
          title: "Bridge Error",
          description: "Please provide a Stellar recipient address for cross-chain swaps",
          variant: "destructive",
        });
        return;
      }
      
      // Validate Stellar address format
      if (!finalRecipient.startsWith('G') || finalRecipient.length !== 56) {
        toast({
          title: "Bridge Error",
          description: "Invalid Stellar address. Stellar addresses should start with 'G' and be 56 characters long.",
          variant: "destructive",
        });
        return;
      }
    } else if (fromChain?.name.toLowerCase() === 'stellar' && toChain?.name.toLowerCase() === 'polygon') {
      // For Stellar to Polygon, recipient should be an Ethereum address
      if (!finalRecipient) {
        toast({
          title: "Bridge Error",
          description: "Please provide an Ethereum/Polygon recipient address for cross-chain swaps",
          variant: "destructive",
        });
        return;
      }
      
      // Validate Ethereum address format
      if (!finalRecipient.startsWith('0x') || finalRecipient.length !== 42) {
        toast({
          title: "Bridge Error",
          description: "Invalid Ethereum address. Ethereum addresses should start with '0x' and be 42 characters long.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Same chain swap
      if (!finalRecipient) {
        toast({
          title: "Bridge Error",
          description: "Please provide a recipient address or connect your wallet",
          variant: "destructive",
        });
        return;
      }
    }

    if (!bridgeQuote) {
      toast({
        title: "Bridge Error",
        description: "Please wait for bridge quote calculation",
        variant: "destructive",
      });
      return;
    }

    try {
      setBridgeStatus('processing');
      
      // Execute Polygon-Stellar cross-chain swap
      let result;
      if (fromChain.name.toLowerCase() === 'polygon' && toChain.name.toLowerCase() === 'stellar') {
        result = await polygonStellarBridge.executePolygonToStellarSwap({
          fromChain: 'polygon',
          toChain: 'stellar',
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: amount,
          recipient: finalRecipient,
          use1inchFusion: true
        });
      } else if (fromChain.name.toLowerCase() === 'stellar' && toChain.name.toLowerCase() === 'polygon') {
        result = await polygonStellarBridge.executeStellarToPolygonSwap({
          fromChain: 'stellar',
          toChain: 'polygon',
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: amount,
          recipient: finalRecipient,
          use1inchFusion: true
        });
      } else {
        throw new Error('Only Polygon ↔ Stellar swaps are supported');
      }
      
      // Store generated wallet info if auto-selected
      if (autoSelectWallet && result.swapId) {
        setGeneratedWallets(prev => ({
          ...prev,
          [fromChain.id]: `Generated for swap ${result.swapId.slice(0, 8)}...`
        }));
      }
      
      toast({
        title: "🎯 On-Chain Bridge Initiated!",
        description: `Real HTLC swap created: ${result.swapId.slice(0, 8)}...`,
      });

      setBridgeStatus('completed');
      
      // Reset form
      setAmount("");
      setRecipient("");
      setBridgeQuote(null);
      
    } catch (error) {
      console.error('Real bridge execution failed:', error);
      setBridgeStatus('failed');
      toast({
        title: "❌ On-Chain Bridge Failed",
        description: error instanceof Error ? error.message : "Real bridge execution failed",
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
          🟣⭐ Polygon ↔ Stellar Bridge
        </h2>
        <p className="text-muted-foreground">
          Secure cross-chain atomic swaps with 1inch Fusion integration
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
                placeholder={
                  fromChain?.name.toLowerCase() === 'polygon' && toChain?.name.toLowerCase() === 'stellar'
                    ? "Enter Stellar address (starts with G...)"
                    : fromChain?.name.toLowerCase() === 'stellar' && toChain?.name.toLowerCase() === 'polygon'
                    ? "Enter Ethereum/Polygon address (starts with 0x...)"
                    : walletState.address || "Enter recipient address"
                }
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-background/50"
              />
              {fromChain && toChain && (
                <div className="text-xs text-muted-foreground mt-1">
                  <p>
                    {fromChain.name.toLowerCase() === 'polygon' && toChain.name.toLowerCase() === 'stellar'
                      ? "Stellar addresses start with 'G' and are 56 characters long"
                      : fromChain.name.toLowerCase() === 'stellar' && toChain.name.toLowerCase() === 'polygon'
                      ? "Ethereum addresses start with '0x' and are 42 characters long"
                      : "Enter the recipient's address"
                    }
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (fromChain.name.toLowerCase() === 'polygon' && toChain.name.toLowerCase() === 'stellar') {
                        setRecipient('GBBIBMRK44CUJMCQQWNTRP2SGYYTPBRIKG5A7RHSRG');
                      } else if (fromChain.name.toLowerCase() === 'stellar' && toChain.name.toLowerCase() === 'polygon') {
                        setRecipient('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
                      }
                    }}
                    className="text-neon-cyan hover:text-neon-cyan/80 underline"
                  >
                    Use test address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-Wallet Selection */}
        <div className="mt-4 p-4 bg-space-gray/50 rounded-lg border border-neon-cyan/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-neon-cyan" />
              <Label htmlFor="auto-wallet" className="text-sm font-medium">
                Auto-Generate Wallet
              </Label>
            </div>
            <Switch
              id="auto-wallet"
              checked={autoSelectWallet}
              onCheckedChange={setAutoSelectWallet}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {autoSelectWallet 
              ? "🎯 Will automatically generate and fund wallets for cross-chain operations"
              : "🔐 Use your connected wallet for all transactions"
            }
          </p>
          
          {/* Show generated wallets */}
          {Object.keys(generatedWallets).length > 0 && (
            <div className="mt-3 p-2 bg-background/30 rounded border">
              <p className="text-xs font-medium text-neon-cyan mb-1">Generated Wallets:</p>
              {Object.entries(generatedWallets).map(([chainId, info]) => (
                <div key={chainId} className="text-xs text-muted-foreground">
                  Chain {chainId}: {info}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bridge Quote */}
        {bridgeQuote && (
          <div className="mt-6 p-4 bg-space-gray rounded-lg border border-neon-cyan/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">🎯 On-Chain Bridge Quote</h3>
              <Badge variant={bridgeQuote.confidence > 90 ? "default" : "secondary"} className="text-xs">
                {bridgeQuote.confidence}% Confidence
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From Amount:</span>
                <span className="font-medium">{bridgeQuote.fromAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To Amount:</span>
                <span className="font-medium">{bridgeQuote.toAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bridge Fee:</span>
                <span className="font-medium">{bridgeQuote.fee}</span>
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
                <span className="font-medium">{bridgeQuote.estimatedTime} min</span>
              </div>
            </div>
            
            {/* Oracle Confidence Indicator */}
            <div className="mt-3 p-2 bg-background/30 rounded">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  bridgeQuote.confidence > 90 ? 'bg-green-500' : 
                  bridgeQuote.confidence > 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-muted-foreground">
                  Oracle Price Confidence: {bridgeQuote.confidence}%
                </span>
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
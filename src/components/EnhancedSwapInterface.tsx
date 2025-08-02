import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useWalletContext } from '../contexts/WalletContext';
import { oneInchAPI, Token, SwapQuote } from '../services/api/oneinch';
import { crossChainBridge, CrossChainSwapRequest, SwapStatus } from '../services/bridge/crossChainBridge';
import { 
  TrendingUp, 
  Zap, 
  Shield,
  RefreshCw, 
  Coins,
  ArrowUpDown,
  CheckCircle,
  Clock,
  X,
  AlertCircle
} from 'lucide-react';

const EnhancedSwapInterface: React.FC = () => {
  const { walletState } = useWalletContext();
  
  // Price feed state
  const [currentPrice, setCurrentPrice] = useState<string>('0.80');
  const [lastUpdated, setLastUpdated] = useState<string>('13:11:18');
  const [selectedToken, setSelectedToken] = useState<string>('MATIC');
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);

  // Swap quote state
  const [swapAmount, setSwapAmount] = useState<string>('1');
  const [swapToken, setSwapToken] = useState<string>('MATIC');
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);

  // Atomic swap state
  const [atomicAmount, setAtomicAmount] = useState<string>('1');
  const [atomicToken, setAtomicToken] = useState<string>('MATIC');
  const [isInitiatingSwap, setIsInitiatingSwap] = useState(false);
  const [activeSwaps, setActiveSwaps] = useState<SwapStatus[]>([]);

  // Available tokens
  const availableTokens: Record<string, Token> = {
    MATIC: { address: '0x0000000000000000000000000000000000001010', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    DAI: { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    ETH: { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    XLM: { address: 'XLM', symbol: 'XLM', name: 'Stellar Lumens', decimals: 7 }
  };

  useEffect(() => {
    refreshPrice();
    loadActiveSwaps();
  }, []);

  // Price feed functions
  const refreshPrice = async () => {
    setIsRefreshingPrice(true);
    try {
      // Simulate price update
      const newPrice = (Math.random() * 0.2 + 0.7).toFixed(2);
      setCurrentPrice(newPrice);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    } catch (error) {
      console.error('Error refreshing price:', error);
    } finally {
      setIsRefreshingPrice(false);
    }
  };

  // Swap quote functions
  const getSwapQuote = async () => {
    if (!swapAmount || !swapToken) return;

    setIsGettingQuote(true);
    try {
      // Simulate quote calculation
      const estimatedOutput = (parseFloat(swapAmount) * 1.25).toFixed(4);
      const mockQuote: SwapQuote = {
        fromToken: swapToken,
        toToken: 'USDC',
        fromTokenAmount: swapAmount,
        toTokenAmount: estimatedOutput,
        gasEstimate: '150000',
        protocolFee: '0.003',
        priceImpact: '0.1'
      };
      
      setTimeout(() => {
        setSwapQuote(mockQuote);
        setIsGettingQuote(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting quote:', error);
      setIsGettingQuote(false);
    }
  };

  // Atomic swap functions
  const initiateAtomicSwap = async () => {
    if (!walletState.isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!atomicAmount || !atomicToken) {
      alert('Please fill in all fields');
      return;
    }

    setIsInitiatingSwap(true);
    try {
      // Simulate atomic swap initiation
      const mockSwap: SwapStatus = {
        id: Date.now().toString(),
        fromChain: 'polygon',
        toChain: 'stellar',
        fromToken: atomicToken,
        toToken: 'XLM',
        amount: atomicAmount,
        status: 'initiated',
        fromAddress: walletState.address || '',
        toAddress: walletState.address || '',
        hashlock: '0x' + Math.random().toString(16).substr(2, 64),
        timelock: Date.now() + 3600000, // 1 hour from now
        createdAt: Date.now()
      };

      setTimeout(() => {
        setActiveSwaps(prev => [...prev, mockSwap]);
        setIsInitiatingSwap(false);
      }, 2000);
    } catch (error) {
      console.error('Error initiating atomic swap:', error);
      setIsInitiatingSwap(false);
    }
  };

  const loadActiveSwaps = async () => {
    if (walletState.address) {
      // Load existing swaps from bridge service
      const swaps = crossChainBridge.getSwapsForAddress(walletState.address);
      setActiveSwaps(swaps);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'initiated':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Polygon Price Feeds Section */}
      <Card className="bg-gradient-card border-neon-cyan/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neon-green" />
              <CardTitle className="text-lg">Live Polygon Price Feeds</CardTitle>
              <div className="w-2 h-2 bg-neon-purple rounded-full"></div>
            </div>
            <Badge variant="outline" className="bg-space-gray/50 border-neon-cyan/20">
              Polygon Oracle
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-32 bg-space-gray border-neon-cyan/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MATIC">MATIC</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="DAI">DAI</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshPrice}
              disabled={isRefreshingPrice}
              className="bg-space-gray border-neon-cyan/20 hover:bg-neon-cyan/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingPrice ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Current Price</div>
            <div className="text-2xl font-bold text-neon-cyan">${currentPrice}</div>
            <div className="text-xs text-muted-foreground">Last updated: {lastUpdated}</div>
          </div>
        </CardContent>
      </Card>

      {/* Polygon Swap Quote Section */}
      <Card className="bg-gradient-card border-neon-cyan/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-neon-purple" />
              <CardTitle className="text-lg">Polygon Swap Quote</CardTitle>
              <div className="w-2 h-2 bg-neon-purple rounded-full"></div>
            </div>
            <Badge variant="outline" className="bg-space-gray/50 border-neon-cyan/20">
              1inch Fusion
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.0"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              className="flex-1 bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
            />
            <Select value={swapToken} onValueChange={setSwapToken}>
              <SelectTrigger className="w-32 bg-space-gray border-neon-cyan/20">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableTokens).map(([symbol, token]) => (
                  <SelectItem key={symbol} value={symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={getSwapQuote}
            disabled={isGettingQuote || !swapAmount || !swapToken}
            className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
          >
            {isGettingQuote ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Get Quote
              </>
            )}
          </Button>

          {swapQuote && (
            <div className="p-3 bg-neon-cyan/5 rounded-lg border border-neon-cyan/20">
              <div className="text-sm text-muted-foreground">Estimated Output</div>
              <div className="text-lg font-semibold text-neon-cyan">
                {swapQuote.toTokenAmount} {swapQuote.toToken}
              </div>
              <div className="text-xs text-muted-foreground">
                Rate: 1 {swapQuote.fromToken} = {swapQuote.rate} {swapQuote.toToken}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atomic Cross-Chain Swaps Section */}
      <Card className="bg-gradient-card border-neon-cyan/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-neon-green" />
              <CardTitle className="text-lg">Atomic Cross-Chain Swaps</CardTitle>
            </div>
            <Badge variant="outline" className="bg-space-gray/50 border-neon-cyan/20">
              HTLC Protocol
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!walletState.isConnected && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Please connect your wallet to start swapping</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.0"
              value={atomicAmount}
              onChange={(e) => setAtomicAmount(e.target.value)}
              className="flex-1 bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
            />
            <Select value={atomicToken} onValueChange={setAtomicToken}>
              <SelectTrigger className="w-32 bg-space-gray border-neon-cyan/20">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableTokens).map(([symbol, token]) => (
                  <SelectItem key={symbol} value={symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={initiateAtomicSwap}
            disabled={isInitiatingSwap || !walletState.isConnected || !atomicAmount || !atomicToken}
            className="w-full bg-space-gray text-foreground border border-neon-cyan/20 hover:bg-neon-cyan/10"
          >
            {isInitiatingSwap ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Initiating Swap...
              </>
            ) : (
              <>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Initiate Atomic Swap
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Swaps Section */}
      {activeSwaps.length > 0 && (
        <Card className="bg-gradient-card border-neon-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-neon-cyan" />
              Active Swaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSwaps.map((swap) => (
                <div key={swap.id} className="p-3 bg-space-gray/50 rounded-lg border border-neon-cyan/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(swap.status)}
                      <span className="text-sm font-medium">
                        {swap.fromAmount} {swap.fromToken} → {swap.toAmount} {swap.toToken}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {swap.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {swap.fromChain} → {swap.toChain}
                  </div>
                  {swap.transactionHash && (
                    <div className="mt-1 text-xs text-muted-foreground font-mono">
                      {swap.transactionHash.substring(0, 10)}...{swap.transactionHash.substring(58)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSwapInterface; 
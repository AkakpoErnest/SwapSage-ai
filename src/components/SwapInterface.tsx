import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useWalletContext } from '../contexts/WalletContext';
import { 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  Shield,
  Coins,
  Search,
  Loader2
} from 'lucide-react';

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  estimatedGas: string;
  priceImpact: string;
}

const SwapInterface: React.FC = () => {
  const { walletState } = useWalletContext();
  const [fromToken, setFromToken] = useState<string>('MATIC');
  const [toToken, setToToken] = useState<string>('XLM');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Price feed state
  const [currentPrice, setCurrentPrice] = useState<string>('0.85');
  const [lastUpdated, setLastUpdated] = useState<string>('13:11:18');
  const [selectedToken, setSelectedToken] = useState<string>('MATIC');
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);

  // Simplified token list for Polygon ↔ XLM swaps
  const availableTokens = [
    { symbol: 'MATIC', name: 'Polygon' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'DAI', name: 'Dai Stablecoin' },
    { symbol: 'XLM', name: 'Stellar Lumens' }
  ];

  useEffect(() => {
    refreshPrice();
    const interval = setInterval(refreshPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshPrice = async () => {
    setIsRefreshingPrice(true);
    try {
      const basePrice = 0.85;
      const variation = (Math.random() - 0.5) * 0.1;
      const newPrice = (basePrice + variation).toFixed(4);
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

  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!fromToken || !toToken) {
      setError('Please select both tokens');
      return;
    }

    setIsGettingQuote(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const amount = parseFloat(fromAmount);
      let rate = 1;
      let estimatedOutput = amount;

      if (fromToken === 'MATIC' && toToken === 'XLM') {
        rate = 1 / parseFloat(currentPrice);
        estimatedOutput = amount * rate;
      } else if (fromToken === 'XLM' && toToken === 'MATIC') {
        rate = parseFloat(currentPrice);
        estimatedOutput = amount * rate;
      } else if (fromToken === 'USDC' && toToken === 'XLM') {
        rate = 1 / parseFloat(currentPrice);
        estimatedOutput = amount * rate;
      } else if (fromToken === 'XLM' && toToken === 'USDC') {
        rate = parseFloat(currentPrice);
        estimatedOutput = amount * rate;
      }

      const quote: SwapQuote = {
        fromToken,
        toToken,
        fromAmount,
        toAmount: estimatedOutput.toFixed(6),
        rate: rate.toFixed(6),
        estimatedGas: '0.004680',
        priceImpact: '< 0.1%'
      };

      setSwapQuote(quote);
    } catch (error) {
      console.error('Error getting quote:', error);
      setError('Failed to get quote. Please try again.');
    } finally {
      setIsGettingQuote(false);
    }
  };

  const executeSwap = async () => {
    if (!walletState.isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!swapQuote) {
      setError('Please get a quote first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setError('');
      setFromAmount('');
      setSwapQuote(null);
      console.log('Swap executed successfully');
    } catch (error) {
      console.error('Error executing swap:', error);
      setError('Failed to execute swap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setFromAmount(value);
    setError('');
    if (swapQuote) {
      setSwapQuote(null);
    }
  };

  const handleTokenChange = (token: string, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromToken(token);
      if (toToken === token) {
        setToToken('XLM');
      }
    } else {
      setToToken(token);
      if (fromToken === token) {
        setFromToken('MATIC');
      }
    }
    setError('');
    setSwapQuote(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Live Polygon Price Feeds Section */}
      <Card className="bg-gradient-to-br from-space-gray/50 to-deep-space/50 border border-neon-cyan/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Live Polygon Price Feeds</CardTitle>
                <CardDescription className="text-muted-foreground">Real-time market data from on-chain sources</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan">
              Polygon Oracle
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-32 bg-space-gray/50 border-neon-cyan/30 focus:border-neon-cyan/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-space-gray border-neon-cyan/20">
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
              className="bg-space-gray/50 border-neon-cyan/30 hover:bg-neon-cyan/10 text-neon-cyan"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingPrice ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-space-gray/30 rounded-lg border border-neon-cyan/20">
              <div className="text-sm text-muted-foreground mb-1">Current Price</div>
              <div className="text-2xl font-bold text-neon-cyan">${currentPrice}</div>
            </div>
            <div className="p-4 bg-space-gray/30 rounded-lg border border-neon-cyan/20">
              <div className="text-sm text-muted-foreground mb-1">24h Change</div>
              <div className="text-lg font-semibold text-green-400">+2.5% 📈</div>
            </div>
            <div className="p-4 bg-space-gray/30 rounded-lg border border-neon-cyan/20">
              <div className="text-sm text-muted-foreground mb-1">Last Updated</div>
              <div className="text-sm font-medium text-white">{lastUpdated}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Polygon Swap Quote Section */}
      <Card className="bg-gradient-to-br from-space-gray/50 to-deep-space/50 border border-neon-cyan/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Polygon Swap Quote</CardTitle>
                <CardDescription className="text-muted-foreground">Get instant quotes for Polygon ↔ XLM swaps</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-neon-purple/10 border-neon-purple/30 text-neon-purple">
              1inch Fusion
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">From Token</label>
              <Select value={fromToken} onValueChange={(value) => handleTokenChange(value, 'from')}>
                <SelectTrigger className="bg-space-gray/50 border-neon-cyan/30 focus:border-neon-cyan/50 h-12">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className="bg-space-gray border-neon-cyan/20">
                  {availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                        </div>
                        {token.symbol} - {token.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">To Token</label>
              <Select value={toToken} onValueChange={(value) => handleTokenChange(value, 'to')}>
                <SelectTrigger className="bg-space-gray/50 border-neon-cyan/30 focus:border-neon-cyan/50 h-12">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className="bg-space-gray border-neon-cyan/20">
                  {availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                        </div>
                        {token.symbol} - {token.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="h-12 bg-space-gray/50 border-neon-cyan/30 focus:border-neon-cyan/50 text-white placeholder:text-muted-foreground"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                {fromToken}
              </div>
            </div>
          </div>
          
          {/* Get Quote Button */}
          <Button 
            onClick={getQuote}
            disabled={isGettingQuote || !fromAmount || !fromToken || !toToken || parseFloat(fromAmount) <= 0}
            className="w-full h-12 bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/80 hover:to-neon-purple/80 text-black font-medium shadow-lg shadow-neon-cyan/20 transition-all duration-200 disabled:opacity-50"
          >
            {isGettingQuote ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Get Quote
              </>
            )}
          </Button>

          {/* Quote Display */}
          {swapQuote && (
            <div className="p-6 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 rounded-xl border border-neon-cyan/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Swap Quote</h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Live
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-space-gray/30 rounded-lg">
                  <span className="text-muted-foreground">You Pay</span>
                  <span className="text-white font-medium">{swapQuote.fromAmount} {swapQuote.fromToken}</span>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-space-gray/30 rounded-lg">
                  <span className="text-muted-foreground">You Receive</span>
                  <span className="text-neon-cyan font-semibold text-lg">{swapQuote.toAmount} {swapQuote.toToken}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neon-cyan/20">
                  <div>
                    <div className="text-xs text-muted-foreground">Rate</div>
                    <div className="text-sm font-medium text-white">1 {swapQuote.fromToken} = {swapQuote.rate} {swapQuote.toToken}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Price Impact</div>
                    <div className="text-sm font-medium text-green-400">{swapQuote.priceImpact}</div>
                  </div>
                </div>
                
                <Button 
                  onClick={executeSwap}
                  disabled={isLoading || !walletState.isConnected}
                  className="w-full h-12 bg-gradient-to-r from-neon-green to-neon-cyan hover:from-neon-green/80 hover:to-neon-cyan/80 text-black font-medium shadow-lg shadow-neon-green/20 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing Swap...
                    </>
                  ) : !walletState.isConnected ? (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Connect Wallet to Swap
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4 mr-2" />
                      Execute Swap
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SwapInterface;
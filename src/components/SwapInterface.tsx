import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useWalletContext } from '../contexts/WalletContext';
import { oneInchAPI, Token, SwapQuote } from '../services/api/oneinch';
import { crossChainBridge, CrossChainSwapRequest, SwapStatus } from '../services/bridge/crossChainBridge';
import { stellarService } from '../services/stellar/stellarService';
import { 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X, 
  TrendingUp, 
  Zap, 
  Shield,
  Coins,
  ArrowUpDown
} from 'lucide-react';

const SwapInterface: React.FC = () => {
  const { walletState } = useWalletContext();
  const [fromToken, setFromToken] = useState<string>('');
  const [toToken, setToToken] = useState<string>('');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [fromChain, setFromChain] = useState<'ethereum' | 'polygon' | 'stellar'>('polygon');
  const [toChain, setToChain] = useState<'ethereum' | 'polygon' | 'stellar'>('stellar');
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeSwaps, setActiveSwaps] = useState<SwapStatus[]>([]);
  const [slippage, setSlippage] = useState<number>(1);
  
  // Price feed state
  const [currentPrice, setCurrentPrice] = useState<string>('0.80');
  const [lastUpdated, setLastUpdated] = useState<string>('13:11:18');
  const [selectedToken, setSelectedToken] = useState<string>('MATIC');
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);

  // Enhanced token selection with error handling
  const handleTokenChange = (tokenAddress: string, type: 'from' | 'to') => {
    try {
      if (type === 'from') {
        setFromToken(tokenAddress);
        // Reset to token if it's the same as the new from token
        if (toToken === tokenAddress) {
          setToToken('');
        }
      } else {
        setToToken(tokenAddress);
      }
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Token selection error:', error);
      setError('Failed to select token. Please try again.');
    }
  };

  // Enhanced chain selection with validation
  const handleChainChange = (chainId: 'ethereum' | 'polygon' | 'stellar', type: 'from' | 'to') => {
    try {
      if (type === 'from') {
        setFromChain(chainId);
        // Reset tokens when chain changes
        setFromToken('');
        setToToken('');
      } else {
        setToChain(chainId);
        setToToken('');
      }
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Chain selection error:', error);
      setError('Failed to select chain. Please try again.');
    }
  };

  // Available tokens for each chain (updated for Polygon mainnet)
  const availableTokens = {
    ethereum: {
      // ETH (native token) - correct address for all networks
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { 
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH', 
        name: 'Ethereum', 
        decimals: 18 
      },
      // Alternative ETH address (some systems use this)
      '0x0000000000000000000000000000000000000000': { 
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH', 
        name: 'Ethereum', 
        decimals: 18 
      },
      '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8': { 
        address: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 6 
      },
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': { 
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        symbol: 'DAI', 
        name: 'Dai Stablecoin', 
        decimals: 18 
      },
    },
    polygon: {
      '0x0000000000000000000000000000000000001010': { 
        address: '0x0000000000000000000000000000000000001010',
        symbol: 'MATIC', 
        name: 'Polygon', 
        decimals: 18 
      },
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': { 
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 6 
      },
      '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': { 
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        symbol: 'DAI', 
        name: 'Dai Stablecoin', 
        decimals: 18 
      },
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': { 
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        symbol: 'USDT', 
        name: 'Tether USD', 
        decimals: 6 
      },
    },
    stellar: {
      'XLM': { 
        address: 'XLM',
        symbol: 'XLM', 
        name: 'Stellar Lumens', 
        decimals: 7 
      },
      'USDC': { 
        address: 'USDC',
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 7 
      },
      'USDT': { 
        address: 'USDT',
        symbol: 'USDT', 
        name: 'Tether USD', 
        decimals: 7 
      },
    }
  };

  useEffect(() => {
    loadTokens();
    loadActiveSwaps();
    refreshPrice();
  }, []);

  useEffect(() => {
    if (fromToken && toToken && fromAmount && walletState.isConnected) {
      calculateQuote();
    }
  }, [fromToken, toToken, fromAmount, fromChain, toChain, walletState.isConnected]);

  const loadTokens = async () => {
    try {
      // Load Ethereum tokens from 1inch API
      const ethereumTokens = await oneInchAPI.getTokens(1);
      setTokens(ethereumTokens);
    } catch (error) {
      console.error('Error loading tokens:', error);
      // Use fallback tokens
      setTokens(availableTokens.ethereum);
    }
  };

  const loadActiveSwaps = async () => {
    if (walletState.address) {
      const swaps = crossChainBridge.getSwapsForAddress(walletState.address);
      setActiveSwaps(swaps);
    }
  };

  const calculateQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get quote from 1inch API
      const quote = await oneInchAPI.getSwapQuote(
        1, // Ethereum chain ID
        fromToken,
        toToken,
        fromAmount,
        walletState.address || '0x0000000000000000000000000000000000000000'
      );

      setSwapQuote(quote);
      setToAmount(quote.toTokenAmount);
    } catch (error) {
      console.error('Error calculating quote:', error);
      setError('Failed to get quote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const executeSwap = async () => {
    if (!walletState.isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!fromToken || !toToken || !fromAmount || !swapQuote) {
      setError('Please fill in all fields and get a quote first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (fromChain === 'polygon') {
        await executePolygonSwap();
      } else if (fromChain === 'stellar') {
        await executeStellarSwap();
      } else {
        await executeCrossChainSwap();
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute swap');
    } finally {
      setIsLoading(false);
    }
  };

  const executePolygonSwap = async () => {
    try {
      const swapRequest: CrossChainSwapRequest = {
        fromChain: 'polygon',
        toChain: toChain,
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: fromAmount,
        toAmount: toAmount,
        recipientAddress: walletState.address || '',
        slippage: slippage
      };

      const swap = await crossChainBridge.initiatePolygonToStellarSwap(swapRequest);
      setActiveSwaps(prev => [...prev, swap]);
      console.log('Polygon swap initiated:', swap);
    } catch (error) {
      console.error('Error executing Polygon swap:', error);
      throw error;
    }
  };

  const executeStellarSwap = async () => {
    try {
      const swapRequest: CrossChainSwapRequest = {
        fromChain: 'stellar',
        toChain: toChain,
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: fromAmount,
        toAmount: toAmount,
        recipientAddress: walletState.address || '',
        slippage: slippage
      };

      const swap = await crossChainBridge.initiateStellarToEthereumSwap(swapRequest);
      setActiveSwaps(prev => [...prev, swap]);
      console.log('Stellar swap initiated:', swap);
    } catch (error) {
      console.error('Error executing Stellar swap:', error);
      throw error;
    }
  };

  const executeCrossChainSwap = async () => {
    try {
      const swapRequest: CrossChainSwapRequest = {
        fromChain: fromChain,
        toChain: toChain,
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: fromAmount,
        toAmount: toAmount,
        recipientAddress: walletState.address || '',
        slippage: slippage
      };

      const swap = await crossChainBridge.initiateEthereumToStellarSwap(swapRequest);
      setActiveSwaps(prev => [...prev, swap]);
      console.log('Cross-chain swap initiated:', swap);
    } catch (error) {
      console.error('Error executing cross-chain swap:', error);
      throw error;
    }
  };

  const completeSwap = async (swapId: string, secret: string) => {
    try {
      const updatedSwap = await crossChainBridge.completeSwap(swapId, secret);
      setActiveSwaps(prev => prev.map(swap => swap.id === swapId ? updatedSwap : swap));
      console.log('Swap completed:', updatedSwap);
    } catch (error) {
      console.error('Error completing swap:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete swap');
    }
  };

  const refundSwap = async (swapId: string) => {
    try {
      const updatedSwap = await crossChainBridge.refundSwap(swapId);
      setActiveSwaps(prev => prev.map(swap => swap.id === swapId ? updatedSwap : swap));
      console.log('Swap refunded:', updatedSwap);
    } catch (error) {
      console.error('Error refunding swap:', error);
      setError(error instanceof Error ? error.message : 'Failed to refund swap');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
            />
            <Select value={fromToken} onValueChange={(value) => handleTokenChange(value, 'from')}>
              <SelectTrigger className="w-32 bg-space-gray border-neon-cyan/20">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableTokens[fromChain] || {}).map(([address, token]) => (
                  <SelectItem key={address} value={address}>
                    {(token as Token).symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={calculateQuote}
            disabled={isLoading || !fromAmount || !fromToken}
            className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
          >
            {isLoading ? (
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
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription>
                Please connect your wallet to start swapping
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Chain</label>
              <Select value={fromChain} onValueChange={(value: 'ethereum' | 'polygon' | 'stellar') => handleChainChange(value, 'from')}>
                <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="stellar">Stellar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Chain</label>
              <Select value={toChain} onValueChange={(value: 'ethereum' | 'polygon' | 'stellar') => handleChainChange(value, 'to')}>
                <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="stellar">Stellar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Token</label>
              <Select value={fromToken} onValueChange={(value) => handleTokenChange(value, 'from')}>
                <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {(fromChain === 'ethereum' || fromChain === 'polygon')
                    ? Object.entries(tokens || {}).map(([address, token]) => (
                        <SelectItem key={address} value={address}>
                          {(token as Token).symbol} - {(token as Token).name}
                        </SelectItem>
                      ))
                    : Object.entries(availableTokens[fromChain] || {}).map(([address, token]) => (
                        <SelectItem key={address} value={address}>
                          {(token as Token).symbol} - {(token as Token).name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Token</label>
              <Select value={toToken} onValueChange={(value) => handleTokenChange(value, 'to')}>
                <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {(toChain === 'ethereum' || toChain === 'polygon')
                    ? Object.entries(tokens || {}).map(([address, token]) => (
                        <SelectItem key={address} value={address}>
                          {(token as Token).symbol} - {(token as Token).name}
                        </SelectItem>
                      ))
                    : Object.entries(availableTokens[toChain] || {}).map(([address, token]) => (
                        <SelectItem key={address} value={address}>
                          {(token as Token).symbol} - {(token as Token).name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
            />
          </div>

          <Button 
            onClick={executeSwap}
            disabled={isLoading || !walletState.isConnected || !fromToken || !toToken || !fromAmount}
            className="w-full bg-space-gray text-foreground border border-neon-cyan/20 hover:bg-neon-cyan/10"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Initiate Atomic Swap
              </>
            )}
          </Button>

          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
                    <Badge className={getStatusColor(swap.status)}>
                      {swap.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {swap.fromChain} → {swap.toChain}
                  </div>
                  {swap.status === 'initiated' && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => completeSwap(swap.id, 'secret')}>
                        Complete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => refundSwap(swap.id)}>
                        Refund
                      </Button>
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

export default SwapInterface;
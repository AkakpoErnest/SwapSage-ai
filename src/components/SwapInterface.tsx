import React, { useState, useEffect } from 'react';
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
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface SwapInterfaceProps {}

const SwapInterface: React.FC<SwapInterfaceProps> = () => {
  const { walletState, refreshBalance } = useWalletContext();
  const [fromToken, setFromToken] = useState<string>('');
  const [toToken, setToToken] = useState<string>('');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [fromChain, setFromChain] = useState<'ethereum' | 'stellar'>('ethereum');
  const [toChain, setToChain] = useState<'ethereum' | 'stellar'>('stellar');
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeSwaps, setActiveSwaps] = useState<SwapStatus[]>([]);
  const [slippage, setSlippage] = useState<number>(1);

  // Available tokens for each chain
  const availableTokens = {
    ethereum: {
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { 
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'ETH', 
        name: 'Ethereum', 
        decimals: 18 
      },
      '0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d': { 
        address: '0xa0b86a33e6b8b0b9c8d29b8a0d0d0e0f0a1b2c3d',
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 6 
      },
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { 
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
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
    if (!fromToken || !toToken || !fromAmount || !walletState.isConnected) return;

    setIsLoading(true);
    setError('');

    try {
      if (fromChain === toChain) {
        // Same-chain swap using 1inch
        if (fromChain === 'ethereum') {
          const quote = await oneInchAPI.getSwapQuote(
            1, // Ethereum mainnet
            fromToken,
            toToken,
            fromAmount,
            walletState.address!,
            slippage
          );
          setSwapQuote(quote);
          setToAmount(quote.toTokenAmount);
        } else {
          // Stellar same-chain swap
          const exchangeRate = await stellarService.getExchangeRate(fromToken, toToken);
          const convertedAmount = (parseFloat(fromAmount) * exchangeRate).toFixed(7);
          setToAmount(convertedAmount);
        }
      } else {
        // Cross-chain swap - estimate based on current rates
        let estimatedAmount = fromAmount;
        
        if (fromChain === 'ethereum') {
          // Convert to ETH first, then estimate Stellar amount
          if (fromToken !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            const ethQuote = await oneInchAPI.getSwapQuote(
              1,
              fromToken,
              '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              fromAmount,
              walletState.address!,
              slippage
            );
            estimatedAmount = ethQuote.toTokenAmount;
          }
          
          // Estimate Stellar amount (simplified)
          const stellarRate = await stellarService.getExchangeRate('ETH', 'XLM');
          const stellarAmount = (parseFloat(estimatedAmount) * stellarRate).toFixed(7);
          setToAmount(stellarAmount);
        } else {
          // Stellar to Ethereum
          const ethRate = await stellarService.getExchangeRate('XLM', 'ETH');
          const ethAmount = (parseFloat(fromAmount) * ethRate).toFixed(18);
          setToAmount(ethAmount);
        }
      }
    } catch (error) {
      console.error('Error calculating quote:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate quote');
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!walletState.isConnected || !fromToken || !toToken || !fromAmount) {
      setError('Please connect wallet and fill all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (fromChain === toChain) {
        // Same-chain swap
        if (fromChain === 'ethereum') {
          await executeEthereumSwap();
        } else {
          await executeStellarSwap();
        }
      } else {
        // Cross-chain swap
        await executeCrossChainSwap();
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute swap');
    } finally {
      setIsLoading(false);
    }
  };

  const executeEthereumSwap = async () => {
    if (!swapQuote) throw new Error('No swap quote available');

    const signer = await walletState.provider!.getSigner();
    const tx = await signer.sendTransaction({
      to: swapQuote.tx.to,
      data: swapQuote.tx.data,
      value: swapQuote.tx.value,
      gasLimit: swapQuote.estimatedGas,
    });

    const receipt = await tx.wait();
    console.log('Ethereum swap completed:', receipt?.hash);
    
    // Refresh balance
    await refreshBalance();
  };

  const executeStellarSwap = async () => {
    // For Stellar same-chain swaps, we'd use the DEX
    const payment = await stellarService.convertTokens(
      fromToken,
      toToken,
      fromAmount,
      walletState.address!
    );
    
    console.log('Stellar swap completed:', payment.transactionHash);
  };

  const executeCrossChainSwap = async () => {
    const swapRequest: CrossChainSwapRequest = {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount: fromAmount,
      fromAddress: walletState.address!,
      toAddress: walletState.address!, // For now, same address
      slippage,
    };

    let swapStatus: SwapStatus;

    if (fromChain === 'ethereum' && toChain === 'stellar') {
      swapStatus = await crossChainBridge.initiateEthereumToStellarSwap(swapRequest);
    } else {
      swapStatus = await crossChainBridge.initiateStellarToEthereumSwap(swapRequest);
    }

    console.log('Cross-chain swap initiated:', swapStatus);
    
    // Add to active swaps
    setActiveSwaps(prev => [...prev, swapStatus]);
    
    // Refresh balance
    await refreshBalance();
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
      {/* Swap Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Cross-Chain Swap</span>
            <Badge variant="outline">HTLC Secure</Badge>
          </CardTitle>
          <CardDescription>
            Swap tokens between Ethereum and Stellar with atomic cross-chain security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!walletState.isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to start swapping
              </AlertDescription>
            </Alert>
          )}

          {/* From Chain and Token */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Chain</label>
              <Select value={fromChain} onValueChange={(value: 'ethereum' | 'stellar') => setFromChain(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="stellar">Stellar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Chain</label>
              <Select value={toChain} onValueChange={(value: 'ethereum' | 'stellar') => setToChain(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="stellar">Stellar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Token Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Token</label>
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableTokens[fromChain]).map(([address, token]) => (
                    <SelectItem key={address} value={address}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Token</label>
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableTokens[toChain]).map(([address, token]) => (
                    <SelectItem key={address} value={address}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  disabled={!walletState.isConnected}
                />
                {walletState.isConnected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setFromAmount(walletState.balance || '0')}
                  >
                    MAX
                  </Button>
                )}
              </div>
              {walletState.isConnected && (
                <p className="text-xs text-muted-foreground">
                  Balance: {walletState.balance} {fromToken ? availableTokens[fromChain][fromToken]?.symbol : ''}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">You'll Receive</label>
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="bg-muted"
              />
              {swapQuote && (
                <p className="text-xs text-muted-foreground">
                  Rate: 1 {availableTokens[fromChain][fromToken]?.symbol} = {toAmount} {availableTokens[toChain][toToken]?.symbol}
                </p>
              )}
            </div>
          </div>

          {/* Slippage */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Slippage Tolerance</label>
            <Select value={slippage.toString()} onValueChange={(value) => setSlippage(parseFloat(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5%</SelectItem>
                <SelectItem value="1">1%</SelectItem>
                <SelectItem value="2">2%</SelectItem>
                <SelectItem value="5">5%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Swap Button */}
          <Button
            onClick={executeSwap}
            disabled={!walletState.isConnected || !fromToken || !toToken || !fromAmount || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                {fromChain === toChain ? 'Swap' : 'Bridge & Swap'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Swaps */}
      {activeSwaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Swaps</CardTitle>
            <CardDescription>
              Monitor your cross-chain swap progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSwaps.map((swap) => (
                <div key={swap.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(swap.status)}
                      <span className="font-medium">
                        {swap.fromChain.toUpperCase()} → {swap.toChain.toUpperCase()}
                      </span>
                    </div>
                    <Badge className={getStatusColor(swap.status)}>
                      {swap.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {swap.amount} {swap.fromToken} → {swap.receivedAmount || '...'} {swap.toToken}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3">
                    ID: {swap.id.slice(0, 8)}...{swap.id.slice(-8)}
                  </div>

                  {swap.status === 'initiated' && swap.secret && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Secret for completion: {swap.secret}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => completeSwap(swap.id, swap.secret!)}
                        >
                          Complete Swap
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refundSwap(swap.id)}
                        >
                          Refund
                        </Button>
                      </div>
                    </div>
                  )}

                  {swap.ethereumTxHash && (
                    <div className="text-xs text-muted-foreground">
                      ETH TX: {swap.ethereumTxHash.slice(0, 8)}...{swap.ethereumTxHash.slice(-8)}
                    </div>
                  )}

                  {swap.stellarTxHash && (
                    <div className="text-xs text-muted-foreground">
                      Stellar TX: {swap.stellarTxHash}
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
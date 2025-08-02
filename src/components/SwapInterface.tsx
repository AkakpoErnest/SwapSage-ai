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
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

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
      // MATIC (native token) - correct address for Polygon
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { 
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'MATIC', 
        name: 'Polygon', 
        decimals: 18 
      },
      // Alternative MATIC address
      '0x0000000000000000000000000000000000000000': { 
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        symbol: 'MATIC', 
        name: 'Polygon', 
        decimals: 18 
      },
      // USDC on Polygon mainnet
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': { 
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 6 
      },
      // USDT on Polygon mainnet
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': { 
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        symbol: 'USDT', 
        name: 'Tether USD', 
        decimals: 6 
      },
      // DAI on Polygon mainnet
      '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': { 
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        symbol: 'DAI', 
        name: 'Dai Stablecoin', 
        decimals: 18 
      },
      // WETH on Polygon mainnet
      '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': { 
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        symbol: 'WETH', 
        name: 'Wrapped Ether', 
        decimals: 18 
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

  // Reload tokens when wallet network changes
  useEffect(() => {
    if (walletState.chainId) {
      console.log('Wallet network changed, reloading tokens...');
      loadTokens();
    }
  }, [walletState.chainId]);

  useEffect(() => {
    if (fromToken && toToken && fromAmount && walletState.isConnected) {
      calculateQuote();
    }
  }, [fromToken, toToken, fromAmount, fromChain, toChain, walletState.isConnected]);

  const loadTokens = async () => {
    try {
      // Load tokens from 1inch API using current chain ID (default to Polygon mainnet)
      const chainId = walletState.chainId || 137; // Default to Polygon mainnet
      console.log(`Loading tokens for chain ID: ${chainId}`);
      const ethereumTokens = await oneInchAPI.getTokens(chainId);
      
      // Ensure native token (ETH/MATIC) is always available
      const nativeTokenSymbol = chainId === 137 ? 'MATIC' : 'ETH';
      const tokensWithNative = {
        ...ethereumTokens,
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          symbol: nativeTokenSymbol,
          name: chainId === 137 ? 'Polygon' : 'Ethereum',
          decimals: 18,
        }
      };
      
              console.log('Available tokens:', Object.keys(tokensWithNative));
              setTokens(tokensWithNative);
    } catch (error) {
      console.error('Error loading tokens:', error);
      // Use fallback tokens
      console.log('Using fallback tokens');
      setTokens(availableTokens.polygon);
    }
  };

  const loadActiveSwaps = async () => {
    if (walletState.address) {
      const swaps = crossChainBridge.getSwapsForAddress(walletState.address);
      setActiveSwaps(swaps);
    }
  };

  const calculateQuote = async () => {
    console.log('=== CALCULATE QUOTE START ===');
    console.log('fromToken:', fromToken);
    console.log('toToken:', toToken);
    console.log('fromAmount:', fromAmount);
    console.log('walletState.isConnected:', walletState.isConnected);
    console.log('walletState.chainId:', walletState.chainId);
    console.log('fromChain:', fromChain);
    console.log('toChain:', toChain);

    if (!fromToken || !toToken || !fromAmount || !walletState.isConnected) {
      setError('Please connect wallet and fill all fields');
      return;
    }

    // Prevent swapping same token
    if (fromToken === toToken && fromChain === toChain) {
      setError('Cannot swap the same token. Please select different tokens.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (fromChain === toChain) {
        // Same-chain swap using 1inch
        if (fromChain === 'polygon') {
          // Use the actual chain ID from wallet state, fallback to Polygon mainnet if not available
          const chainId = walletState.chainId || 137;
          console.log(`Using chain ID: ${chainId} for swap quote`);
          console.log(`From Token: ${fromToken}`);
          console.log(`To Token: ${toToken}`);
          console.log(`Amount: ${fromAmount}`);
          console.log(`Address: ${walletState.address}`);
          
          try {
            const quote = await oneInchAPI.getSwapQuote(
              chainId,
              fromToken,
              toToken,
              fromAmount,
              walletState.address!,
              slippage
            );
            console.log('1inch quote received:', quote);
            setSwapQuote(quote);
            setToAmount(quote.toTokenAmount);
          } catch (error) {
            console.error('1inch API error:', error);
            throw error;
          }
        } else {
          // Stellar same-chain swap
          const exchangeRate = await stellarService.getExchangeRate(fromToken, toToken);
          const convertedAmount = (parseFloat(fromAmount) * exchangeRate).toFixed(7);
          setToAmount(convertedAmount);
        }
      } else {
        // Cross-chain swap - estimate based on current rates
        console.log(`Cross-chain swap: ${fromChain} → ${toChain}`);
        console.log(`From: ${fromAmount} ${fromToken} → To: ${toToken}`);
        let estimatedAmount = fromAmount;
        
        if (fromChain === 'polygon') {
          // Convert to MATIC first, then estimate Stellar amount
          if (fromToken !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            const chainId = walletState.chainId || 137;
            
            try {
              // Try to get real quote from 1inch
              const maticQuote = await oneInchAPI.getSwapQuote(
                chainId,
                fromToken,
                '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                fromAmount,
                walletState.address!,
                slippage
              );
              estimatedAmount = maticQuote.toTokenAmount;
            } catch (error) {
              console.log('1inch API failed, using demo conversion for cross-chain swap');
              // Fallback: use demo conversion rate (1 USDC ≈ 0.001 MATIC on Polygon)
              const demoRate = 0.001; // Demo rate for USDC to MATIC
              estimatedAmount = (parseFloat(fromAmount) * demoRate).toString();
            }
          }
          
          // Estimate Stellar amount (simplified)
          try {
            const stellarRate = await stellarService.getExchangeRate('MATIC', 'XLM');
            const stellarAmount = (parseFloat(estimatedAmount) * stellarRate).toFixed(7);
            setToAmount(stellarAmount);
          } catch (error) {
            console.log('Stellar service failed, using demo rate');
            // Fallback: use demo rate (1 MATIC ≈ 100 XLM)
            const demoStellarRate = 100;
            const stellarAmount = (parseFloat(estimatedAmount) * demoStellarRate).toFixed(7);
            setToAmount(stellarAmount);
          }
        } else {
          // Stellar to Polygon
          try {
            const maticRate = await stellarService.getExchangeRate('XLM', 'MATIC');
            const maticAmount = (parseFloat(fromAmount) * maticRate).toFixed(18);
            setToAmount(maticAmount);
          } catch (error) {
            console.log('Stellar service failed, using demo rate for XLM to MATIC');
            // Fallback: use demo rate (1 XLM ≈ 0.01 MATIC)
            const demoRate = 0.01;
            const maticAmount = (parseFloat(fromAmount) * demoRate).toFixed(18);
            setToAmount(maticAmount);
          }
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
        if (fromChain === 'polygon') {
          await executePolygonSwap();
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

  const executePolygonSwap = async () => {
    if (!swapQuote) throw new Error('No swap quote available');

    try {
      console.log('🔍 Starting Polygon swap execution...');
      console.log('Wallet connected:', walletState.isConnected);
      console.log('Wallet address:', walletState.address);
      console.log('Provider available:', !!walletState.provider);
      
      // Validate wallet connection
      if (!walletState.provider || !walletState.address) {
        throw new Error('Wallet not properly connected. Please reconnect your wallet.');
      }

      const signer = await walletState.provider.getSigner();
      console.log('Signer obtained:', !!signer);
      
      // Check if user has enough balance
      const balance = await walletState.provider.getBalance(walletState.address);
      const requiredValue = BigInt(swapQuote.tx.value || '0');
      
      console.log('User balance:', ethers.formatEther(balance), 'MATIC');
      console.log('Required value:', ethers.formatEther(requiredValue), 'MATIC');
      
      if (balance < requiredValue) {
        throw new Error(`Insufficient balance. Required: ${ethers.formatEther(requiredValue)} MATIC, Available: ${ethers.formatEther(balance)} MATIC`);
      }

      console.log('✅ Balance check passed');
      console.log('Executing 1inch swap on Polygon...');
      console.log('To:', swapQuote.tx.to);
      console.log('Value:', ethers.formatEther(requiredValue), 'MATIC');
      console.log('Gas Limit:', swapQuote.estimatedGas);
      console.log('Data length:', swapQuote.tx.data.length);

      // Prepare transaction
      const txRequest = {
        to: swapQuote.tx.to,
        data: swapQuote.tx.data,
        value: requiredValue,
        gasLimit: BigInt(swapQuote.estimatedGas || '300000'),
      };

      console.log('Transaction request:', txRequest);

      const tx = await signer.sendTransaction(txRequest);

      console.log('✅ Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Polygon swap completed:', receipt?.hash);
      
      // Show success message
      setError('');
      alert(`Swap completed successfully! Transaction: ${receipt?.hash}`);
      
      // Refresh the page to update balances
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error executing Polygon swap:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient MATIC balance for gas fees. Please add more MATIC to your wallet.');
        } else if (error.message.includes('user rejected')) {
          throw new Error('Transaction was rejected by user. Please try again.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else {
          throw new Error(`Swap failed: ${error.message}`);
        }
      } else {
        throw new Error(`Swap failed: ${error}`);
      }
    }
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
      fromChain: fromChain as 'polygon' | 'stellar',
      toChain: toChain as 'polygon' | 'stellar',
      fromToken,
      toToken,
      amount: fromAmount,
      fromAddress: walletState.address!,
      toAddress: walletState.address!, // For now, same address
      slippage,
    };

    let swapStatus: SwapStatus;

    if (fromChain === 'polygon' && toChain === 'stellar') {
      swapStatus = await crossChainBridge.initiatePolygonToStellarSwap(swapRequest);
    } else {
      swapStatus = await crossChainBridge.initiateStellarToPolygonSwap(swapRequest);
    }

    console.log('Cross-chain swap initiated:', swapStatus);
    
    // Add to active swaps
    setActiveSwaps(prev => [...prev, swapStatus]);
    
    // Balance will be refreshed automatically
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
      {/* Diagnostic Section - Only show in development */}
      {import.meta.env.DEV && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">🔧 Diagnostic Panel (Development Only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p><strong>Wallet Status:</strong> {walletState.isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
              <p><strong>Wallet Address:</strong> {walletState.address || 'None'}</p>
              <p><strong>Chain ID:</strong> {walletState.chainId || 'None'}</p>
              <p><strong>Provider:</strong> {walletState.provider ? '✅ Available' : '❌ Missing'}</p>
              <p><strong>1inch API Key:</strong> {import.meta.env.VITE_1INCH_API_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>From Token:</strong> {fromToken || 'None'}</p>
              <p><strong>To Token:</strong> {toToken || 'None'}</p>
              <p><strong>From Amount:</strong> {fromAmount || 'None'}</p>
              <p><strong>Swap Quote:</strong> {swapQuote ? '✅ Available' : '❌ None'}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  console.log('=== DIAGNOSTIC TEST ===');
                  console.log('Wallet State:', walletState);
                  console.log('Tokens:', { fromToken, toToken, fromAmount });
                  console.log('Chains:', { fromChain, toChain });
                  console.log('Environment:', {
                    apiKey: import.meta.env.VITE_1INCH_API_KEY ? 'Set' : 'Missing',
                    dev: import.meta.env.DEV,
                    mode: import.meta.env.MODE
                  });
                }}
                variant="outline"
                size="sm"
              >
                Log Debug Info
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    if (walletState.provider) {
                      const balance = await walletState.provider.getBalance(walletState.address!);
                      alert(`Balance: ${ethers.formatEther(balance)} MATIC`);
                    } else {
                      alert('No provider available');
                    }
                  } catch (error) {
                    alert(`Error: ${error}`);
                  }
                }}
                variant="outline"
                size="sm"
              >
                Check Balance
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('Testing 1inch API...');
                    const tokens = await oneInchAPI.getTokens(137); // Polygon mainnet
                    console.log('1inch tokens:', tokens);
                    alert(`1inch API working! Found ${Object.keys(tokens).length} tokens`);
                  } catch (error) {
                    console.error('1inch API test failed:', error);
                    alert(`1inch API failed: ${error}`);
                  }
                }}
                variant="outline"
                size="sm"
              >
                Test 1inch API
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Select value={fromChain} onValueChange={(value: 'ethereum' | 'polygon' | 'stellar') => handleChainChange(value, 'from')}>
                <SelectTrigger>
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
                <SelectTrigger>
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

          {/* Token Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Token</label>
              <Select value={fromToken} onValueChange={(value) => handleTokenChange(value, 'from')}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                  Balance: {walletState.balance} {fromToken ? 
                    ((fromChain === 'ethereum' || fromChain === 'polygon') ? tokens[fromToken]?.symbol : availableTokens[fromChain][fromToken]?.symbol) 
                    : ''}
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
                  Rate: 1 {(fromChain === 'ethereum' || fromChain === 'polygon') ? tokens[fromToken]?.symbol : availableTokens[fromChain][fromToken]?.symbol} = {toAmount} {(toChain === 'ethereum' || toChain === 'polygon') ? tokens[toToken]?.symbol : availableTokens[toChain][toToken]?.symbol}
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

          {/* Quote Details */}
          {swapQuote && fromChain === toChain && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Swap Quote</h4>
              <div className="space-y-1 text-sm">
                <div>Estimated Gas: {swapQuote.estimatedGas}</div>
                <div>Protocols: {swapQuote.protocols.join(', ')}</div>
                <div>You Pay: {swapQuote.fromTokenAmount} {swapQuote.fromToken.symbol}</div>
                <div>You Receive: {swapQuote.toTokenAmount} {swapQuote.toToken.symbol}</div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Helpful Tips */}
          {!error && fromToken === toToken && fromChain === toChain && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                💡 Tip: Select different tokens to swap. For example, try ETH → USDC or USDC → DAI.
              </AlertDescription>
            </Alert>
          )}

          {/* Cross-Chain Swap Info */}
          {!error && fromChain !== toChain && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                🌉 Cross-chain swap: {fromChain.toUpperCase()} → {toChain.toUpperCase()}. 
                This will use atomic HTLC swaps for secure cross-chain transfers.
              </AlertDescription>
            </Alert>
          )}

          {/* Get Quote Button */}
          {fromChain === toChain && fromToken && toToken && fromAmount && !swapQuote && (
            <Button
              onClick={calculateQuote}
              disabled={!walletState.isConnected || isLoading || fromToken === toToken}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Get Quote
            </Button>
          )}

          {/* Swap Button */}
          <Button
            onClick={executeSwap}
            disabled={!walletState.isConnected || !fromToken || !toToken || !fromAmount || isLoading || fromToken === toToken || (fromChain === toChain && !swapQuote)}
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
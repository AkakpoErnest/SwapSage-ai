import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useWalletContext } from '../contexts/WalletContext';
import { polygonStellarBridge, PolygonStellarSwapRequest, PolygonStellarSwapResult } from '../services/bridge/polygonStellarBridge';
import { 
  ArrowUpDown,
  Shield,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
  Eye,
  Key,
  Unlock,
  RotateCcw,
  Copy,
  ExternalLink,
  Timer,
  Lock,
  Zap,
  Coins,
  Network,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface BridgeStats {
  totalSwaps: number;
  activeSwaps: number;
  completedSwaps: number;
  failedSwaps: number;
  totalVolume: string;
  successRate: number;
}

const BridgeInterface: React.FC = () => {
  const { walletState } = useWalletContext();
  
  // Bridge state
  const [fromChain, setFromChain] = useState<'polygon' | 'stellar'>('polygon');
  const [toChain, setToChain] = useState<'polygon' | 'stellar'>('stellar');
  const [fromToken, setFromToken] = useState<string>('MATIC');
  const [toToken, setToToken] = useState<string>('XLM');
  const [amount, setAmount] = useState<string>('1');
  const [isInitiating, setIsInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HTLC Security state
  const [selectedSwap, setSelectedSwap] = useState<PolygonStellarSwapResult | null>(null);
  const [secretInput, setSecretInput] = useState<string>('');
  const [isRevealingSecret, setIsRevealingSecret] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [htlcDetails, setHtlcDetails] = useState<any>(null);
  const [showHtlcModal, setShowHtlcModal] = useState(false);

  // Transaction state
  const [activeSwaps, setActiveSwaps] = useState<PolygonStellarSwapResult[]>([]);
  const [completedSwaps, setCompletedSwaps] = useState<PolygonStellarSwapResult[]>([]);
  const [stats, setStats] = useState<BridgeStats>({
    totalSwaps: 0,
    activeSwaps: 0,
    completedSwaps: 0,
    failedSwaps: 0,
    totalVolume: '0',
    successRate: 0
  });

  // Available tokens with contract addresses
  const availableTokens = {
    polygon: {
      MATIC: { 
        symbol: 'MATIC', 
        name: 'Polygon', 
        decimals: 18,
        address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' // WMATIC
      },
      USDC: { 
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 6,
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
      },
      DAI: { 
        symbol: 'DAI', 
        name: 'Dai Stablecoin', 
        decimals: 18,
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
      },
      USDT: { 
        symbol: 'USDT', 
        name: 'Tether USD', 
        decimals: 6,
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
      },
      ETH: { 
        symbol: 'WETH', 
        name: 'Wrapped Ethereum', 
        decimals: 18,
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
      }
    },
    stellar: {
      XLM: { 
        symbol: 'XLM', 
        name: 'Stellar Lumens', 
        decimals: 7,
        address: 'XLM'
      },
      USDC: { 
        symbol: 'USDC', 
        name: 'USD Coin', 
        decimals: 7,
        address: 'USDC'
      },
      USDT: { 
        symbol: 'USDT', 
        name: 'Tether USD', 
        decimals: 7,
        address: 'USDT'
      }
    }
  };

  useEffect(() => {
    loadSwaps();
    calculateStats();
  }, [walletState.address]);

  const getStellarWallet = (): string => {
    return localStorage.getItem('stellarWalletAddress') || '';
  };

  const loadSwaps = async () => {
    // For demo purposes, we'll use empty arrays
    setActiveSwaps([]);
    setCompletedSwaps([]);
  };

  const calculateStats = () => {
    const allSwaps = [...activeSwaps, ...completedSwaps];
    const total = allSwaps.length;
    const active = activeSwaps.length;
    const completed = completedSwaps.filter(s => s.status === 'completed').length;
    const failed = completedSwaps.filter(s => s.status === 'failed').length;
    
    const totalVolume = allSwaps
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + 1, 0) // For demo, just count completed swaps
      .toFixed(2);
    
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    setStats({
      totalSwaps: total,
      activeSwaps: active,
      completedSwaps: completed,
      failedSwaps: failed,
      totalVolume,
      successRate
    });
  };

  const initiateSwap = async () => {
    if (!walletState.isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsInitiating(true);
    setError(null);

    try {
      // Get proper token addresses
      const fromTokenAddress = availableTokens[fromChain][fromToken as keyof typeof availableTokens[typeof fromChain]]?.address || fromToken;
      const toTokenAddress = availableTokens[toChain][toToken as keyof typeof availableTokens[typeof toChain]]?.address || toToken;

      // Use user's Stellar wallet if available, otherwise use Ethereum address
      const recipientAddress = (toChain === 'stellar' && getStellarWallet()) 
        ? getStellarWallet() 
        : walletState.address || '';

      const swapRequest: PolygonStellarSwapRequest = {
        fromChain,
        toChain,
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        fromAmount: amount,
        recipient: recipientAddress,
        use1inchFusion: true // Enable 1inch Fusion for optimal routing
      };

      let result: PolygonStellarSwapResult;
      if (fromChain === 'polygon' && toChain === 'stellar') {
        result = await polygonStellarBridge.executePolygonToStellarSwap(swapRequest);
      } else {
        result = await polygonStellarBridge.executeStellarToPolygonSwap(swapRequest);
      }

      setActiveSwaps(prev => [...prev, result]);
      calculateStats();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initiate swap');
    } finally {
      setIsInitiating(false);
    }
  };

  // HTLC Security functions
  const revealSecret = async (swap: PolygonStellarSwapResult) => {
    if (!secretInput.trim()) {
      setError('Please enter the secret to reveal');
      return;
    }

    setIsRevealingSecret(true);
    setError(null);

    try {
      await polygonStellarBridge.completeSwap(swap.swapId, secretInput, fromChain);
      
      setActiveSwaps(prev => prev.filter(s => s.swapId !== swap.swapId));
      setCompletedSwaps(prev => [...prev, { ...swap, status: 'completed' }]);
      calculateStats();
      
      setSecretInput('');
      setSelectedSwap(null);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reveal secret');
    } finally {
      setIsRevealingSecret(false);
    }
  };

  const refundSwap = async (swap: PolygonStellarSwapResult) => {
    setIsRefunding(true);
    setError(null);

    try {
      // For demo purposes, simulate refund
      setActiveSwaps(prev => prev.filter(s => s.swapId !== swap.swapId));
      setCompletedSwaps(prev => [...prev, { ...swap, status: 'refunded' }]);
      calculateStats();
      
      setSelectedSwap(null);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refund swap');
    } finally {
      setIsRefunding(false);
    }
  };

  const getHtlcDetails = async (swap: PolygonStellarSwapResult) => {
    try {
      // For demo purposes, create mock details
      const details = {
        swapId: swap.swapId,
        hashlock: swap.hashlock,
        timelock: swap.timelock,
        secret: swap.secret,
        status: swap.status
      };
      setHtlcDetails(details);
      setShowHtlcModal(true);
    } catch (error) {
      setError('Failed to load HTLC details');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      case 'refunded':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeRemaining = (timelock: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = timelock - now;
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return parseFloat(amount).toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-card border-neon-cyan/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Swaps</p>
              <p className="text-2xl font-bold text-neon-cyan">{stats.totalSwaps}</p>
            </div>
            <Activity className="w-8 h-8 text-neon-cyan" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Swaps</p>
              <p className="text-2xl font-bold text-green-500">{stats.activeSwaps}</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold text-purple-500">${stats.totalVolume}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-orange-500">{stats.successRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <Progress value={stats.successRate} className="mt-2 h-2" />
        </Card>
      </div>

      {/* Main Bridge Interface */}
      <Tabs defaultValue="bridge" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bridge">Bridge</TabsTrigger>
          <TabsTrigger value="active">Active Swaps</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="bridge" className="space-y-4">
          <Card className="bg-gradient-card border-neon-cyan/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-neon-cyan" />
                Cross-Chain Atomic Swap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!walletState.isConnected && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Please connect your wallet to start bridging</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Chain */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Chain</label>
                  <Select value={fromChain} onValueChange={(value: 'polygon' | 'stellar') => setFromChain(value)}>
                    <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polygon">🟣 Polygon</SelectItem>
                      <SelectItem value="stellar">⭐ Stellar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* To Chain */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Chain</label>
                  <Select value={toChain} onValueChange={(value: 'polygon' | 'stellar') => setToChain(value)}>
                    <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polygon">🟣 Polygon</SelectItem>
                      <SelectItem value="stellar">⭐ Stellar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
                  />
                </div>

                {/* From Token */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Token</label>
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availableTokens[fromChain]).map(([symbol, token]) => (
                        <SelectItem key={symbol} value={symbol}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* To Token */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Token</label>
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger className="bg-space-gray border-neon-cyan/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availableTokens[toChain]).map(([symbol, token]) => (
                        <SelectItem key={symbol} value={symbol}>
                          {token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={initiateSwap}
                disabled={isInitiating || !walletState.isConnected || !amount || parseFloat(amount) <= 0}
                className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
              >
                {isInitiating ? (
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
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card className="bg-gradient-card border-neon-cyan/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-neon-cyan" />
                Active HTLC Swaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSwaps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <p>No active swaps</p>
                  <p className="text-sm">Initiate a swap to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSwaps.map((swap) => (
                    <div key={swap.swapId} className="p-4 bg-space-gray/50 rounded-lg border border-neon-cyan/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(swap.status)}
                          <span className="text-sm font-medium">
                            Swap #{swap.swapId.substring(0, 8)}...
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {swap.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                        <div>Polygon → Stellar</div>
                        {swap.timelock && (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {getTimeRemaining(swap.timelock)}
                          </div>
                        )}
                      </div>

                      {swap.fromTxHash && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>ETH:</span>
                          <span className="font-mono">{swap.fromTxHash.substring(0, 10)}...{swap.fromTxHash.substring(58)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(swap.fromTxHash!)}
                            className="h-4 w-4 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {swap.stellarTxHash && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <span>XLM:</span>
                          <span className="font-mono">{swap.stellarTxHash.substring(0, 10)}...{swap.stellarTxHash.substring(58)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(swap.stellarTxHash!)}
                            className="h-4 w-4 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* HTLC Security Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => getHtlcDetails(swap)}
                          className="bg-space-gray border-neon-cyan/20 hover:bg-neon-cyan/10"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          HTLC Details
                        </Button>
                        
                        {swap.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSwap(swap)}
                              className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Reveal Secret
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refundSwap(swap)}
                              disabled={isRefunding}
                              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Refund
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-gradient-card border-neon-cyan/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-neon-cyan" />
                Swap History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedSwaps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p>No completed swaps</p>
                  <p className="text-sm">Complete a swap to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                                      {completedSwaps.map((swap) => (
                      <div key={swap.swapId} className="p-3 bg-space-gray/50 rounded-lg border border-neon-cyan/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(swap.status)}
                            <span className="text-sm font-medium">
                              Swap #{swap.swapId.substring(0, 8)}...
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {swap.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Polygon → Stellar • {new Date().toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Secret Revelation Modal */}
      {selectedSwap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-space-gray p-6 rounded-lg border border-neon-cyan/20 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-neon-cyan" />
              <h3 className="text-lg font-semibold">Reveal HTLC Secret</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Enter the secret to complete the swap and claim your funds.
              </div>
              
              <Input
                type="text"
                placeholder="Enter secret..."
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="bg-space-gray border-neon-cyan/20 focus:border-neon-cyan/40"
              />
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => revealSecret(selectedSwap)}
                  disabled={isRevealingSecret || !secretInput.trim()}
                  className="flex-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
                >
                  {isRevealingSecret ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Revealing...
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Reveal Secret
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSwap(null);
                    setSecretInput('');
                  }}
                  className="bg-space-gray border-neon-cyan/20 hover:bg-neon-cyan/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HTLC Details Modal */}
      {showHtlcModal && htlcDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-space-gray p-6 rounded-lg border border-neon-cyan/20 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-neon-cyan" />
                <h3 className="text-lg font-semibold">HTLC Details</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHtlcModal(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hashlock:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{htlcDetails.hashlock?.substring(0, 16)}...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(htlcDetails.hashlock)}
                    className="h-4 w-4 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timelock:</span>
                <span>{new Date(htlcDetails.timelock * 1000).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span>{htlcDetails.amount} {htlcDetails.asset}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {htlcDetails.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeInterface; 
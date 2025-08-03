import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useWalletContext } from '../contexts/WalletContext';
import { crossChainBridge, CrossChainSwapRequest, SwapStatus } from '../services/bridge/crossChainBridge';
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
  const [selectedSwap, setSelectedSwap] = useState<SwapStatus | null>(null);
  const [secretInput, setSecretInput] = useState<string>('');
  const [isRevealingSecret, setIsRevealingSecret] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [htlcDetails, setHtlcDetails] = useState<any>(null);
  const [showHtlcModal, setShowHtlcModal] = useState(false);

  // Transaction state
  const [activeSwaps, setActiveSwaps] = useState<SwapStatus[]>([]);
  const [completedSwaps, setCompletedSwaps] = useState<SwapStatus[]>([]);
  const [stats, setStats] = useState<BridgeStats>({
    totalSwaps: 0,
    activeSwaps: 0,
    completedSwaps: 0,
    failedSwaps: 0,
    totalVolume: '0',
    successRate: 0
  });

  // Available tokens
  const availableTokens = {
    polygon: {
      MATIC: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
      USDC: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      DAI: { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
      USDT: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
      ETH: { symbol: 'WETH', name: 'Wrapped Ethereum', decimals: 18 }
    },
    stellar: {
      XLM: { symbol: 'XLM', name: 'Stellar Lumens', decimals: 7 },
      USDC: { symbol: 'USDC', name: 'USD Coin', decimals: 7 },
      USDT: { symbol: 'USDT', name: 'Tether USD', decimals: 7 }
    }
  };

  useEffect(() => {
    loadSwaps();
    calculateStats();
  }, [walletState.address]);

  const loadSwaps = async () => {
    if (walletState.address) {
      try {
        const swaps = crossChainBridge.getSwapsForAddress(walletState.address);
        const active = swaps.filter(s => s.status === 'pending' || s.status === 'initiated');
        const completed = swaps.filter(s => s.status === 'completed' || s.status === 'refunded');
        
        setActiveSwaps(active);
        setCompletedSwaps(completed);
      } catch (error) {
        console.error('Failed to load swaps:', error);
      }
    }
  };

  const calculateStats = () => {
    const allSwaps = [...activeSwaps, ...completedSwaps];
    const total = allSwaps.length;
    const active = activeSwaps.length;
    const completed = completedSwaps.filter(s => s.status === 'completed').length;
    const failed = completedSwaps.filter(s => s.status === 'failed').length;
    
    const totalVolume = allSwaps
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + parseFloat(s.amount), 0)
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
      const swapRequest: CrossChainSwapRequest = {
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        fromAddress: walletState.address || '',
        toAddress: walletState.address || '',
        slippage: 1
      };

      let result: SwapStatus;
      if (fromChain === 'polygon' && toChain === 'stellar') {
        result = await crossChainBridge.initiatePolygonToStellarSwap(swapRequest);
      } else {
        result = await crossChainBridge.initiateStellarToPolygonSwap(swapRequest);
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
  const revealSecret = async (swap: SwapStatus) => {
    if (!secretInput.trim()) {
      setError('Please enter the secret to reveal');
      return;
    }

    setIsRevealingSecret(true);
    setError(null);

    try {
      await crossChainBridge.completeSwap(swap.id, secretInput, fromChain);
      
      setActiveSwaps(prev => prev.filter(s => s.id !== swap.id));
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

  const refundSwap = async (swap: SwapStatus) => {
    setIsRefunding(true);
    setError(null);

    try {
      await crossChainBridge.refundSwap(swap.id, fromChain);
      
      setActiveSwaps(prev => prev.filter(s => s.id !== swap.id));
      setCompletedSwaps(prev => [...prev, { ...swap, status: 'refunded' }]);
      calculateStats();
      
      setSelectedSwap(null);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refund swap');
    } finally {
      setIsRefunding(false);
    }
  };

  const getHtlcDetails = async (swap: SwapStatus) => {
    try {
      const details = await crossChainBridge.getSwapDetails(swap.id);
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
                    <div key={swap.id} className="p-4 bg-space-gray/50 rounded-lg border border-neon-cyan/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(swap.status)}
                          <span className="text-sm font-medium">
                            {swap.amount} {swap.fromToken} → {swap.toToken}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {swap.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                        <div>{swap.fromChain} → {swap.toChain}</div>
                        {swap.timelock && (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {getTimeRemaining(swap.timelock)}
                          </div>
                        )}
                      </div>

                      {swap.ethereumTxHash && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>ETH:</span>
                          <span className="font-mono">{swap.ethereumTxHash.substring(0, 10)}...{swap.ethereumTxHash.substring(58)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(swap.ethereumTxHash!)}
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
                    <div key={swap.id} className="p-3 bg-space-gray/50 rounded-lg border border-neon-cyan/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(swap.status)}
                          <span className="text-sm font-medium">
                            {swap.amount} {swap.fromToken} → {swap.toToken}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {swap.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {swap.fromChain} → {swap.toChain} • {new Date(swap.createdAt).toLocaleString()}
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
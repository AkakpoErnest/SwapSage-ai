import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, 
  WalletIcon, 
  Search, 
  ExternalLink, 
  Download, 
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Network,
  Coins
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: 'swap' | 'bridge';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChain?: string;
  toChain?: string;
  recipient: string;
  timestamp: number;
  txHash?: string;
  error?: string;
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { walletState, connectEthereum, connectStellar, disconnect } = useWallet();
  const { toast } = useToast();

  // Sample transactions for demo purposes
  const sampleTransactions: Transaction[] = [
    {
      id: "1",
      type: "swap",
      status: "completed",
      fromToken: "MATIC",
      toToken: "USDC",
      fromAmount: "100.0",
      toAmount: "80.0",
      fromChain: "polygon",
      toChain: "polygon",
      recipient: walletState.address || "0xf9c3...76cb",
      timestamp: Date.now() - 3600000, // 1 hour ago
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    {
      id: "2",
      type: "bridge",
      status: "processing",
      fromToken: "MATIC",
      toToken: "XLM",
      fromAmount: "50.0",
      toAmount: "125.0",
      fromChain: "polygon",
      toChain: "stellar",
      recipient: walletState.address || "0xf9c3...76cb",
      timestamp: Date.now() - 1800000, // 30 minutes ago
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    },
    {
      id: "3",
      type: "swap",
      status: "completed",
      fromToken: "USDC",
      toToken: "WBTC",
      fromAmount: "1000.0",
      toAmount: "0.022",
      fromChain: "polygon",
      toChain: "polygon",
      recipient: walletState.address || "0xf9c3...76cb",
      timestamp: Date.now() - 7200000, // 2 hours ago
      txHash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456"
    }
  ];

  const loadTransactionHistory = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from blockchain or API
      // For now, we'll use sample data
      const storedTransactions = localStorage.getItem(`transactions_${walletState.address}`);
      let loadedTransactions: Transaction[] = [];
      
      if (storedTransactions) {
        loadedTransactions = JSON.parse(storedTransactions);
      } else {
        // Use sample data if no stored transactions
        loadedTransactions = sampleTransactions;
        localStorage.setItem(`transactions_${walletState.address}`, JSON.stringify(sampleTransactions));
      }
      
      setTransactions(loadedTransactions);
      setFilteredTransactions(loadedTransactions);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      // Fallback to sample data
      setTransactions(sampleTransactions);
      setFilteredTransactions(sampleTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      loadTransactionHistory();
    }
  }, [walletState.isConnected, walletState.address]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  const calculateStats = (txs: Transaction[]) => {
    const total = txs.length;
    const completed = txs.filter(tx => tx.status === 'completed').length;
    const processing = txs.filter(tx => tx.status === 'processing').length;
    const failed = txs.filter(tx => tx.status === 'failed').length;
    const totalVolume = txs.reduce((sum, tx) => sum + parseFloat(tx.fromAmount), 0);

    return { total, completed, processing, failed, totalVolume };
  };

  const applyFilters = () => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.fromToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.toToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bridge':
        return <Network className="w-4 h-4 text-purple-500" />;
      case 'swap':
        return <Coins className="w-4 h-4 text-cyan-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const openTransactionExplorer = (txHash: string) => {
    // Use appropriate explorer based on chain
    const isPolygon = walletState.network?.toLowerCase().includes('polygon') || 
                     walletState.chainId === 137;
    const isStellar = walletState.network?.toLowerCase().includes('stellar') || 
                     walletState.chainId === 100;
    
    if (isPolygon) {
      window.open(`https://polygonscan.com/tx/${txHash}`, '_blank');
    } else if (isStellar) {
      window.open(`https://stellar.expert/explorer/testnet/tx/${txHash}`, '_blank');
    } else {
      // Default to Polygon explorer
      window.open(`https://polygonscan.com/tx/${txHash}`, '_blank');
    }
  };

  const exportHistory = async (format: 'json' | 'csv' = 'json') => {
    if (!walletState.address) return;

    try {
      let exportData: string;
      
      if (format === 'csv') {
        const headers = ['ID', 'Type', 'Status', 'From Token', 'To Token', 'From Amount', 'To Amount', 'Date', 'TX Hash'];
        const rows = filteredTransactions.map(tx => [
          tx.id,
          tx.type,
          tx.status,
          tx.fromToken,
          tx.toToken,
          tx.fromAmount,
          tx.toAmount,
          formatDate(tx.timestamp),
          tx.txHash || ''
        ]);
        
        exportData = [headers, ...rows].map(row => row.join(',')).join('\n');
      } else {
        exportData = JSON.stringify(filteredTransactions, null, 2);
      }
      
      const blob = new Blob([exportData], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-history-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Transaction history exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export transaction history",
        variant: "destructive",
      });
    }
  };

  if (!walletState.isConnected) {
    return (
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">🟣⭐ Polygon-Stellar Transaction History</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your cross-chain transaction history
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={async () => {
                  try {
                    await connectEthereum();
                  } catch (error) {
                    console.error('Failed to connect wallet:', error);
                    toast({
                      title: "Connection Failed",
                      description: "Failed to connect wallet. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-gradient-primary hover:bg-gradient-primary/80"
              >
                <WalletIcon className="w-4 h-4 mr-2" />
                Connect MetaMask
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await connectStellar();
                  } catch (error) {
                    console.error('Failed to connect Stellar wallet:', error);
                    toast({
                      title: "Connection Failed",
                      description: "Failed to connect Stellar wallet. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
              >
                <WalletIcon className="w-4 h-4 mr-2" />
                Connect Freighter
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const stats = calculateStats(transactions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🟣⭐ Polygon-Stellar Transaction History</h2>
          <p className="text-muted-foreground">View and manage your cross-chain swap and bridge transactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportHistory('json')}
            className="border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => exportHistory('csv')}
            className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-card border-neon-green/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Activity className="w-8 h-8 text-neon-green" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
            </div>
            <Loader2 className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-card border-neon-cyan/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="swap">Swaps</SelectItem>
                <SelectItem value="bridge">Bridges</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-gradient-card border-neon-cyan/20">
        {isLoading ? (
          <div className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span>Loading transaction history...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.slice(0, 20).map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(tx.type)}
                      <span className="capitalize">{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(tx.status)}>
                      {getStatusIcon(tx.status)}
                      <span className="ml-1 capitalize">{tx.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{tx.fromToken}</span>
                      {tx.fromChain && (
                        <span className="text-xs text-muted-foreground">Chain: {tx.fromChain}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{tx.toToken}</span>
                      {tx.toChain && (
                        <span className="text-xs text-muted-foreground">Chain: {tx.toChain}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{formatAmount(tx.fromAmount)}</span>
                      {tx.toAmount && tx.toAmount !== tx.fromAmount && (
                        <span className="text-xs text-muted-foreground">→ {formatAmount(tx.toAmount)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(tx.timestamp)}</span>
                  </TableCell>
                  <TableCell>
                    {tx.txHash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTransactionExplorer(tx.txHash!)}
                        className="text-neon-cyan hover:text-neon-cyan/80"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Persistent Connection Status */}
      <Card className="bg-gradient-card border-green-500/20">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-medium text-white">Wallet Connected</h4>
                <p className="text-sm text-muted-foreground">
                  {walletState.address ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}` : 'Unknown address'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                {walletState.network || 'Connected'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  disconnect();
                  toast({
                    title: "Wallet Disconnected",
                    description: "Successfully disconnected wallet",
                  });
                }}
                className="text-muted-foreground hover:text-red-500"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Access Section */}
      <Card className="bg-gradient-card border-neon-cyan/20">
        <div className="p-4">
          <h4 className="font-medium text-white mb-3">Quick Access</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("completed");
                setTypeFilter("all");
              }}
              className="border-green-500/30 text-green-500 hover:bg-green-500/10"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Show Completed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("bridge");
              }}
              className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
            >
              <Network className="w-4 h-4 mr-2" />
              Show Bridges
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              className="border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10"
            >
              <Activity className="w-4 h-4 mr-2" />
              Show All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TransactionHistory; 
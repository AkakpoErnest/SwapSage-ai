import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Activity,
  Network,
  Coins,
  WalletIcon
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import { transactionHistoryService } from "@/services/transactionHistory";
import { bridgeService } from "@/services/bridge/bridgeService";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: 'swap' | 'bridge';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChain?: number;
  toChain?: number;
  recipient: string;
  timestamp: number;
  txHash?: string;
  error?: string;
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalVolume: "0",
  });

  const { walletState } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      loadTransactionHistory();
    }
  }, [walletState.isConnected, walletState.address]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm]);

  const loadTransactionHistory = async () => {
    if (!walletState.address) return;

    try {
      setIsLoading(true);
      
      // Load swap transactions
      const swapTransactions = await transactionHistoryService.getTransactionHistory(walletState.address);
      
      // Load bridge transactions
      const bridgeTransactions = await bridgeService.getBridgeHistory(walletState.address);
      
      // Combine and format transactions
      const allTransactions: Transaction[] = [
        ...swapTransactions.map(tx => ({
          ...tx,
          type: 'swap' as const,
        })),
        ...bridgeTransactions.map(tx => ({
          id: tx.id,
          type: 'bridge' as const,
          status: tx.status,
          fromToken: tx.fromToken,
          toToken: tx.toToken,
          fromAmount: tx.fromAmount,
          toAmount: tx.toAmount,
          fromChain: tx.fromChain,
          toChain: tx.toChain,
          recipient: tx.recipient,
          timestamp: tx.timestamp,
          txHash: tx.txHash,
          error: tx.error,
        }))
      ];

      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(allTransactions);
      calculateStats(allTransactions);
      
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (txs: Transaction[]) => {
    const total = txs.length;
    const completed = txs.filter(tx => tx.status === 'completed').length;
    const pending = txs.filter(tx => tx.status === 'pending' || tx.status === 'processing').length;
    const failed = txs.filter(tx => tx.status === 'failed').length;
    
    const totalVolume = txs
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + parseFloat(tx.fromAmount), 0)
      .toFixed(2);

    setStats({ total, completed, pending, failed, totalVolume });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(searchLower) ||
        tx.fromToken.toLowerCase().includes(searchLower) ||
        tx.toToken.toLowerCase().includes(searchLower) ||
        tx.txHash?.toLowerCase().includes(searchLower) ||
        tx.recipient.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-neon-green" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-neon-green/20 text-neon-green border-neon-green/30';
      case 'processing':
        return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30';
      case 'failed':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bridge':
        return <Network className="w-4 h-4 text-neon-purple" />;
      case 'swap':
        return <Coins className="w-4 h-4 text-neon-cyan" />;
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
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank');
  };

  const exportHistory = async (format: 'json' | 'csv' = 'json') => {
    if (!walletState.address) return;

    try {
      const exportData = await transactionHistoryService.exportHistory(walletState.address, format);
      
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
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your on-chain transaction history
            </p>
            <Button 
              onClick={async () => {
                try {
                  const { connectEthereum } = useWalletContext();
                  await connectEthereum();
                } catch (error) {
                  console.error('Failed to connect wallet:', error);
                }
              }}
              className="bg-gradient-primary hover:bg-gradient-primary/80"
            >
              <WalletIcon className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Activity className="w-8 h-8 text-neon-cyan" />
            Transaction History
          </h2>
          <p className="text-muted-foreground">
            View and manage your swap and bridge transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => exportHistory('json')}
            variant="outline"
            className="border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-card border-neon-cyan/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-cyan">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-neon-green/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-green">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-neon-cyan/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-cyan">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-destructive/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-neon-purple/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-purple">${stats.totalVolume}</div>
            <div className="text-sm text-muted-foreground">Volume</div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50"
          />
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
    </div>
  );
};

export default TransactionHistory; 
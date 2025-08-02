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
  WalletIcon,
  RefreshCw,
  Shield,
  Key
} from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";

interface Transaction {
  id: string;
  type: 'swap' | 'bridge' | 'htlc' | 'refund' | 'claim';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChain: number;
  toChain: number;
  sender: string;
  recipient: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
  gasUsed?: string;
  gasPrice?: string;
  error?: string;
  secretPhrase?: string;
  hashlock?: string;
  timelock?: number;
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

  const { walletState } = useWalletContext();
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
    if (!walletState.address || !walletState.provider) return;

    try {
      setIsLoading(true);
      
      // Get current block number for recent transactions
      const currentBlock = await walletState.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last 10k blocks
      
      // Fetch on-chain transactions
      const onChainTransactions = await fetchOnChainTransactions(walletState.address, fromBlock, currentBlock);
      
      // Add HTLC transactions from local storage (for demo purposes)
      const htlcTransactions = getHTLCTransactions();
      
      // Combine all transactions
      const allTransactions: Transaction[] = [
        ...onChainTransactions,
        ...htlcTransactions
      ];
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(allTransactions);
      calculateStats(allTransactions);
      
      console.log(`📊 Loaded ${allTransactions.length} on-chain transactions`);
      
      if (allTransactions.length === 0) {
        toast({
          title: "No Transactions Found",
          description: "No on-chain transactions found for this address. Try making a swap first!",
        });
      }
      
    } catch (error) {
      console.error('Error loading transaction history:', error);
      toast({
        title: "Error",
        description: "Failed to load on-chain transaction history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOnChainTransactions = async (address: string, fromBlock: number, toBlock: number): Promise<Transaction[]> => {
    const transactions: Transaction[] = [];
    
    try {
      // Get transaction history from provider
      const history = await walletState.provider!.getHistory(address, fromBlock, toBlock);
      
      for (const tx of history) {
        try {
          const receipt = await tx.wait();
          const block = await walletState.provider!.getBlock(tx.blockNumber!);
          
          // Determine transaction type based on contract interaction
          const txType = determineTransactionType(tx, receipt);
          
          transactions.push({
            id: tx.hash,
            type: txType,
            status: receipt.status === 1 ? 'completed' : 'failed',
            fromToken: 'MATIC', // Default for Polygon
            toToken: 'Unknown',
            fromAmount: ethers.formatEther(tx.value || 0),
            toAmount: '0',
            fromChain: 137, // Polygon
            toChain: 137,
            sender: tx.from,
            recipient: tx.to || '',
            timestamp: block?.timestamp || Date.now(),
            txHash: tx.hash,
            blockNumber: tx.blockNumber!,
            gasUsed: receipt.gasUsed?.toString(),
            gasPrice: tx.gasPrice?.toString(),
            error: receipt.status === 0 ? 'Transaction failed' : undefined,
          });
        } catch (error) {
          console.error('Error processing transaction:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
    
    return transactions;
  };

  const determineTransactionType = (tx: any, receipt: any): 'swap' | 'bridge' | 'htlc' | 'refund' | 'claim' => {
    // Check for HTLC contract interactions
    const htlcContracts = [
      '0x0c06d83455d4033aC29aA0b8Fab00A10Bb0c85Bb', // Our HTLC contract
      '0x80e52B79961fEeB3096777AE0478B225A7Ae1c7e', // Our Oracle contract
    ];
    
    if (htlcContracts.includes(tx.to?.toLowerCase())) {
      // Check function signature to determine HTLC operation
      if (tx.data?.includes('initiateSwap')) return 'htlc';
      if (tx.data?.includes('withdraw')) return 'claim';
      if (tx.data?.includes('refund')) return 'refund';
      return 'bridge';
    }
    
    // Check for DEX interactions
    const dexContracts = [
      '0x1111111254fb6c44bAC0beD2854e76F90643097d', // 1inch router
      '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 router
    ];
    
    if (dexContracts.includes(tx.to?.toLowerCase())) {
      return 'swap';
    }
    
    return 'swap'; // Default
  };

  const getHTLCTransactions = (): Transaction[] => {
    // Get HTLC transactions from localStorage (for demo)
    const stored = localStorage.getItem('htlc_transactions');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing HTLC transactions:', error);
      }
    }
    return [];
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
        tx.recipient.toLowerCase().includes(searchLower) ||
        tx.type.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bridge':
        return <Network className="w-4 h-4 text-purple-500" />;
      case 'swap':
        return <Coins className="w-4 h-4 text-blue-500" />;
      case 'htlc':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'refund':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'claim':
        return <Key className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
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
    // Use PolygonScan for Polygon transactions
    window.open(`https://polygonscan.com/tx/${txHash}`, '_blank');
  };

  const exportHistory = async (format: 'json' | 'csv' = 'json') => {
    if (!walletState.address) return;

    try {
      let exportData: string;
      
      if (format === 'json') {
        exportData = JSON.stringify(transactions, null, 2);
      } else {
        // CSV format
        const headers = ['ID', 'Type', 'Status', 'From Token', 'To Token', 'From Amount', 'To Amount', 'From Chain', 'To Chain', 'Sender', 'Recipient', 'Timestamp', 'Tx Hash', 'Block Number', 'Secret Phrase'];
        const csvData = transactions.map(tx => [
          tx.id,
          tx.type,
          tx.status,
          tx.fromToken,
          tx.toToken,
          tx.fromAmount,
          tx.toAmount,
          tx.fromChain,
          tx.toChain,
          tx.sender,
          tx.recipient,
          new Date(tx.timestamp * 1000).toISOString(),
          tx.txHash,
          tx.blockNumber,
          tx.secretPhrase || ''
        ]);
        
        exportData = [headers, ...csvData].map(row => row.join(',')).join('\n');
      }
      
      const blob = new Blob([exportData], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onchain-transaction-history-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `On-chain transaction history exported as ${format.toUpperCase()}`,
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
            On-Chain Transaction History
          </h2>
          <p className="text-muted-foreground">
            View your real on-chain swap and bridge transactions from the blockchain
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadTransactionHistory}
            disabled={isLoading}
            variant="outline"
            className="border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
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
        <Card className="p-4 bg-gradient-card border-green-500/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-yellow-500/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-red-500/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-purple-500/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">${stats.totalVolume}</div>
            <div className="text-sm text-muted-foreground">Volume</div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search transactions by hash, token, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/50"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="bg-gradient-card border-neon-cyan/20">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading transaction history...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Try making a swap or bridge transaction first!
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
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <Badge variant="outline" className="capitalize">
                          {tx.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <Badge className={getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{tx.fromToken}</div>
                        <div className="text-muted-foreground">Chain {tx.fromChain}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{tx.toToken}</div>
                        <div className="text-muted-foreground">Chain {tx.toChain}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatAmount(tx.fromAmount)} {tx.fromToken}</div>
                        {tx.toAmount !== '0' && (
                          <div className="text-muted-foreground">
                            → {formatAmount(tx.toAmount)} {tx.toToken}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTransactionExplorer(tx.txHash)}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        {tx.secretPhrase && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(tx.secretPhrase!);
                              toast({
                                title: "Secret Phrase Copied",
                                description: "Secret phrase copied to clipboard",
                              });
                            }}
                          >
                            <Key className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TransactionHistory; 
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { transactionMonitor } from "@/services/transactionMonitor";
import { useWallet } from "@/hooks/useWallet";

interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  chain?: string;
  timestamp?: number;
}

interface TransactionProgressProps {
  transactionId?: string;
  swapType?: 'same-chain' | 'cross-chain';
}

const TransactionProgress = ({ transactionId, swapType = 'cross-chain' }: TransactionProgressProps) => {
  const [steps, setSteps] = useState<TransactionStep[]>([]);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [totalFee, setTotalFee] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { walletState } = useWallet();

  useEffect(() => {
    if (!walletState.isConnected) {
      setSteps([]);
      setIsLoading(false);
      return;
    }

    // Initialize steps based on swap type
    const initialSteps: TransactionStep[] = swapType === 'cross-chain' ? [
      {
        id: '1',
        title: 'Intent Created',
        description: 'Cross-chain swap intent created via 1inch Fusion+',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: '2',
        title: 'Funds Locked',
        description: 'Funds locked in HTLC on source chain',
        status: 'pending',
        chain: 'Ethereum'
      },
      {
        id: '3',
        title: 'Cross-Chain Bridge',
        description: 'Processing cross-chain transaction',
        status: 'pending'
      },
      {
        id: '4',
        title: 'Funds Released',
        description: 'Funds will be released on destination chain',
        status: 'pending'
      }
    ] : [
      {
        id: '1',
        title: 'Quote Received',
        description: 'Swap quote obtained from 1inch aggregation',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: '2',
        title: 'Transaction Submitted',
        description: 'Swap transaction submitted to blockchain',
        status: 'pending'
      },
      {
        id: '3',
        title: 'Transaction Confirmed',
        description: 'Waiting for blockchain confirmation',
        status: 'pending'
      },
      {
        id: '4',
        title: 'Swap Completed',
        description: 'Tokens successfully swapped',
        status: 'pending'
      }
    ];

    setSteps(initialSteps);
    setIsLoading(false);

    // Set up transaction monitoring
    const handleTransactionUpdate = (event: any) => {
      const { type, data } = event;
      
      if (type === 'swap_initiated') {
        updateStepStatus('1', 'completed');
        updateStepStatus('2', 'processing');
        setOverallStatus('processing');
        
        if (data.transaction) {
          updateStepData('2', {
            txHash: data.transaction.txHash,
            description: `Transaction submitted: ${data.transaction.fromToken} → ${data.transaction.toToken}`
          });
        }
      }
      
      if (type === 'swap_completed') {
        updateStepStatus('3', 'completed');
        updateStepStatus('4', 'completed');
        setOverallStatus('completed');
        
        if (data.transaction) {
          updateStepData('4', {
            txHash: data.transaction.txHash,
            description: `Swap completed successfully`
          });
        }
      }
      
      if (type === 'swap_failed') {
        updateStepStatus('3', 'failed');
        setOverallStatus('failed');
        
        if (data.transaction) {
          updateStepData('3', {
            description: `Transaction failed: ${data.transaction.error || 'Unknown error'}`
          });
        }
      }
      
      if (type === 'htlc_status_update') {
        if (data.swap) {
          if (data.swap.withdrawn) {
            updateStepStatus('3', 'completed');
            updateStepStatus('4', 'completed');
            setOverallStatus('completed');
          } else if (data.swap.refunded) {
            updateStepStatus('3', 'failed');
            setOverallStatus('failed');
          }
        }
      }
    };

    // Listen for transaction events
    transactionMonitor.on('*', handleTransactionUpdate);

    // Check existing transactions
    const existingTransactions = transactionMonitor.getAllTransactions();
    const pendingTransactions = transactionMonitor.getPendingTransactions();
    
    if (pendingTransactions.length > 0) {
      const latestTx = pendingTransactions[pendingTransactions.length - 1];
      updateStepStatus('1', 'completed');
      updateStepStatus('2', 'processing');
      setOverallStatus('processing');
      
      if (latestTx.txHash) {
        updateStepData('2', {
          txHash: latestTx.txHash,
          description: `Transaction in progress: ${latestTx.fromToken} → ${latestTx.toToken}`
        });
      }
    }

    // Estimate completion time and fees
    updateEstimates();

    return () => {
      transactionMonitor.off('*');
    };
  }, [walletState.isConnected, swapType]);

  const updateStepStatus = (stepId: string, status: 'pending' | 'processing' | 'completed' | 'failed') => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const updateStepData = (stepId: string, data: Partial<TransactionStep>) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, ...data } : step
      )
    );
  };

  const updateEstimates = async () => {
    try {
      // Get network info for estimates
      const networkInfo = await transactionMonitor.getNetworkInfo();
      
      if (networkInfo) {
        // Estimate completion time based on network
        const estimatedTime = networkInfo.chainId === 1 ? '~30 seconds' : '~2 minutes';
        setEstimatedTime(estimatedTime);
        
        // Estimate fees based on current gas prices
        const gasPrice = await transactionMonitor.estimateGasPrice();
        const estimatedFee = parseFloat(gasPrice) * 180000 / 1e18; // 180k gas limit
        setTotalFee(`$${estimatedFee.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error updating estimates:', error);
      setEstimatedTime('~2 minutes');
      setTotalFee('$2.84');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-neon-green" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-neon-cyan animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
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

  const getOverallStatusColor = (status: string) => {
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

  const getOverallStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'In Progress';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const openTransactionExplorer = (txHash: string) => {
    const networkInfo = transactionMonitor.getNetworkInfo();
    if (networkInfo && networkInfo.config?.explorerUrl) {
      window.open(`${networkInfo.config.explorerUrl}/tx/${txHash}`, '_blank');
    } else {
      // Fallback to Etherscan
      window.open(`https://etherscan.io/tx/${txHash}`, '_blank');
    }
  };

  if (!walletState.isConnected) {
    return (
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="text-center text-muted-foreground">
          Connect your wallet to view transaction progress
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading transaction data...</span>
        </div>
      </Card>
    );
  }

  if (steps.length === 0) {
    return (
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="text-center text-muted-foreground">
          No active transactions to monitor
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card border-neon-cyan/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transaction Progress</h3>
          <Badge variant="outline" className={getOverallStatusColor(overallStatus)}>
            {getOverallStatusText(overallStatus)}
          </Badge>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                {getStatusIcon(step.status)}
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-2 ${
                    step.status === 'completed' ? 'bg-neon-green' : 'bg-border'
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{step.title}</h4>
                  <Badge variant="outline" className={getStatusColor(step.status)}>
                    {step.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {step.txHash && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Tx:</span>
                    <code className="bg-space-gray px-2 py-1 rounded text-neon-cyan">
                      {step.txHash.slice(0, 8)}...{step.txHash.slice(-6)}
                    </code>
                    <button 
                      className="text-neon-cyan hover:text-neon-cyan/80"
                      onClick={() => openTransactionExplorer(step.txHash!)}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-3 bg-space-gray rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated completion:</span>
            <span className="text-foreground">{estimatedTime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total fee:</span>
            <span className="text-foreground">{totalFee}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TransactionProgress;
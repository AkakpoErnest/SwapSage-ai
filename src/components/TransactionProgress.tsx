import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ExternalLink, AlertCircle } from "lucide-react";

interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  chain?: string;
}

const TransactionProgress = () => {
  const steps: TransactionStep[] = [
    {
      id: '1',
      title: 'Intent Created',
      description: 'Cross-chain swap intent created via 1inch Fusion+',
      status: 'completed',
    },
    {
      id: '2', 
      title: 'Funds Locked',
      description: 'USDC locked in HTLC on Ethereum',
      status: 'completed',
      txHash: '0x1234...5678',
      chain: 'Ethereum'
    },
    {
      id: '3',
      title: 'Cross-Chain Bridge',
      description: 'Processing cross-chain transaction',
      status: 'processing',
    },
    {
      id: '4',
      title: 'Funds Released',
      description: 'XLM will be released on Stellar',
      status: 'pending',
    }
  ];

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

  return (
    <Card className="p-6 bg-gradient-card border-neon-cyan/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transaction Progress</h3>
          <Badge variant="outline" className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">
            In Progress
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
                      {step.txHash}
                    </code>
                    <button className="text-neon-cyan hover:text-neon-cyan/80">
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
            <span className="text-foreground">~2 minutes remaining</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total fee:</span>
            <span className="text-foreground">$2.84</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TransactionProgress;
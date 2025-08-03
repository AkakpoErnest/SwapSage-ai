import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Network,
  Coins,
  Shield,
  Zap,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BridgeProcess {
  id: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'initiating' | 'pending' | 'processing' | 'confirming' | 'completed' | 'failed';
  steps: BridgeStep[];
  txHash?: string;
  startTime: number;
  estimatedTime: number;
  recipient: string;
}

interface BridgeStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
  timestamp?: number;
  txHash?: string;
  error?: string;
}

interface BridgeProcessTrackerProps {
  activeProcesses: BridgeProcess[];
  onProcessUpdate: (processId: string, updates: Partial<BridgeProcess>) => void;
}

const BridgeProcessTracker = ({ activeProcesses, onProcessUpdate }: BridgeProcessTrackerProps) => {
  const { toast } = useToast();

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getProgressPercentage = (steps: BridgeStep[]) => {
    const completed = steps.filter(step => step.status === 'completed').length;
    return (completed / steps.length) * 100;
  };

  const getEstimatedTimeRemaining = (process: BridgeProcess) => {
    const elapsed = Date.now() - process.startTime;
    const remaining = process.estimatedTime - elapsed;
    return Math.max(0, remaining);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const openTransactionExplorer = (txHash: string, chain: string) => {
    let url = '';
    if (chain === 'polygon') {
      url = `https://polygonscan.com/tx/${txHash}`;
    } else if (chain === 'ethereum') {
      url = `https://etherscan.io/tx/${txHash}`;
    } else if (chain === 'stellar') {
              url = `https://stellar.expert/explorer/public/tx/${txHash}`;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (activeProcesses.length === 0) {
    return (
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
            <Network className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Bridge Process Tracker</h3>
            <p className="text-muted-foreground">
              No active bridge processes. Start a bridge transaction to see real-time tracking.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🔄 Active Bridge Processes</h3>
        <Badge variant="secondary">{activeProcesses.length} Active</Badge>
      </div>

      {activeProcesses.map((process) => (
        <Card key={process.id} className="p-4 bg-gradient-card border-neon-purple/20">
          <div className="space-y-4">
            {/* Process Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{process.fromToken}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{process.toToken}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    process.status === 'completed' ? 'text-green-500 border-green-500/30' :
                    process.status === 'failed' ? 'text-red-500 border-red-500/30' :
                    'text-blue-500 border-blue-500/30'
                  }
                >
                  {process.status.charAt(0).toUpperCase() + process.status.slice(1)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(getEstimatedTimeRemaining(process))} remaining
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-white">{Math.round(getProgressPercentage(process.steps))}%</span>
              </div>
              <Progress value={getProgressPercentage(process.steps)} className="h-2" />
            </div>

            {/* Bridge Steps */}
            <div className="space-y-3">
              {process.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    step.status === 'completed' ? 'bg-green-500/20' :
                    step.status === 'processing' ? 'bg-blue-500/20' :
                    step.status === 'failed' ? 'bg-red-500/20' :
                    'bg-muted/20'
                  }`}>
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getStepColor(step.status)}`}>
                        {step.name}
                      </span>
                      {step.txHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTransactionExplorer(step.txHash!, process.fromChain)}
                          className="text-neon-cyan hover:text-neon-cyan/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {step.error && (
                      <p className="text-xs text-red-500 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Process Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted/20">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-sm font-medium text-white">
                  {process.fromAmount} {process.fromToken} → {process.toAmount} {process.toToken}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chains</p>
                <p className="text-sm font-medium text-white">
                  {process.fromChain} → {process.toChain}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BridgeProcessTracker; 
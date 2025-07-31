export interface Chain {
  id: number;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  status: 'live' | 'testnet' | 'coming-soon';
}

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  chainId: number;
}

export interface BridgeRequest {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  bridgeFee: string;
  estimatedTime: number;
}

export interface BridgeQuote {
  estimatedTime: number;
  bridgeFee: string;
  gasFee: string;
  totalFee: string;
  minAmount: string;
  maxAmount: string;
}

export interface BridgeStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  recipient: string;
  timestamp: number;
  txHash?: string;
  estimatedTime?: number;
  updatedAt?: number;
  error?: string;
}

export interface BridgeStats {
  totalBridges: number;
  completedBridges: number;
  pendingBridges: number;
  totalVolume: string;
  averageTime: number;
}

export interface BridgeFilter {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  fromChain?: number;
  toChain?: number;
  fromToken?: string;
  toToken?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: string;
  maxAmount?: string;
}

export interface BridgeExportOptions {
  format: 'json' | 'csv';
  includeDetails?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
} 
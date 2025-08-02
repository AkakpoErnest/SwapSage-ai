// Smart contract types for SwapSage AI

export interface SwapSageHTLC {
  address: string;
  initiator: string;
  recipient: string;
  token: string;
  amount: string;
  hashlock: string;
  timelock: number;
  withdrawn: boolean;
  refunded: boolean;
  secret: string;
}

export interface PriceFeed {
  aggregator: string;
  decimals: number;
  description: string;
  isActive: boolean;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fee: string;
  slippage: number;
  estimatedGas: string;
  route?: any[];
  priceImpact?: number;
}

export interface SwapExecution {
  fromToken: string;
  toToken: string;
  amount: string;
  minReturnAmount: string;
  data: string;
  value?: string;
}

export interface ContractAddresses {
  htlc: string;
  oracle: string;
  executor: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: ContractAddresses;
}

export interface SwapRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  slippage: number;
  deadline: number;
}

export interface CrossChainSwapRequest extends SwapRequest {
  fromChain: number;
  toChain: number;
  bridgeFee: string;
  estimatedTime: number;
}

export interface SwapStatus {
  id: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'refunded' | 'confirmed' | 'dropped';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  timestamp: number;
  txHash?: string;
  error?: string;
  confirmations?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export interface OraclePrice {
  token: string;
  price: string;
  timestamp: number;
  decimals: number;
}

export interface HTLCSwap {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  hashlock: string;
  timelock: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  secret: string;
  txHash: string;
  createdAt: number;
} 
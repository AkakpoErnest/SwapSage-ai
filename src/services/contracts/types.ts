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
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'refunded';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  timestamp: number;
  txHash?: string;
  error?: string;
}

export interface OraclePrice {
  token: string;
  price: string;
  timestamp: number;
  decimals: number;
}

export interface HTLCSwap {
  swapId: string;
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
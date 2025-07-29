import { BrowserProvider, Contract, ContractTransaction, keccak256, toUtf8Bytes, randomBytes } from 'ethers';
import type { 
  SwapSageHTLC, 
  SwapQuote, 
  SwapExecution, 
  OraclePrice,
  HTLCSwap,
  NetworkConfig 
} from './types';

// Contract ABIs (simplified for demo - would be generated from actual contracts)
const HTLC_ABI = [
  'function initiateSwap(address recipient, address token, uint256 amount, bytes32 hashlock, uint256 timelock) external payable',
  'function withdraw(bytes32 swapId, string secret) external',
  'function refund(bytes32 swapId) external',
  'function getSwap(bytes32 swapId) external view returns (address, address, address, uint256, bytes32, uint256, bool, bool, string)',
  'function calculateSwapId(address, address, address, uint256, bytes32, uint256) external pure returns (bytes32)',
  'event SwapInitiated(bytes32 indexed swapId, address indexed initiator, address indexed recipient, address token, uint256 amount, bytes32 hashlock, uint256 timelock)',
  'event SwapWithdrawn(bytes32 indexed swapId, string secret)',
  'event SwapRefunded(bytes32 indexed swapId)'
];

const ORACLE_ABI = [
  'function getLatestPrice(address token) external view returns (uint256 price, uint256 timestamp)',
  'function getExchangeRate(address tokenA, address tokenB) external view returns (uint256 rate)',
  'function isTokenSupported(address token) external view returns (bool)'
];

const EXECUTOR_ABI = [
  'function executeSwap(address fromToken, address toToken, uint256 amount, uint256 minReturnAmount, bytes calldata data) external payable',
  'function getSwapQuote(address fromToken, address toToken, uint256 amount) external view returns (uint256 estimatedReturn, uint256 fee)',
  'function calculateMinReturn(uint256 expectedAmount) external view returns (uint256)',
  'event SwapExecuted(address indexed user, address indexed fromToken, address indexed toToken, uint256 fromAmount, uint256 toAmount, uint256 fee)'
];

class ContractService {
  private provider: BrowserProvider | null = null;
  private signer: any = null;
  private htlcContract: Contract | null = null;
  private oracleContract: Contract | null = null;
  private executorContract: Contract | null = null;

  constructor() {}

  async initialize(provider: BrowserProvider, networkConfig: NetworkConfig) {
    this.provider = provider;
    this.signer = await provider.getSigner();
    
    // Initialize contracts
    this.htlcContract = new Contract(
      networkConfig.contracts.htlc,
      HTLC_ABI,
      this.signer
    );
    
    this.oracleContract = new Contract(
      networkConfig.contracts.oracle,
      ORACLE_ABI,
      this.signer
    );
    
    this.executorContract = new Contract(
      networkConfig.contracts.executor,
      EXECUTOR_ABI,
      this.signer
    );
  }

  // HTLC Functions
  async initiateHTLCSwap(
    recipient: string,
    token: string,
    amount: string,
    hashlock: string,
    timelock: number,
    value?: string
  ): Promise<ContractTransaction> {
    if (!this.htlcContract) throw new Error('Contract not initialized');
    
    const overrides = value ? { value } : {};
    
    return await this.htlcContract.initiateSwap(
      recipient,
      token,
      amount,
      hashlock,
      timelock,
      overrides
    );
  }

  async withdrawHTLCSwap(swapId: string, secret: string): Promise<ContractTransaction> {
    if (!this.htlcContract) throw new Error('Contract not initialized');
    
    return await this.htlcContract.withdraw(swapId, secret);
  }

  async refundHTLCSwap(swapId: string): Promise<ContractTransaction> {
    if (!this.htlcContract) throw new Error('Contract not initialized');
    
    return await this.htlcContract.refund(swapId);
  }

  async getHTLCSwap(swapId: string): Promise<HTLCSwap> {
    if (!this.htlcContract) throw new Error('Contract not initialized');
    
    const swap = await this.htlcContract.getSwap(swapId);
    
    return {
      swapId,
      initiator: swap[0],
      recipient: swap[1],
      token: swap[2],
      amount: swap[3].toString(),
      hashlock: swap[4],
      timelock: swap[5].toNumber(),
      withdrawn: swap[6],
      refunded: swap[7],
      secret: swap[8]
    };
  }

  async calculateSwapId(
    initiator: string,
    recipient: string,
    token: string,
    amount: string,
    hashlock: string,
    timelock: number
  ): Promise<string> {
    if (!this.htlcContract) throw new Error('Contract not initialized');
    
    return await this.htlcContract.calculateSwapId(
      initiator,
      recipient,
      token,
      amount,
      hashlock,
      timelock
    );
  }

  // Oracle Functions
  async getLatestPrice(token: string): Promise<OraclePrice> {
    if (!this.oracleContract) throw new Error('Contract not initialized');
    
    const [price, timestamp] = await this.oracleContract.getLatestPrice(token);
    
    return {
      token,
      price: price.toString(),
      timestamp: timestamp.toNumber(),
      decimals: 8
    };
  }

  async getExchangeRate(tokenA: string, tokenB: string): Promise<string> {
    if (!this.oracleContract) throw new Error('Contract not initialized');
    
    const rate = await this.oracleContract.getExchangeRate(tokenA, tokenB);
    return rate.toString();
  }

  async isTokenSupported(token: string): Promise<boolean> {
    if (!this.oracleContract) throw new Error('Contract not initialized');
    
    return await this.oracleContract.isTokenSupported(token);
  }

  // Executor Functions
  async executeSwap(swapExecution: SwapExecution): Promise<ContractTransaction> {
    if (!this.executorContract) throw new Error('Contract not initialized');
    
    const overrides = swapExecution.value ? { value: swapExecution.value } : {};
    
    return await this.executorContract.executeSwap(
      swapExecution.fromToken,
      swapExecution.toToken,
      swapExecution.amount,
      swapExecution.minReturnAmount,
      swapExecution.data,
      overrides
    );
  }

  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<SwapQuote> {
    if (!this.executorContract) throw new Error('Contract not initialized');
    
    const [estimatedReturn, fee] = await this.executorContract.getSwapQuote(
      fromToken,
      toToken,
      amount
    );
    
    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: estimatedReturn.toString(),
      fee: fee.toString(),
      slippage: 0.5, // Default 0.5%
      estimatedGas: '180000' // Default estimate
    };
  }

  async calculateMinReturn(expectedAmount: string): Promise<string> {
    if (!this.executorContract) throw new Error('Contract not initialized');
    
    const minReturn = await this.executorContract.calculateMinReturn(expectedAmount);
    return minReturn.toString();
  }

  // Utility Functions
  generateHashlock(secret: string): string {
    return keccak256(toUtf8Bytes(secret));
  }

  generateSecret(): string {
    return Array.from(randomBytes(32)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  calculateTimelock(hours: number): number {
    return Math.floor(Date.now() / 1000) + (hours * 3600);
  }

  // Event Listeners
  onSwapInitiated(callback: (swapId: string, initiator: string, recipient: string, token: string, amount: string, hashlock: string, timelock: number) => void) {
    if (!this.htlcContract) throw new Error('Contract not initialized');
    
    this.htlcContract.on('SwapInitiated', callback);
  }

  onSwapWithdrawn(callback: (swapId: string, secret: string) => void) {
    if (!this.htlcContract) throw new Error('Contract not initialized');
    
    this.htlcContract.on('SwapWithdrawn', callback);
  }

  onSwapExecuted(callback: (user: string, fromToken: string, toToken: string, fromAmount: string, toAmount: string, fee: string) => void) {
    if (!this.executorContract) throw new Error('Contract not initialized');
    
    this.executorContract.on('SwapExecuted', callback);
  }

  // Cleanup
  removeAllListeners() {
    if (this.htlcContract) {
      this.htlcContract.removeAllListeners();
    }
    if (this.oracleContract) {
      this.oracleContract.removeAllListeners();
    }
    if (this.executorContract) {
      this.executorContract.removeAllListeners();
    }
  }
}

export const contractService = new ContractService(); 
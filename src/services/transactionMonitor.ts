import { ethers } from 'ethers';
import type { SwapStatus, HTLCSwap, NetworkConfig } from './contracts/types';
import { contractService } from './contracts/contractService';

export interface TransactionEvent {
  type: 'swap_initiated' | 'swap_completed' | 'swap_failed' | 'price_update' | 'network_change' | 'htlc_status_update';
  data: any;
  timestamp: number;
}

class TransactionMonitor {
  private provider: ethers.BrowserProvider | null = null;
  private transactions: Map<string, SwapStatus> = new Map();
  private htlcSwaps: Map<string, HTLCSwap> = new Map();
  private listeners: Map<string, (event: TransactionEvent) => void> = new Map();
  private isMonitoring = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private htlcPollingInterval: NodeJS.Timeout | null = null;
  private networkConfig: NetworkConfig | null = null;

  constructor() {}

  async initialize(provider: ethers.BrowserProvider, networkConfig: NetworkConfig) {
    this.provider = provider;
    this.networkConfig = networkConfig;
    
    // Initialize contract service
    await contractService.initialize(provider, networkConfig);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start monitoring
    this.startMonitoring();
  }

  private setupEventListeners() {
    // Listen for HTLC events
    contractService.onSwapInitiated((swapId, initiator, recipient, token, amount, hashlock, timelock) => {
      this.emitEvent('swap_initiated', {
        swapId,
        initiator,
        recipient,
        token,
        amount,
        hashlock,
        timelock
      });
    });

    contractService.onSwapWithdrawn((swapId, secret) => {
      this.emitEvent('swap_completed', {
        swapId,
        secret,
        type: 'htlc_withdrawn'
      });
    });

    contractService.onSwapExecuted((user, fromToken, toToken, fromAmount, toAmount, fee) => {
      this.emitEvent('swap_completed', {
        user,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        fee,
        type: 'swap_executed'
      });
    });
  }

  private startMonitoring() {
    if (this.isMonitoring || !this.provider) return;
    
    this.isMonitoring = true;
    
    // Monitor regular transactions
    this.pollingInterval = setInterval(() => {
      this.checkTransactionStatus();
    }, 5000); // Check every 5 seconds
    
    // Monitor HTLC swaps
    this.htlcPollingInterval = setInterval(() => {
      this.checkHTLCStatus();
    }, 10000); // Check every 10 seconds
  }

  private stopMonitoring() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.htlcPollingInterval) {
      clearInterval(this.htlcPollingInterval);
      this.htlcPollingInterval = null;
    }
    
    this.isMonitoring = false;
  }

  async addTransaction(txHash: string, swapDetails: Partial<SwapStatus>) {
    const transaction: SwapStatus = {
      id: txHash,
      status: 'pending',
      fromToken: swapDetails.fromToken || '',
      toToken: swapDetails.toToken || '',
      fromAmount: swapDetails.fromAmount || '',
      toAmount: swapDetails.toAmount || '',
      timestamp: Date.now(),
      txHash,
      ...swapDetails
    };

    this.transactions.set(txHash, transaction);
    this.emitEvent('swap_initiated', { transaction });
  }

  async addHTLCSwap(swapId: string, swap: HTLCSwap) {
    this.htlcSwaps.set(swapId, swap);
    this.emitEvent('swap_initiated', { swapId, swap, type: 'htlc' });
  }

  async checkTransactionStatus() {
    if (!this.provider) return;

    for (const [txHash, transaction] of this.transactions) {
      if (transaction.status === 'pending' || transaction.status === 'executing') {
        try {
          const receipt = await this.provider.getTransactionReceipt(txHash);
          
          if (receipt) {
            if (receipt.status === 1) {
              // Transaction successful
              transaction.status = 'completed';
              transaction.txHash = txHash;
              transaction.confirmations = receipt.confirmations;
              transaction.gasUsed = receipt.gasUsed?.toString();
              transaction.effectiveGasPrice = receipt.gasPrice?.toString();
              
              this.emitEvent('swap_completed', { transaction, receipt });
            } else {
              // Transaction failed
              transaction.status = 'failed';
              transaction.error = 'Transaction reverted';
              transaction.txHash = txHash;
              
              this.emitEvent('swap_failed', { transaction, receipt });
            }
          } else {
            // Transaction still pending, check confirmations
            const tx = await this.provider.getTransaction(txHash);
            if (tx && tx.blockNumber) {
              const currentBlock = await this.provider.getBlockNumber();
              const confirmations = currentBlock - tx.blockNumber;
              transaction.confirmations = confirmations;
              
              if (confirmations >= 12) { // Consider confirmed after 12 blocks
                transaction.status = 'confirmed';
                this.emitEvent('swap_completed', { transaction, confirmations });
              }
            }
          }
        } catch (error) {
          console.error(`Error checking transaction ${txHash}:`, error);
          
          // If transaction not found, it might have been dropped
          if (error instanceof Error && error.message.includes('not found')) {
            transaction.status = 'dropped';
            transaction.error = 'Transaction dropped from mempool';
            this.emitEvent('swap_failed', { transaction, error: error.message });
          }
        }
      }
    }
  }

  async checkHTLCStatus() {
    if (!this.provider) return;

    for (const [swapId, swap] of this.htlcSwaps) {
      try {
        // Get current swap status from contract
        const currentSwap = await contractService.getHTLCSwap(swapId);
        
        // Update local state
        this.htlcSwaps.set(swapId, currentSwap);
        
        // Check for status changes
        if (currentSwap.withdrawn && !swap.withdrawn) {
          this.emitEvent('swap_completed', { 
            swapId, 
            swap: currentSwap,
            type: 'htlc_withdrawn'
          });
        } else if (currentSwap.refunded && !swap.refunded) {
          this.emitEvent('swap_failed', { 
            swapId, 
            swap: currentSwap,
            reason: 'HTLC refunded',
            type: 'htlc_refunded'
          });
        } else {
          // Check if timelock expired
          const timeElapsed = Date.now() - (currentSwap.timelock * 1000);
          if (timeElapsed > 0 && !currentSwap.withdrawn && !currentSwap.refunded) {
            this.emitEvent('htlc_status_update', { 
              swapId, 
              swap: currentSwap,
              warning: 'Timelock expired, swap can be refunded'
            });
          }
        }
      } catch (error) {
        console.error(`Error checking HTLC swap ${swapId}:`, error);
      }
    }
  }

  async monitorHTLCSwap(swapId: string, swap: HTLCSwap) {
    // Add to monitoring
    this.htlcSwaps.set(swapId, swap);
    
    // Check status immediately
    await this.checkHTLCStatus();
  }

  async executeSwapWithContract(swapExecution: any): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    try {
      // Execute swap through contract
      const tx = await contractService.executeSwap(swapExecution);
      
      // Get transaction hash - in ethers v6, we need to wait for the transaction
      const receipt = await tx.wait();
      const txHash = receipt?.hash || '';
      
      // Add to monitoring
      await this.addTransaction(txHash, {
        fromToken: swapExecution.fromToken,
        toToken: swapExecution.toToken,
        fromAmount: swapExecution.amount,
        toAmount: swapExecution.minReturnAmount,
        status: 'executing'
      });
      
      return txHash;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  async initiateHTLCSwap(
    recipient: string,
    token: string,
    amount: string,
    hashlock: string,
    timelock: number,
    value?: string
  ): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    try {
      // Initiate HTLC swap through contract
      const tx = await contractService.initiateHTLCSwap(
        recipient,
        token,
        amount,
        hashlock,
        timelock,
        value
      );
      
      // Calculate swap ID
      const signer = await this.provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      const swapId = await contractService.calculateSwapId(
        signerAddress,
        recipient,
        token,
        amount,
        hashlock,
        timelock
      );
      
      // Add to monitoring
      const swap: HTLCSwap = {
        swapId,
        initiator: signerAddress,
        recipient,
        token,
        amount,
        hashlock,
        timelock,
        withdrawn: false,
        refunded: false,
        secret: ''
      };
      
      await this.addHTLCSwap(swapId, swap);
      
      // Get transaction hash from receipt
      const receipt = await tx.wait();
      return receipt?.hash || '';
    } catch (error) {
      console.error('Error initiating HTLC swap:', error);
      throw error;
    }
  }

  async withdrawHTLCSwap(swapId: string, secret: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    try {
      const tx = await contractService.withdrawHTLCSwap(swapId, secret);
      
      // Update local state
      const swap = this.htlcSwaps.get(swapId);
      if (swap) {
        swap.withdrawn = true;
        swap.secret = secret;
        this.htlcSwaps.set(swapId, swap);
      }
      
      const receipt = await tx.wait();
      return receipt?.hash || '';
    } catch (error) {
      console.error('Error withdrawing HTLC swap:', error);
      throw error;
    }
  }

  async refundHTLCSwap(swapId: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    try {
      const tx = await contractService.refundHTLCSwap(swapId);
      
      // Update local state
      const swap = this.htlcSwaps.get(swapId);
      if (swap) {
        swap.refunded = true;
        this.htlcSwaps.set(swapId, swap);
      }
      
      const receipt = await tx.wait();
      return receipt?.hash || '';
    } catch (error) {
      console.error('Error refunding HTLC swap:', error);
      throw error;
    }
  }

  getTransaction(txHash: string): SwapStatus | undefined {
    return this.transactions.get(txHash);
  }

  getHTLCSwap(swapId: string): HTLCSwap | undefined {
    return this.htlcSwaps.get(swapId);
  }

  getAllTransactions(): SwapStatus[] {
    return Array.from(this.transactions.values());
  }

  getAllHTLCSwaps(): HTLCSwap[] {
    return Array.from(this.htlcSwaps.values());
  }

  getPendingTransactions(): SwapStatus[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'pending' || tx.status === 'executing');
  }

  getPendingHTLCSwaps(): HTLCSwap[] {
    return Array.from(this.htlcSwaps.values())
      .filter(swap => !swap.withdrawn && !swap.refunded);
  }

  // Event system
  on(event: string, callback: (event: TransactionEvent) => void) {
    this.listeners.set(event, callback);
  }

  off(event: string) {
    this.listeners.delete(event);
  }

  private emitEvent(type: string, data: any) {
    const event: TransactionEvent = {
      type: type as any,
      data,
      timestamp: Date.now()
    };

    // Emit to specific listeners
    const listener = this.listeners.get(type);
    if (listener) {
      listener(event);
    }

    // Emit to general listeners
    const generalListener = this.listeners.get('*');
    if (generalListener) {
      generalListener(event);
    }
  }

  // Utility methods
  async estimateGasPrice(): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice?.toString() || '0';
  }

  async getNetworkInfo() {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    
    return {
      chainId: network.chainId,
      name: network.name,
      blockNumber: blockNumber.toString(),
      config: this.networkConfig
    };
  }

  async getLatestPrices(tokens: string[]): Promise<any[]> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const prices = [];
    for (const token of tokens) {
      try {
        const price = await contractService.getLatestPrice(token);
        prices.push(price);
      } catch (error) {
        console.error(`Error getting price for ${token}:`, error);
      }
    }
    
    return prices;
  }

  // Cleanup
  destroy() {
    this.stopMonitoring();
    this.transactions.clear();
    this.htlcSwaps.clear();
    this.listeners.clear();
    contractService.removeAllListeners();
  }
}

export const transactionMonitor = new TransactionMonitor(); 
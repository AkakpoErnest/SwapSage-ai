import { ethers } from 'ethers';
import type { SwapStatus, HTLCSwap } from './contracts/types';

export interface TransactionEvent {
  type: 'swap_initiated' | 'swap_completed' | 'swap_failed' | 'price_update' | 'network_change';
  data: any;
  timestamp: number;
}

class TransactionMonitor {
  private provider: ethers.BrowserProvider | null = null;
  private transactions: Map<string, SwapStatus> = new Map();
  private listeners: Map<string, (event: TransactionEvent) => void> = new Map();
  private isMonitoring = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {}

  initialize(provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.startMonitoring();
  }

  private startMonitoring() {
    if (this.isMonitoring || !this.provider) return;
    
    this.isMonitoring = true;
    this.pollingInterval = setInterval(() => {
      this.checkTransactionStatus();
    }, 5000); // Check every 5 seconds
  }

  private stopMonitoring() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
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
              this.emitEvent('swap_completed', { transaction, receipt });
            } else {
              // Transaction failed
              transaction.status = 'failed';
              transaction.error = 'Transaction reverted';
              this.emitEvent('swap_failed', { transaction, receipt });
            }
          }
        } catch (error) {
          console.error(`Error checking transaction ${txHash}:`, error);
        }
      }
    }
  }

  async monitorHTLCSwap(swapId: string, swap: HTLCSwap) {
    // Monitor HTLC swap status
    const checkHTLCStatus = async () => {
      try {
        // In real implementation, this would call the contract
        // const swapStatus = await contractService.getHTLCSwap(swapId);
        
        // For demo, simulate status changes
        const timeElapsed = Date.now() - (swap.timelock * 1000);
        if (timeElapsed > 0 && !swap.withdrawn && !swap.refunded) {
          // Timelock expired
          this.emitEvent('swap_failed', { 
            swapId, 
            reason: 'Timelock expired',
            swap 
          });
        }
      } catch (error) {
        console.error(`Error monitoring HTLC swap ${swapId}:`, error);
      }
    };

    // Check immediately and then every 30 seconds
    await checkHTLCStatus();
    setInterval(checkHTLCStatus, 30000);
  }

  getTransaction(txHash: string): SwapStatus | undefined {
    return this.transactions.get(txHash);
  }

  getAllTransactions(): SwapStatus[] {
    return Array.from(this.transactions.values());
  }

  getPendingTransactions(): SwapStatus[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'pending' || tx.status === 'executing');
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
      blockNumber: blockNumber.toString()
    };
  }

  // Cleanup
  destroy() {
    this.stopMonitoring();
    this.transactions.clear();
    this.listeners.clear();
  }
}

export const transactionMonitor = new TransactionMonitor(); 
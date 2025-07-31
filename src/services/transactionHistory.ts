import { ethers } from 'ethers';

interface Transaction {
  id: string;
  type: 'swap' | 'bridge';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChain?: number;
  toChain?: number;
  recipient: string;
  timestamp: number;
  txHash?: string;
  gasUsed?: string;
  gasPrice?: string;
  fee?: string;
  error?: string;
}

interface TransactionFilter {
  type?: 'swap' | 'bridge' | 'all';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'all';
  fromChain?: number;
  toChain?: number;
  fromToken?: string;
  toToken?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: string;
  maxAmount?: string;
}

class TransactionHistoryService {
  private readonly STORAGE_KEY = 'swapsage_transactions';

  // Save transaction to localStorage
  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const existingTransactions = this.getStoredTransactions();
      existingTransactions.push(transaction);
      
      // Keep only last 1000 transactions to prevent storage bloat
      if (existingTransactions.length > 1000) {
        existingTransactions.splice(0, existingTransactions.length - 1000);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingTransactions));
    } catch (error) {
      console.error('Failed to save transaction:', error);
      throw new Error('Failed to save transaction to storage');
    }
  }

  // Get transaction history for an address
  async getTransactionHistory(address: string, filters?: TransactionFilter): Promise<Transaction[]> {
    try {
      const allTransactions = this.getStoredTransactions();
      let filteredTransactions = allTransactions.filter(tx => tx.recipient === address);

      if (filters) {
        filteredTransactions = this.applyFilters(filteredTransactions, filters);
      }

      // Sort by timestamp (newest first)
      return filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  // Get transaction by ID
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const transactions = this.getStoredTransactions();
      return transactions.find(tx => tx.id === id) || null;
    } catch (error) {
      console.error('Failed to get transaction by ID:', error);
      return null;
    }
  }

  // Update transaction status
  async updateTransactionStatus(id: string, status: Transaction['status'], additionalData?: Partial<Transaction>): Promise<void> {
    try {
      const transactions = this.getStoredTransactions();
      const transactionIndex = transactions.findIndex(tx => tx.id === id);
      
      if (transactionIndex !== -1) {
        transactions[transactionIndex] = {
          ...transactions[transactionIndex],
          status,
          ...additionalData,
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      throw new Error('Failed to update transaction status');
    }
  }

  // Export transaction history
  async exportHistory(address: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const transactions = await this.getTransactionHistory(address);
      
      if (format === 'csv') {
        return this.convertToCSV(transactions);
      } else {
        return JSON.stringify(transactions, null, 2);
      }
    } catch (error) {
      console.error('Failed to export history:', error);
      throw new Error('Failed to export transaction history');
    }
  }

  // Get transaction statistics
  async getTransactionStats(address: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalVolume: string;
    averageGasUsed: string;
    totalFees: string;
  }> {
    try {
      const transactions = await this.getTransactionHistory(address);
      
      const total = transactions.length;
      const completed = transactions.filter(tx => tx.status === 'completed').length;
      const pending = transactions.filter(tx => tx.status === 'pending' || tx.status === 'processing').length;
      const failed = transactions.filter(tx => tx.status === 'failed').length;
      
      const totalVolume = transactions
        .filter(tx => tx.status === 'completed')
        .reduce((sum, tx) => sum + parseFloat(tx.fromAmount), 0)
        .toFixed(2);

      const completedWithGas = transactions.filter(tx => tx.status === 'completed' && tx.gasUsed);
      const averageGasUsed = completedWithGas.length > 0
        ? (completedWithGas.reduce((sum, tx) => sum + parseFloat(tx.gasUsed || '0'), 0) / completedWithGas.length).toFixed(0)
        : '0';

      const totalFees = transactions
        .filter(tx => tx.fee)
        .reduce((sum, tx) => sum + parseFloat(tx.fee || '0'), 0)
        .toFixed(6);

      return {
        total,
        completed,
        pending,
        failed,
        totalVolume,
        averageGasUsed,
        totalFees,
      };
    } catch (error) {
      console.error('Failed to get transaction stats:', error);
      return {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        totalVolume: '0',
        averageGasUsed: '0',
        totalFees: '0',
      };
    }
  }

  // Clear transaction history for an address
  async clearHistory(address: string): Promise<void> {
    try {
      const allTransactions = this.getStoredTransactions();
      const filteredTransactions = allTransactions.filter(tx => tx.recipient !== address);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTransactions));
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw new Error('Failed to clear transaction history');
    }
  }

  // Get recent transactions (last 24 hours)
  async getRecentTransactions(address: string, hours: number = 24): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactionHistory(address);
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      return transactions.filter(tx => tx.timestamp >= cutoffTime);
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  // Search transactions
  async searchTransactions(address: string, query: string): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactionHistory(address);
      const searchLower = query.toLowerCase();
      
      return transactions.filter(tx => 
        tx.id.toLowerCase().includes(searchLower) ||
        tx.fromToken.toLowerCase().includes(searchLower) ||
        tx.toToken.toLowerCase().includes(searchLower) ||
        tx.txHash?.toLowerCase().includes(searchLower) ||
        tx.recipient.toLowerCase().includes(searchLower) ||
        tx.error?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Failed to search transactions:', error);
      return [];
    }
  }

  // Get transactions by type
  async getTransactionsByType(address: string, type: 'swap' | 'bridge'): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactionHistory(address);
      return transactions.filter(tx => tx.type === type);
    } catch (error) {
      console.error('Failed to get transactions by type:', error);
      return [];
    }
  }

  // Get transactions by status
  async getTransactionsByStatus(address: string, status: Transaction['status']): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactionHistory(address);
      return transactions.filter(tx => tx.status === status);
    } catch (error) {
      console.error('Failed to get transactions by status:', error);
      return [];
    }
  }

  // Private helper methods
  private getStoredTransactions(): Transaction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored transactions:', error);
      return [];
    }
  }

  private applyFilters(transactions: Transaction[], filters: TransactionFilter): Transaction[] {
    let filtered = [...transactions];

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    if (filters.fromChain) {
      filtered = filtered.filter(tx => tx.fromChain === filters.fromChain);
    }

    if (filters.toChain) {
      filtered = filtered.filter(tx => tx.toChain === filters.toChain);
    }

    if (filters.fromToken) {
      filtered = filtered.filter(tx => 
        tx.fromToken.toLowerCase().includes(filters.fromToken!.toLowerCase())
      );
    }

    if (filters.toToken) {
      filtered = filtered.filter(tx => 
        tx.toToken.toLowerCase().includes(filters.toToken!.toLowerCase())
      );
    }

    if (filters.minAmount) {
      filtered = filtered.filter(tx => parseFloat(tx.fromAmount) >= parseFloat(filters.minAmount!));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(tx => parseFloat(tx.fromAmount) <= parseFloat(filters.maxAmount!));
    }

    if (filters.startDate) {
      filtered = filtered.filter(tx => tx.timestamp >= filters.startDate!.getTime());
    }

    if (filters.endDate) {
      filtered = filtered.filter(tx => tx.timestamp <= filters.endDate!.getTime());
    }

    return filtered;
  }

  private convertToCSV(transactions: Transaction[]): string {
    const headers = [
      'ID',
      'Type',
      'Status',
      'From Token',
      'To Token',
      'From Amount',
      'To Amount',
      'From Chain',
      'To Chain',
      'Recipient',
      'Timestamp',
      'Transaction Hash',
      'Gas Used',
      'Gas Price',
      'Fee',
      'Error'
    ];

    const rows = transactions.map(tx => [
      tx.id,
      tx.type,
      tx.status,
      tx.fromToken,
      tx.toToken,
      tx.fromAmount,
      tx.toAmount,
      tx.fromChain || '',
      tx.toChain || '',
      tx.recipient,
      new Date(tx.timestamp).toISOString(),
      tx.txHash || '',
      tx.gasUsed || '',
      tx.gasPrice || '',
      tx.fee || '',
      tx.error || ''
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    return csvContent;
  }

  // Generate unique transaction ID
  generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate transaction data
  validateTransaction(transaction: Partial<Transaction>): boolean {
    return !!(
      transaction.id &&
      transaction.type &&
      transaction.status &&
      transaction.fromToken &&
      transaction.toToken &&
      transaction.fromAmount &&
      transaction.toAmount &&
      transaction.recipient &&
      transaction.timestamp
    );
  }
}

export const transactionHistoryService = new TransactionHistoryService(); 
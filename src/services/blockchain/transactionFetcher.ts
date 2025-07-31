import { ethers } from 'ethers';

interface TransactionDetails {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: number;
  status: 'success' | 'failed';
  error?: string;
}

interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
}

class TransactionFetcher {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  // Initialize provider for a chain
  async initializeProvider(chainId: number, rpcUrl: string): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      this.providers.set(chainId, provider);
    } catch (error) {
      console.error(`Failed to initialize provider for chain ${chainId}:`, error);
      throw new Error(`Failed to initialize provider for chain ${chainId}`);
    }
  }

  // Get provider for a chain
  private getProvider(chainId: number): ethers.JsonRpcProvider {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`Provider not initialized for chain ${chainId}`);
    }
    return provider;
  }

  // Fetch transactions for an address
  async fetchTransactions(address: string, chainId: number, startBlock?: number, endBlock?: number): Promise<TransactionDetails[]> {
    try {
      const provider = this.getProvider(chainId);
      
      // Get current block number if not specified
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = startBlock || Math.max(0, currentBlock - 10000); // Last 10k blocks
      const toBlock = endBlock || currentBlock;

      // Fetch transaction history
      const history = await provider.getHistory(address, fromBlock, toBlock);
      
      const transactions: TransactionDetails[] = [];
      
      for (const tx of history) {
        try {
          const receipt = await tx.wait();
          const block = await provider.getBlock(tx.blockNumber!);
          
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to || '',
            value: tx.value.toString(),
            gasUsed: receipt?.gasUsed?.toString() || '0',
            gasPrice: tx.gasPrice?.toString() || '0',
            blockNumber: tx.blockNumber!,
            timestamp: block?.timestamp || 0,
            status: receipt?.status === 1 ? 'success' : 'failed',
            error: receipt?.status === 0 ? 'Transaction failed' : undefined,
          });
        } catch (error) {
          console.error(`Failed to get details for transaction ${tx.hash}:`, error);
        }
      }

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw new Error('Failed to fetch transactions from blockchain');
    }
  }

  // Fetch cross-chain transactions (simplified - would need bridge-specific logic)
  async fetchCrossChainTransactions(address: string, chains: number[]): Promise<TransactionDetails[]> {
    const allTransactions: TransactionDetails[] = [];
    
    for (const chainId of chains) {
      try {
        const transactions = await this.fetchTransactions(address, chainId);
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(`Failed to fetch transactions for chain ${chainId}:`, error);
      }
    }

    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get transaction details by hash
  async getTransactionDetails(txHash: string, chainId: number): Promise<TransactionDetails | null> {
    try {
      const provider = this.getProvider(chainId);
      
      const tx = await provider.getTransaction(txHash);
      if (!tx) return null;

      const receipt = await provider.getTransactionReceipt(txHash);
      const block = await provider.getBlock(tx.blockNumber!);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        gasUsed: receipt?.gasUsed?.toString() || '0',
        gasPrice: tx.gasPrice?.toString() || '0',
        blockNumber: tx.blockNumber!,
        timestamp: block?.timestamp || 0,
        status: receipt?.status === 1 ? 'success' : 'failed',
        error: receipt?.status === 0 ? 'Transaction failed' : undefined,
      };
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      return null;
    }
  }

  // Get transaction logs
  async getTransactionLogs(txHash: string, chainId: number): Promise<TransactionLog[]> {
    try {
      const provider = this.getProvider(chainId);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) return [];

      return receipt.logs.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        logIndex: log.logIndex,
        transactionIndex: log.transactionIndex,
        transactionHash: log.transactionHash,
        blockHash: log.blockHash,
        blockNumber: log.blockNumber,
      }));
    } catch (error) {
      console.error('Failed to get transaction logs:', error);
      return [];
    }
  }

  // Get token transfers for an address
  async getTokenTransfers(address: string, chainId: number, tokenAddress?: string): Promise<any[]> {
    try {
      const provider = this.getProvider(chainId);
      
      // ERC20 Transfer event signature
      const transferEventSignature = 'Transfer(address,address,uint256)';
      const transferTopic = ethers.id(transferEventSignature);
      
      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last 10k blocks
      
      // Filter for Transfer events
      const filter = {
        fromBlock,
        toBlock: currentBlock,
        topics: [
          transferTopic,
          null, // from address
          null, // to address
        ],
        address: tokenAddress, // specific token or all tokens
      };

      const logs = await provider.getLogs(filter);
      
      // Filter logs where the address is sender or receiver
      const relevantLogs = logs.filter(log => {
        const fromAddress = '0x' + log.topics[1].slice(26);
        const toAddress = '0x' + log.topics[2].slice(26);
        return fromAddress.toLowerCase() === address.toLowerCase() || 
               toAddress.toLowerCase() === address.toLowerCase();
      });

      return relevantLogs.map(log => ({
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        from: '0x' + log.topics[1].slice(26),
        to: '0x' + log.topics[2].slice(26),
        value: ethers.formatUnits(log.data, 18), // Assuming 18 decimals
        tokenAddress: log.address,
      }));
    } catch (error) {
      console.error('Failed to get token transfers:', error);
      return [];
    }
  }

  // Get balance for an address
  async getBalance(address: string, chainId: number): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  // Get token balance
  async getTokenBalance(address: string, tokenAddress: string, chainId: number): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      
      // ERC20 balanceOf function
      const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      
      const balance = await tokenContract.balanceOf(address);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  // Get gas price for a chain
  async getGasPrice(chainId: number): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const gasPrice = await provider.getFeeData();
      return gasPrice.gasPrice?.toString() || '0';
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return '0';
    }
  }

  // Estimate gas for a transaction
  async estimateGas(chainId: number, transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
  }): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const gasEstimate = await provider.estimateGas(transaction);
      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return '0';
    }
  }

  // Get block information
  async getBlockInfo(blockNumber: number, chainId: number): Promise<{
    number: number;
    timestamp: number;
    hash: string;
    transactions: string[];
  } | null> {
    try {
      const provider = this.getProvider(chainId);
      const block = await provider.getBlock(blockNumber);
      
      if (!block) return null;

      return {
        number: block.number,
        timestamp: block.timestamp,
        hash: block.hash,
        transactions: block.transactions,
      };
    } catch (error) {
      console.error('Failed to get block info:', error);
      return null;
    }
  }

  // Cleanup providers
  destroy(): void {
    this.providers.clear();
  }
}

export const transactionFetcher = new TransactionFetcher(); 
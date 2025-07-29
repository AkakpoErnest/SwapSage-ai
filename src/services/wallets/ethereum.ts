// Ethereum wallet integration (MetaMask)
import type { EthereumProvider } from '@/types/wallet';

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export interface EthereumWallet {
  address: string;
  chainId: number;
  isConnected: boolean;
}

class EthereumWalletService {
  private provider: EthereumProvider | null = null;

  async connect(): Promise<EthereumWallet> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask to continue.');
    }

    try {
      this.provider = window.ethereum;
      
      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      });

      // Get chain ID
      const chainId = await this.provider.request({
        method: 'eth_chainId',
      });

      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnected: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect MetaMask: ${errorMessage}`);
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
        await this.addNetwork(chainId);
      } else {
        throw switchError;
      }
    }
  }

  private async addNetwork(chainId: number): Promise<void> {
    const networks: Record<number, {
      chainId: string;
      chainName: string;
      nativeCurrency: { name: string; symbol: string; decimals: number };
      rpcUrls: string[];
      blockExplorerUrls: string[];
    }> = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum.publicnode.com'],
        blockExplorerUrls: ['https://etherscan.io'],
      },
      11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
    };

    const network = networks[chainId];
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    await this.provider.request({
      method: 'wallet_addEthereumChain',
      params: [network],
    });
  }

  async signTransaction(txData: {
    from: string;
    to: string;
    data?: string;
    value?: string;
    gasPrice?: string;
    gas?: string;
  }): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [txData],
      });
      return txHash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Transaction failed: ${errorMessage}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return balance;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get balance: ${errorMessage}`);
    }
  }

  onAccountChange(callback: (accounts: string[]) => void): void {
    if (this.provider) {
      this.provider.on('accountsChanged', callback);
    }
  }

  onChainChange(callback: (chainId: string) => void): void {
    if (this.provider) {
      this.provider.on('chainChanged', callback);
    }
  }

  disconnect(): void {
    this.provider = null;
  }
}

export const ethereumWallet = new EthereumWalletService();
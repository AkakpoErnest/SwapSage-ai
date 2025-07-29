// Stellar wallet integration (Freighter)
import type { StellarProvider, StellarServer } from '@/types/wallet';

declare global {
  interface Window {
    freighter?: StellarProvider;
  }
}

export interface StellarWallet {
  publicKey: string;
  network: 'MAINNET' | 'TESTNET';
  isConnected: boolean;
}

class StellarWalletService {
  async connect(): Promise<StellarWallet> {
    if (!window.freighter) {
      throw new Error('Freighter wallet not detected. Please install Freighter to continue.');
    }

    try {
      const { publicKey } = await window.freighter.requestAccess();
      const network = await window.freighter.getNetwork();

      return {
        publicKey,
        network,
        isConnected: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect Freighter: ${errorMessage}`);
    }
  }

  async switchNetwork(network: 'MAINNET' | 'TESTNET'): Promise<void> {
    if (!window.freighter) {
      throw new Error('Wallet not connected');
    }

    try {
      await window.freighter.setNetwork(network);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to switch network: ${errorMessage}`);
    }
  }

  async signTransaction(xdr: string): Promise<string> {
    if (!window.freighter) {
      throw new Error('Wallet not connected');
    }

    try {
      const { signedXDR } = await window.freighter.signTransaction(xdr, {
        networkPassphrase: await this.getNetworkPassphrase(),
      });
      return signedXDR;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Transaction signing failed: ${errorMessage}`);
    }
  }

  async submitTransaction(signedXDR: string): Promise<string> {
    try {
      const server = this.getServer();
      const transaction = { xdr: signedXDR };
      const result = await server.submitTransaction(transaction);
      return result.hash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Transaction submission failed: ${errorMessage}`);
    }
  }

  async getBalance(publicKey: string): Promise<Array<{
    balance: string;
    asset_type: string;
    asset_code?: string;
  }>> {
    try {
      const server = this.getServer();
      const account = await server.loadAccount(publicKey);
      return account.balances;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get balance: ${errorMessage}`);
    }
  }

  private async getNetworkPassphrase(): Promise<string> {
    const network = await window.freighter.getNetwork();
    return network === 'MAINNET' 
      ? 'Public Global Stellar Network ; September 2015'
      : 'Test SDF Network ; September 2015';
  }

  private getServer(): StellarServer {
    // Mock Stellar SDK for now - would import real SDK in production
    return {
      loadAccount: async (publicKey: string) => ({
        balances: [
          {
            balance: '1000.0000000',
            asset_type: 'native',
            asset_code: 'XLM',
          },
        ],
      }),
      transactionFromXDR: (xdr: string) => ({ xdr: xdr }),
              submitTransaction: async (tx: { xdr: string }) => ({
        hash: '0x' + Math.random().toString(16).substr(2, 64),
      }),
    };
  }

  disconnect(): void {
    // Freighter doesn't have explicit disconnect
    console.log('Disconnected from Freighter');
  }
}

export const stellarWallet = new StellarWalletService();
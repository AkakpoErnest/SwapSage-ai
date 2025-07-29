// Wallet provider type definitions

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

export interface StellarProvider {
  requestAccess: () => Promise<{ publicKey: string }>;
  getNetwork: () => Promise<'MAINNET' | 'TESTNET'>;
  setNetwork: (network: 'MAINNET' | 'TESTNET') => Promise<void>;
  signTransaction: (xdr: string, options: { networkPassphrase: string }) => Promise<{ signedXDR: string }>;
}

export interface StellarServer {
  loadAccount: (publicKey: string) => Promise<{
    balances: Array<{
      balance: string;
      asset_type: string;
      asset_code?: string;
    }>;
  }>;
  transactionFromXDR: (xdr: string) => { xdr: string };
  submitTransaction: (tx: { xdr: string }) => Promise<{ hash: string }>;
}

// Note: Global window declarations are handled in individual wallet service files 
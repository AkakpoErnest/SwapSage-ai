// Wallet provider type definitions

export interface EthereumProvider {
  isMetaMask: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

export interface StellarProvider {
  connect: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  getNetwork: () => Promise<'MAINNET' | 'TESTNET'>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    freighter?: StellarProvider;
  }
} 
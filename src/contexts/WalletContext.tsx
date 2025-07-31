import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  balance?: string;
  network?: string;
  provider?: any;
}

interface WalletError {
  message: string;
  code?: string;
}

interface WalletContextType {
  walletState: WalletState;
  isConnecting: boolean;
  error: WalletError | null;
  isMetaMaskInstalled: () => boolean;
  isFreighterInstalled: () => boolean;
  connectEthereum: () => Promise<void>;
  connectStellar: () => Promise<void>;
  switchEthereumNetwork: (chainId: number) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    const installed = typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
    console.log('MetaMask installed check:', installed);
    return installed;
  };

  // Check if Freighter is installed
  const isFreighterInstalled = () => {
    const installed = typeof window !== 'undefined' && window.freighter;
    console.log('Freighter installed check:', installed);
    return installed;
  };

  // Get network name from chain ID
  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Mumbai Testnet';
      default:
        return `Chain ${chainId}`;
    }
  };

  // Connect to Ethereum wallet
  const connectEthereum = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError({
        message: 'MetaMask is not installed. Please install MetaMask to continue.',
        code: 'METAMASK_NOT_INSTALLED'
      });
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('Connecting to Ethereum wallet...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      console.log('Accounts found:', accounts);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      console.log('Wallet connected:', {
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        network: getNetworkName(Number(network.chainId))
      });

      setWalletState({
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        network: getNetworkName(Number(network.chainId)),
        provider
      });

    } catch (err: any) {
      console.error('Ethereum connection error:', err);
      setError({
        message: err.message || 'Failed to connect to MetaMask',
        code: err.code
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect to Stellar wallet
  const connectStellar = useCallback(async () => {
    if (!isFreighterInstalled()) {
      setError({
        message: 'Freighter is not installed. Please install Freighter to continue.',
        code: 'FREIGHTER_NOT_INSTALLED'
      });
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request connection to Freighter
      const isConnected = await window.freighter.connect();
      
      if (!isConnected) {
        throw new Error('Failed to connect to Freighter');
      }

      const publicKey = await window.freighter.getPublicKey();
      const network = await window.freighter.getNetwork();

      setWalletState({
        isConnected: true,
        address: publicKey,
        chainId: network === 'MAINNET' ? 1 : 2,
        network: network === 'MAINNET' ? 'Stellar Mainnet' : 'Stellar Testnet',
        provider: window.freighter
      });

    } catch (err: any) {
      setError({
        message: err.message || 'Failed to connect to Freighter',
        code: err.code
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Switch Ethereum network
  const switchEthereumNetwork = useCallback(async (chainId: number) => {
    if (!isMetaMaskInstalled()) {
      setError({
        message: 'MetaMask is not installed',
        code: 'METAMASK_NOT_INSTALLED'
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });

      // Refresh wallet state after network switch
      if (walletState.isConnected) {
        await connectEthereum();
      }
    } catch (err: any) {
      // If chain doesn't exist, add it
      if (err.code === 4902) {
        try {
          const chainConfig = getChainConfig(chainId);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig]
          });
          await connectEthereum();
        } catch (addErr: any) {
          setError({
            message: `Failed to add network: ${addErr.message}`,
            code: addErr.code
          });
        }
      } else {
        setError({
          message: `Failed to switch network: ${err.message}`,
          code: err.code
        });
      }
    }
  }, [walletState.isConnected, connectEthereum]);

  // Get chain configuration for adding networks
  const getChainConfig = (chainId: number) => {
    switch (chainId) {
      case 11155111: // Sepolia
        return {
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'SEP',
            decimals: 18
          },
          rpcUrls: ['https://sepolia.infura.io/v3/'],
          blockExplorerUrls: ['https://sepolia.etherscan.io/']
        };
      case 80001: // Mumbai
        return {
          chainId: '0x13881',
          chainName: 'Mumbai Testnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          },
          rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
          blockExplorerUrls: ['https://mumbai.polygonscan.com/']
        };
      default:
        throw new Error('Unsupported network');
    }
  };

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false
    });
    setError(null);
  }, []);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!walletState.isConnected || !walletState.address || !walletState.provider) {
      return;
    }

    try {
      const balance = await walletState.provider.getBalance(walletState.address);
      setWalletState(prev => ({
        ...prev,
        balance: ethers.formatEther(balance)
      }));
      console.log('Balance refreshed:', ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [walletState.isConnected, walletState.address, walletState.provider]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (walletState.isConnected) {
        setWalletState(prev => ({
          ...prev,
          address: accounts[0]
        }));
      }
    };

    const handleChainChanged = () => {
      if (walletState.isConnected) {
        connectEthereum();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [walletState.isConnected, connectEthereum, disconnect]);

  const value = {
    walletState,
    isConnecting,
    error,
    isMetaMaskInstalled,
    isFreighterInstalled,
    connectEthereum,
    connectStellar,
    switchEthereumNetwork,
    disconnect,
    refreshBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 
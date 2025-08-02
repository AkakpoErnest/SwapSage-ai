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
  connectEthereum: () => Promise<void>;
  connectStellar: () => Promise<void>;
  switchToTestnet: () => Promise<void>;
  disconnect: () => void;
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

  // Check if current network is a testnet
  const isTestnet = (chainId: number): boolean => {
    return chainId === 11155111 || chainId === 80001; // Sepolia or Mumbai
  };



  // Connect to Ethereum wallet - Enhanced version with circuit breaker handling
  const connectEthereum = useCallback(async () => {
    console.log('🔄 Starting Ethereum connection...');
    
    if (typeof window === 'undefined') {
      console.error('❌ Window is undefined');
      return;
    }

    if (!window.ethereum) {
      console.error('❌ MetaMask not found');
      alert('MetaMask is not installed! Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('📝 Requesting accounts...');
      
      // Handle circuit breaker error by retrying with different approach
      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
      } catch (requestError: any) {
        console.log('⚠️ First attempt failed, trying alternative method...');
        
        // If circuit breaker is open, try alternative connection method
        if (requestError.code === -32603 && requestError.data?.cause?.isBrokenCircuitError) {
          console.log('🔄 Circuit breaker detected, trying alternative connection...');
          
          // Try to get accounts without requesting (if already approved)
          try {
            accounts = await window.ethereum.request({
              method: 'eth_accounts'
            });
            
            if (!accounts || accounts.length === 0) {
              throw new Error('No accounts available. Please unlock MetaMask and try again.');
            }
          } catch (accountsError: any) {
            throw new Error('MetaMask is locked or not connected. Please unlock MetaMask and refresh the page.');
          }
        } else {
          throw requestError;
        }
      }

      console.log('✅ Accounts received:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }

      const address = accounts[0];
      console.log('📍 Using address:', address);

      // Create provider with error handling
      let provider;
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
      } catch (providerError: any) {
        console.error('❌ Provider creation failed:', providerError);
        throw new Error('Failed to create Ethereum provider. Please refresh the page.');
      }

      // Get network info with retry logic
      let network;
      try {
        network = await provider.getNetwork();
      } catch (networkError: any) {
        console.error('❌ Network detection failed:', networkError);
        // Use default network if detection fails
        network = { chainId: BigInt(1) }; // Default to mainnet
      }

      // Get balance with error handling
      let balance;
      try {
        balance = await provider.getBalance(address);
      } catch (balanceError: any) {
        console.error('❌ Balance fetch failed:', balanceError);
        balance = BigInt(0); // Default to 0 if balance fetch fails
      }

      const newWalletState = {
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        network: getNetworkName(Number(network.chainId)),
        provider
      };

      console.log('✅ Wallet connected:', newWalletState);
      setWalletState(newWalletState);

      // Show success message
      console.log('🎉 Wallet connection successful!');

    } catch (err: any) {
      console.error('❌ Connection failed:', err);
      
      let errorMessage = 'Failed to connect to MetaMask';
      let errorCode = err.code;

      // Handle specific error types
      if (err.code === -32603 && err.data?.cause?.isBrokenCircuitError) {
        errorMessage = 'MetaMask connection temporarily unavailable. Please refresh the page and try again.';
        errorCode = 'CIRCUIT_BREAKER';
      } else if (err.code === 4001) {
        errorMessage = 'Connection rejected by user. Please approve the connection in MetaMask.';
        errorCode = 'USER_REJECTED';
      } else if (err.code === -32002) {
        errorMessage = 'MetaMask connection request already pending. Please check MetaMask.';
        errorCode = 'REQUEST_PENDING';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError({
        message: errorMessage,
        code: errorCode
      });

      // Show user-friendly error message
      console.error('❌ Connection error:', errorMessage);
    } finally {
      setIsConnecting(false);
      console.log('🏁 Connection attempt finished');
    }
  }, []);

  // Switch to testnet networks
  const switchToTestnet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask is not installed!');
      return;
    }

    try {
      // Try to switch to Sepolia first
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }] // Sepolia chainId in hex
      });
      
      // Refresh wallet state after network switch
      if (walletState.isConnected) {
        await connectEthereum();
      }
    } catch (switchError: any) {
      // If Sepolia is not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'SEP',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
          });
          
          // Refresh wallet state after adding network
          if (walletState.isConnected) {
            await connectEthereum();
          }
        } catch (addError: any) {
          alert(`Failed to add Sepolia testnet: ${addError.message}`);
        }
      } else {
        alert(`Failed to switch to Sepolia testnet: ${switchError.message}`);
      }
    }
  }, [walletState.isConnected, connectEthereum]);

  // Connect to Stellar wallet - Simplified version
  const connectStellar = useCallback(async () => {
    console.log('🔄 Starting Stellar connection...');
    
    if (typeof window === 'undefined') {
      console.error('❌ Window is undefined');
      return;
    }

    if (!window.freighter) {
      console.error('❌ Freighter not found');
      alert('Freighter is not installed! Please install Freighter to continue.');
      window.open('https://www.freighter.app/', '_blank');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('📝 Connecting to Freighter...');
      const isConnected = await window.freighter.connect();
      
      if (!isConnected) {
        throw new Error('Failed to connect to Freighter');
      }

      const publicKey = await window.freighter.getPublicKey();
      const network = await window.freighter.getNetwork();

      const newWalletState = {
        isConnected: true,
        address: publicKey,
        chainId: network === 'TESTNET' ? 80001 : 137,
        balance: '0', // Stellar balance would need separate API call
        network: network === 'TESTNET' ? 'Stellar Testnet' : 'Stellar Mainnet',
        provider: window.freighter
      };

      console.log('✅ Stellar wallet connected:', newWalletState);
      setWalletState(newWalletState);

    } catch (err: any) {
      console.error('❌ Stellar connection failed:', err);
      setError({
        message: err.message || 'Failed to connect to Freighter',
        code: err.code
      });
      alert(`Failed to connect: ${err.message}`);
    } finally {
      setIsConnecting(false);
      console.log('🏁 Stellar connection attempt finished');
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting wallet...');
    setWalletState({ isConnected: false });
    setError(null);
  }, []);

  // Set up event listeners for wallet changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('👥 Accounts changed:', accounts);
      if (accounts.length === 0) {
        disconnect();
      } else if (walletState.isConnected && walletState.address !== accounts[0]) {
        // Reconnect with new account
        connectEthereum();
      }
    };

    const handleChainChanged = () => {
      console.log('🔗 Chain changed');
      if (walletState.isConnected) {
        connectEthereum();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletState.isConnected, walletState.address, connectEthereum, disconnect]);

  const value: WalletContextType = {
    walletState,
    isConnecting,
    error,
    connectEthereum,
    connectStellar,
    switchToTestnet,
    disconnect
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 
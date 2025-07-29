import { useState, useCallback, useEffect } from 'react';
import { ethereumWallet, type EthereumWallet } from '@/services/wallets/ethereum';
import { stellarWallet, type StellarWallet } from '@/services/wallets/stellar';
import { useToast } from '@/hooks/use-toast';

export interface WalletState {
  ethereum: EthereumWallet | null;
  stellar: StellarWallet | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    ethereum: null,
    stellar: null,
    isConnecting: false,
    error: null,
  });
  
  const { toast } = useToast();

  const connectEthereum = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const wallet = await ethereumWallet.connect();
      setState(prev => ({ 
        ...prev, 
        ethereum: wallet, 
        isConnecting: false 
      }));
      
      toast({
        title: "Ethereum Wallet Connected",
        description: `Connected to ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
      });
    } catch (error: unknown) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isConnecting: false 
      }));
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  }, [toast]);

  const connectStellar = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const wallet = await stellarWallet.connect();
      setState(prev => ({ 
        ...prev, 
        stellar: wallet, 
        isConnecting: false 
      }));
      
      toast({
        title: "Stellar Wallet Connected",
        description: `Connected to ${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-4)}`,
      });
    } catch (error: unknown) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isConnecting: false 
      }));
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  }, [toast]);

  const disconnectEthereum = useCallback(() => {
    ethereumWallet.disconnect();
    setState(prev => ({ ...prev, ethereum: null }));
    
    toast({
      title: "Ethereum Wallet Disconnected",
      description: "Successfully disconnected from MetaMask",
    });
  }, [toast]);

  const disconnectStellar = useCallback(() => {
    stellarWallet.disconnect();
    setState(prev => ({ ...prev, stellar: null }));
    
    toast({
      title: "Stellar Wallet Disconnected",
      description: "Successfully disconnected from Freighter",
    });
  }, [toast]);

  const switchEthereumNetwork = useCallback(async (chainId: number) => {
    try {
      await ethereumWallet.switchNetwork(chainId);
      
      if (state.ethereum) {
        setState(prev => ({
          ...prev,
          ethereum: prev.ethereum ? { ...prev.ethereum, chainId } : null,
        }));
      }
      
      toast({
        title: "Network Switched",
        description: `Switched to chain ID ${chainId}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Network Switch Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  }, [state.ethereum, toast]);

  const switchStellarNetwork = useCallback(async (network: 'MAINNET' | 'TESTNET') => {
    try {
      await stellarWallet.switchNetwork(network);
      
      if (state.stellar) {
        setState(prev => ({
          ...prev,
          stellar: prev.stellar ? { ...prev.stellar, network } : null,
        }));
      }
      
      toast({
        title: "Network Switched",
        description: `Switched to Stellar ${network}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Network Switch Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  }, [state.stellar, toast]);

  // Set up event listeners
  useEffect(() => {
    const handleEthereumAccountChange = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState(prev => ({ ...prev, ethereum: null }));
      } else if (state.ethereum) {
        setState(prev => ({
          ...prev,
          ethereum: prev.ethereum ? { ...prev.ethereum, address: accounts[0] } : null,
        }));
      }
    };

    const handleEthereumChainChange = (chainId: string) => {
      if (state.ethereum) {
        setState(prev => ({
          ...prev,
          ethereum: prev.ethereum ? { 
            ...prev.ethereum, 
            chainId: parseInt(chainId, 16) 
          } : null,
        }));
      }
    };

    ethereumWallet.onAccountChange(handleEthereumAccountChange);
    ethereumWallet.onChainChange(handleEthereumChainChange);

    return () => {
      // Cleanup listeners if needed
    };
  }, [state.ethereum]);

  return {
    ...state,
    connectEthereum,
    connectStellar,
    disconnectEthereum,
    disconnectStellar,
    switchEthereumNetwork,
    switchStellarNetwork,
    isConnected: !!state.ethereum || !!state.stellar,
  };
};
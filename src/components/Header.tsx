import React, { useState } from 'react';
import { Button } from './ui/button';
import { useWalletContext } from '@/contexts/WalletContext';
import { Coins, Network, Activity, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Header: React.FC = () => {
  const { walletState, connectEthereum, connectStellar, disconnect, isConnecting } = useWalletContext();
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [isConnectingFreighter, setIsConnectingFreighter] = useState(false);
  
  console.log('Header wallet state:', walletState);

  const handleNetworkSelect = async (network: 'ethereum' | 'stellar') => {
    console.log('Network selected:', network);
    
    if (network === 'ethereum') {
      setIsConnectingMetaMask(true);
      
      try {
        // Check if MetaMask is installed first
        if (!window.ethereum) {
          alert('MetaMask is not installed! Please install MetaMask to continue.');
          window.open('https://metamask.io/download/', '_blank');
          return;
        }
        
        if (!window.ethereum.isMetaMask) {
          alert('Please use MetaMask wallet to connect to Ethereum.');
          return;
        }
        
        console.log('Attempting to connect Ethereum...');
        await connectEthereum();
        console.log('Ethereum connection completed');
      } catch (error) {
        console.error('Connection error:', error);
        alert('Failed to connect to MetaMask. Please try again.');
      } finally {
        setIsConnectingMetaMask(false);
      }
    } else if (network === 'stellar') {
      setIsConnectingFreighter(true);
      
      try {
        // Check if Freighter is installed first
        if (!window.freighter) {
          alert('Freighter is not installed! Please install Freighter to continue.');
          window.open('https://www.freighter.app/', '_blank');
          return;
        }
        
        console.log('Attempting to connect Stellar...');
        await connectStellar();
        console.log('Stellar connection completed');
      } catch (error) {
        console.error('Connection error:', error);
        alert('Failed to connect to Freighter. Please try again.');
      } finally {
        setIsConnectingFreighter(false);
      }
    }
  };

  const getWalletStatus = (walletName: string) => {
    if (walletName === 'MetaMask') {
      return typeof window !== 'undefined' && window.ethereum ? 'Installed' : 'Install';
    } else if (walletName === 'Freighter') {
      return typeof window !== 'undefined' && window.freighter ? 'Installed' : 'Install';
    }
    return 'Install';
  };

  const handleWalletInstall = (walletName: string) => {
    if (walletName === 'MetaMask') {
      window.open('https://metamask.io/download/', '_blank');
    } else if (walletName === 'Freighter') {
      window.open('https://www.freighter.app/', '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10">
            {/* Split Head Logo */}
            <svg viewBox="0 0 40 40" className="w-10 h-10">
              {/* Left Half - Sage */}
              <defs>
                <linearGradient id="sageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#0D9488', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              
              {/* Head outline */}
              <path d="M20 8 C12 8 8 12 8 20 C8 28 12 32 20 32 C28 32 32 28 32 20 C32 12 28 8 20 8" 
                    fill="none" stroke="url(#sageGradient)" strokeWidth="2" strokeDasharray="0 0"/>
              
              {/* Left half - Sage features */}
              <path d="M20 8 C12 8 8 12 8 20 C8 28 12 32 20 32" 
                    fill="none" stroke="url(#sageGradient)" strokeWidth="2"/>
              <circle cx="16" cy="18" r="2" fill="url(#sageGradient)"/> {/* Sage eye */}
              <path d="M14 24 Q18 28 20 24" fill="none" stroke="url(#sageGradient)" strokeWidth="1.5"/> {/* Sage beard */}
              
              {/* Right half - AI features */}
              <path d="M20 8 C28 8 32 12 32 20 C32 28 28 32 20 32" 
                    fill="none" stroke="url(#aiGradient)" strokeWidth="2"/>
              <rect x="22" y="16" width="4" height="4" fill="url(#aiGradient)" rx="0.5"/> {/* AI eye */}
              <circle cx="26" cy="14" r="0.5" fill="url(#aiGradient)"/> {/* AI sensor dots */}
              <circle cx="28" cy="16" r="0.5" fill="url(#aiGradient)"/>
              <circle cx="26" cy="18" r="0.5" fill="url(#aiGradient)"/>
              
              {/* Curved arrows */}
              <path d="M12 26 Q8 20 12 14" fill="none" stroke="url(#sageGradient)" strokeWidth="1.5" 
                    markerEnd="url(#arrowhead1)"/>
              <path d="M28 14 Q32 20 28 26" fill="none" stroke="url(#aiGradient)" strokeWidth="1.5" 
                    markerEnd="url(#arrowhead2)"/>
              
              <defs>
                <marker id="arrowhead1" markerWidth="4" markerHeight="3" refX="3" refY="1.5" orient="auto">
                  <polygon points="0 0, 4 1.5, 0 3" fill="url(#sageGradient)"/>
                </marker>
                <marker id="arrowhead2" markerWidth="4" markerHeight="3" refX="1" refY="1.5" orient="auto">
                  <polygon points="4 0, 0 1.5, 4 3" fill="url(#aiGradient)"/>
                </marker>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              SwapSage-AI
            </h1>
            <p className="text-xs text-muted-foreground">Intelligent Cross-Chain Swaps</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>Swap</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Networks</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </Button>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          {!walletState.isConnected ? (
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleNetworkSelect('ethereum')}
                disabled={isConnectingMetaMask || isConnectingFreighter}
                className="wallet-connect-btn bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border-0 shadow-lg"
              >
                {isConnectingMetaMask ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect MetaMask'
                )}
              </Button>
              <Button 
                onClick={() => handleNetworkSelect('stellar')}
                disabled={isConnectingMetaMask || isConnectingFreighter}
                className="wallet-connect-btn bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border-0 shadow-lg"
              >
                {isConnectingFreighter ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Freighter'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {walletState.network === 'ethereum' ? 'Ethereum' : 'Stellar'}
                </span>
                <div className="font-mono text-xs">
                  {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
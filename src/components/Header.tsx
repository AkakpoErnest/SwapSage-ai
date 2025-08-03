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
  const { walletState, connectEthereum, connectStellar, switchToTestnet, disconnect, isConnecting } = useWalletContext();
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [isConnectingFreighter, setIsConnectingFreighter] = useState(false);
  
  // Wallet state management

  // Check wallet installation status
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

  const handleNetworkSelect = async (network: 'ethereum' | 'stellar') => {
    if (network === 'ethereum') {
      setIsConnectingMetaMask(true);
      
      try {
        await connectEthereum();
      } catch (error: any) {
        if (error.message?.includes('MetaMask is not installed')) {
          alert('MetaMask is not installed! Please install MetaMask to continue.');
          window.open('https://metamask.io/download/', '_blank');
        } else {
          alert('Failed to connect to MetaMask. Please try again.');
        }
      } finally {
        setIsConnectingMetaMask(false);
      }
    } else if (network === 'stellar') {
      setIsConnectingFreighter(true);
      
      try {
        await connectStellar();
      } catch (error: any) {
        if (error.message?.includes('Freighter is not installed')) {
          alert('Freighter is not installed! Please install Freighter to continue.');
          window.open('https://www.freighter.app/', '_blank');
        } else {
          alert('Failed to connect to Freighter. Please try again.');
        }
      } finally {
        setIsConnectingFreighter(false);
      }
    }
  };

  // Check if current network is a testnet
  const isTestnet = (chainId?: number): boolean => {
    return chainId === 11155111 || chainId === 80001; // Sepolia or Mumbai
  };

  // Get the correct network display name
  const getNetworkDisplayName = () => {
    if (!walletState.network) return 'Unknown';
    
    // Check if it's an Ethereum network
    if (walletState.network.includes('Ethereum') || walletState.network.includes('Sepolia') || walletState.network.includes('Polygon') || walletState.network.includes('Mumbai')) {
      return walletState.network;
    }
    
    // Check if it's a Stellar network
    if (walletState.network.includes('Stellar')) {
      return walletState.network;
    }
    
    return walletState.network;
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => {
              // Scroll to main interface and switch to swap tab
              const mainSection = document.querySelector('[data-section="main-interface"]');
              if (mainSection) {
                mainSection.scrollIntoView({ behavior: 'smooth' });
              }
              // Dispatch custom event to switch tabs
              window.dispatchEvent(new CustomEvent('switchTab', { detail: 'swap' }));
            }}
          >
            <Coins className="h-4 w-4" />
            <span>Swap</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => {
              const mainSection = document.querySelector('[data-section="main-interface"]');
              if (mainSection) {
                mainSection.scrollIntoView({ behavior: 'smooth' });
              }
              window.dispatchEvent(new CustomEvent('switchTab', { detail: 'bridge' }));
            }}
          >
            <Network className="h-4 w-4" />
            <span>Networks</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => {
              const mainSection = document.querySelector('[data-section="main-interface"]');
              if (mainSection) {
                mainSection.scrollIntoView({ behavior: 'smooth' });
              }
              window.dispatchEvent(new CustomEvent('switchTab', { detail: 'history' }));
            }}
          >
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </Button>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-4">
          {!walletState.isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  disabled={isConnectingMetaMask || isConnectingFreighter}
                  className="wallet-connect-btn bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/80 hover:to-neon-purple/80 text-black font-medium border-0 shadow-lg shadow-neon-cyan/20 transition-all duration-200"
                >
                  {isConnectingMetaMask || isConnectingFreighter ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      Connect Wallet
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-space-gray/95 backdrop-blur-sm border border-neon-cyan/20 shadow-xl shadow-neon-cyan/10">
                <DropdownMenuItem 
                  onClick={() => handleNetworkSelect('ethereum')}
                  disabled={isConnectingMetaMask || isConnectingFreighter}
                  className="flex items-center justify-between p-4 hover:bg-neon-cyan/10 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">M</span>
                    </div>
                    <div>
                      <span className="font-medium text-white">MetaMask</span>
                      <p className="text-xs text-muted-foreground">Ethereum & Polygon</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      getWalletStatus('MetaMask') === 'Installed' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {getWalletStatus('MetaMask')}
                    </span>
                    {getWalletStatus('MetaMask') === 'Install' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWalletInstall('MetaMask');
                        }}
                        className="h-6 w-6 p-0 text-neon-cyan hover:text-neon-cyan/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleNetworkSelect('stellar')}
                  disabled={isConnectingMetaMask || isConnectingFreighter}
                  className="flex items-center justify-between p-4 hover:bg-neon-cyan/10 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">F</span>
                    </div>
                    <div>
                      <span className="font-medium text-white">Freighter</span>
                      <p className="text-xs text-muted-foreground">Stellar Network</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      getWalletStatus('Freighter') === 'Installed' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {getWalletStatus('Freighter')}
                    </span>
                    {getWalletStatus('Freighter') === 'Install' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWalletInstall('Freighter');
                        }}
                        className="h-6 w-6 p-0 text-neon-cyan hover:text-neon-cyan/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">
                    {getNetworkDisplayName()}
                  </span>
                  {!isTestnet(walletState.chainId) && walletState.network?.includes('Ethereum') && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      Switch to Testnet
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs">
                  {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
                </div>
                {!isTestnet(walletState.chainId) && walletState.network?.includes('Ethereum') && (
                  <div className="text-xs text-yellow-600 mt-1">
                    ⚠️ This app requires testnet for demo
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {!isTestnet(walletState.chainId) && walletState.network?.includes('Ethereum') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={switchToTestnet}
                    className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                  >
                    Switch to Sepolia
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
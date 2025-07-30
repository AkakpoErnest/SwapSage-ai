import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { 
  WalletIcon, 
  Settings, 
  Menu, 
  ChevronDown, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Shield,
  Globe,
  ExternalLink,
  ArrowRight,
  Network,
  Coins,
  Activity
} from "lucide-react";

const Header = () => {
  const { walletState, isConnecting, error, isMetaMaskInstalled, isFreighterInstalled, connectEthereum, connectStellar, disconnect } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const { toast } = useToast();

  // Debug logging
  useEffect(() => {
    console.log('Wallet state:', walletState, 'Is connected:', walletState.isConnected);
  }, [walletState]);

  const networks = [
    {
      id: "ethereum",
      name: "Ethereum",
      icon: "🦊",
      description: "Smart contracts & DeFi",
      testnet: "Sepolia",
      color: "#3B82F6"
    },
    {
      id: "stellar",
      name: "Stellar",
      icon: "⭐",
      description: "Fast & low-cost transfers",
      testnet: "Testnet",
      color: "#8B5CF6"
    }
  ];

  const getWalletsForNetwork = (networkId: string) => {
    if (networkId === "ethereum") {
      return [
        {
          id: "metamask",
          name: "MetaMask",
          icon: "🦊",
          description: "Most popular Ethereum wallet",
          isInstalled: isMetaMaskInstalled(),
          connect: connectEthereum
        }
      ];
    } else if (networkId === "stellar") {
      return [
        {
          id: "freighter",
          name: "Freighter",
          icon: "⭐",
          description: "Stellar wallet extension",
          isInstalled: isFreighterInstalled(),
          connect: connectStellar
        }
      ];
    }
    return [];
  };

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetwork(networkId);
  };

  const handleWalletConnect = async (wallet: any) => {
    console.log('Attempting to connect wallet:', wallet);
    setShowWalletSelector(false);
    setSelectedNetwork(null);
    
    if (!wallet.isInstalled) {
      console.log('Wallet not installed, redirecting to download');
      // Open wallet download page
      if (wallet.id === "metamask") {
        window.open("https://metamask.io/download/", "_blank");
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask and refresh the page",
          variant: "destructive"
        });
      } else if (wallet.id === "freighter") {
        window.open("https://www.freighter.app/", "_blank");
        toast({
          title: "Freighter Required",
          description: "Please install Freighter and refresh the page",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      console.log('Calling wallet connect function:', wallet.connect);
      await wallet.connect();
      console.log('Wallet connected successfully');
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${wallet.name}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected",
    });
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <span className="text-xl font-bold text-white">⚡</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SwapSage AI
            </h1>
            <p className="text-xs text-muted-foreground">Ask. Swap. Done.</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Swap
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Bridge
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            History
          </Button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 relative">
          {/* Test button to verify button component works */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => console.log('Test button clicked')}
            className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Test Button
          </Button>
          
          {/* Simple HTML button test */}
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded transition-all duration-300 hover:scale-105 hover:bg-blue-600 hover:shadow-lg transform"
            onClick={() => console.log('HTML button clicked')}
          >
            HTML Test
          </button>
          
          {!walletState.isConnected ? (
            <button 
              className="wallet-connect-btn text-white px-6 py-3 rounded-lg flex items-center gap-2 animate-pulse"
              onClick={() => setShowWalletSelector(!showWalletSelector)}
            >
              Connect Wallet
              <span className={`transition-transform duration-300 ${showWalletSelector ? 'rotate-180' : ''}`}>▼</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 animate-fade-in">
              <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30 animate-pulse">
                {walletState.network}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDisconnect}
                className="text-red-400 hover:bg-red-400/10 transition-all duration-300 hover:scale-105"
              >
                Disconnect
              </Button>
            </div>
          )}
          
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-4 h-4" />
          </Button>

          {/* Wallet Selector Dropdown */}
          {showWalletSelector && (
            <div className="absolute top-full right-0 mt-2 w-96 z-50 animate-in slide-in-from-top-2 duration-300">
              <Card className="p-4 bg-space-gray/95 border-neon-cyan/20 backdrop-blur-sm shadow-2xl">
                {!selectedNetwork ? (
                  <>
                    <h4 className="font-medium text-white mb-4 flex items-center gap-2 animate-fade-in">
                      <Network className="w-4 h-4 animate-pulse" />
                      Select Network
                    </h4>
                    <div className="space-y-3">
                      {networks.map((network, index) => (
                        <div
                          key={network.id}
                          onClick={() => handleNetworkSelect(network.id)}
                          className="p-4 rounded-lg border border-border hover:border-neon-cyan/40 cursor-pointer transition-all duration-300 hover:bg-space-gray/50 hover:scale-105 hover:shadow-lg transform animate-in slide-in-from-right-2"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl animate-bounce">{network.icon}</div>
                              <div>
                                <h5 className="font-medium text-white">{network.name}</h5>
                                <p className="text-sm text-muted-foreground">{network.description}</p>
                                <Badge variant="outline" className="text-xs text-green-400 border-green-400/30 mt-1 animate-pulse">
                                  {network.testnet}
                                </Badge>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 animate-fade-in">
                      <button
                        onClick={() => setSelectedNetwork(null)}
                        className="text-muted-foreground hover:text-white transition-colors duration-300 hover:scale-110 transform"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                      <h4 className="font-medium text-white flex items-center gap-2">
                        <WalletIcon className="w-4 h-4 animate-pulse" />
                        Select Wallet
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {getWalletsForNetwork(selectedNetwork).map((wallet, index) => (
                        <div
                          key={wallet.id}
                          onClick={() => handleWalletConnect(wallet)}
                          className="p-4 rounded-lg border border-border hover:border-neon-cyan/40 cursor-pointer transition-all duration-300 hover:bg-space-gray/50 hover:scale-105 hover:shadow-lg transform animate-in slide-in-from-left-2"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl animate-bounce">{wallet.icon}</div>
                              <div>
                                <h5 className="font-medium text-white">{wallet.name}</h5>
                                <p className="text-sm text-muted-foreground">{wallet.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {wallet.isInstalled ? (
                                <div className="flex items-center gap-1 text-xs text-green-400 animate-pulse">
                                  <CheckCircle className="w-3 h-3" />
                                  Installed
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-orange-400 animate-pulse">
                                  <ExternalLink className="w-3 h-3" />
                                  Install
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
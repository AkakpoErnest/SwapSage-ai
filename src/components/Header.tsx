import { useState } from "react";
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
  ExternalLink
} from "lucide-react";

const Header = () => {
  const { walletState, isConnecting, error, isMetaMaskInstalled, isFreighterInstalled, connectEthereum, connectStellar, disconnect } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const { toast } = useToast();

  const chains = [
    {
      id: "ethereum",
      name: "Ethereum",
      icon: "🔵",
      wallet: "MetaMask",
      description: "Smart contracts & DeFi",
      testnet: "Sepolia",
      isInstalled: isMetaMaskInstalled(),
      connect: connectEthereum
    },
    {
      id: "stellar",
      name: "Stellar",
      icon: "⭐",
      wallet: "Freighter",
      description: "Fast & low-cost transfers",
      testnet: "Testnet",
      isInstalled: isFreighterInstalled(),
      connect: connectStellar
    }
  ];

  const handleConnect = async (chain: any) => {
    setShowWalletSelector(false);
    
    if (!chain.isInstalled) {
      // Open wallet download page
      if (chain.id === "ethereum") {
        window.open("https://metamask.io/download/", "_blank");
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask and refresh the page",
          variant: "destructive"
        });
      } else if (chain.id === "stellar") {
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
      await chain.connect();
      toast({
        title: "Wallet Connected",
        description: `Connected to ${chain.name}`,
      });
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message,
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
          <div className="text-2xl">🪄</div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SwapSage AI
            </h1>
            <p className="text-xs text-muted-foreground">Ask. Swap. Done.</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Button variant="ghost" size="sm">Swap</Button>
          <Button variant="ghost" size="sm">Bridge</Button>
          <Button variant="ghost" size="sm">History</Button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 relative">
          {!walletState.isConnected ? (
            <Button 
              variant="chain" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setShowWalletSelector(!showWalletSelector)}
            >
              <WalletIcon className="w-4 h-4" />
              Connect Wallet
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                {walletState.network}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDisconnect}
                className="text-red-400 hover:bg-red-400/10"
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
            <div className="absolute top-full right-0 mt-2 w-80 z-50">
              <Card className="p-4 bg-space-gray/95 border-neon-cyan/20 backdrop-blur-sm">
                <h4 className="font-medium text-white mb-3">Choose Your Wallet</h4>
                <div className="space-y-2">
                  {chains.map((chain) => (
                    <div
                      key={chain.id}
                      onClick={() => handleConnect(chain)}
                      className="p-3 rounded-lg border border-border hover:border-neon-cyan/40 cursor-pointer transition-all hover:bg-space-gray/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-xl">{chain.icon}</div>
                          <div>
                            <h5 className="font-medium text-white">{chain.name}</h5>
                            <p className="text-sm text-muted-foreground">{chain.description}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {chain.wallet}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                                {chain.testnet}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {chain.isInstalled ? (
                            <div className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Installed
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-orange-400">
                              <ExternalLink className="w-3 h-3" />
                              Install
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
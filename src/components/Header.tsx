import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  WalletIcon, 
  Settings, 
  Menu, 
  ChevronDown, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Shield,
  Globe
} from "lucide-react";

interface WalletState {
  isConnected: boolean;
  address?: string;
  chain?: string;
  balance?: string;
}

const Header = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false
  });
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [selectedChain, setSelectedChain] = useState("ethereum");

  const chains = [
    {
      id: "ethereum",
      name: "Ethereum",
      icon: "🔵",
      wallet: "MetaMask",
      description: "Smart contracts & DeFi"
    },
    {
      id: "stellar",
      name: "Stellar",
      icon: "⭐",
      wallet: "Freighter",
      description: "Fast & low-cost transfers"
    },
    {
      id: "polygon",
      name: "Polygon",
      icon: "🟣",
      wallet: "MetaMask",
      description: "Ethereum scaling solution"
    }
  ];

  const handleConnect = async (chainId: string) => {
    setSelectedChain(chainId);
    setShowWalletSelector(false);
    
    // Simulate wallet connection
    setWalletState({
      isConnected: true,
      address: "0x1234...5678",
      chain: chainId,
      balance: chainId === "ethereum" ? "2.5 ETH" : chainId === "stellar" ? "1000 XLM" : "500 MATIC"
    });
  };

  const handleDisconnect = () => {
    setWalletState({ isConnected: false });
  };

  const getChainInfo = () => chains.find(chain => chain.id === selectedChain);

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
                {getChainInfo()?.icon} {getChainInfo()?.name}
              </Badge>
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
                      onClick={() => handleConnect(chain.id)}
                      className="p-3 rounded-lg border border-border hover:border-neon-cyan/40 cursor-pointer transition-all hover:bg-space-gray/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-xl">{chain.icon}</div>
                          <div>
                            <h5 className="font-medium text-white">{chain.name}</h5>
                            <p className="text-sm text-muted-foreground">{chain.description}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {chain.wallet}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          Fast
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
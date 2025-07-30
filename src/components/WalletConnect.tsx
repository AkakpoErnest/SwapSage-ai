import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  ChevronDown, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
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

const WalletConnect = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false
  });
  const [showChainSelector, setShowChainSelector] = useState(false);
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
    setShowChainSelector(false);
    
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
    <Card className="p-6 h-[600px] flex flex-col bg-gradient-to-br from-space-gray/50 to-deep-space/50 border-neon-cyan/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Wallet & Network</h3>
          <p className="text-sm text-muted-foreground">Connect your wallet to start swapping</p>
        </div>
      </div>

      {!walletState.isConnected ? (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-neon-cyan" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h4>
            <p className="text-muted-foreground">Choose your preferred blockchain network</p>
          </div>

          {/* Chain Selection */}
          <div className="space-y-3">
            {chains.map((chain) => (
              <div
                key={chain.id}
                onClick={() => handleConnect(chain.id)}
                className="p-4 rounded-lg border border-border hover:border-neon-cyan/40 cursor-pointer transition-all hover:bg-space-gray/50 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{chain.icon}</div>
                    <div>
                      <h5 className="font-medium text-white">{chain.name}</h5>
                      <p className="text-sm text-muted-foreground">{chain.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {chain.wallet}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="w-3 h-3" />
                      Fast
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      Secure
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="mt-6 p-4 rounded-lg bg-space-gray/30 border border-border">
            <h5 className="font-medium text-white mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-neon-cyan" />
              Cross-Chain Features
            </h5>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Atomic swaps between networks
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Real-time price feeds
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Secure HTLC contracts
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Connected State */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <h4 className="font-medium text-white">Wallet Connected</h4>
                <p className="text-sm text-muted-foreground">{walletState.address}</p>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="p-4 rounded-lg bg-space-gray/30 border border-border mb-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-white">Current Network</h5>
              <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                {getChainInfo()?.icon} {getChainInfo()?.name}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance:</span>
                <span className="text-white font-medium">{walletState.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="text-white">{getChainInfo()?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet:</span>
                <span className="text-white">{getChainInfo()?.wallet}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
              onClick={() => setShowChainSelector(!showChainSelector)}
            >
              <Globe className="w-4 h-4 mr-2" />
              Switch Network
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-border hover:border-red-400/30 text-red-400 hover:bg-red-400/10"
              onClick={handleDisconnect}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>

          {/* Network Selector */}
          {showChainSelector && (
            <div className="mt-4 p-4 rounded-lg bg-space-gray/30 border border-border">
              <h6 className="font-medium text-white mb-3">Select Network</h6>
              <div className="space-y-2">
                {chains.map((chain) => (
                  <div
                    key={chain.id}
                    onClick={() => handleConnect(chain.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedChain === chain.id 
                        ? 'border-neon-cyan/40 bg-neon-cyan/10' 
                        : 'border-border hover:border-neon-cyan/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{chain.icon}</div>
                      <div>
                        <h6 className="font-medium text-white">{chain.name}</h6>
                        <p className="text-xs text-muted-foreground">{chain.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default WalletConnect;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Zap } from "lucide-react";

interface Network {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  status: 'live' | 'testnet' | 'coming-soon';
  description: string;
}

const networks: Network[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    color: 'ethereum-purple',
    status: 'live',
    description: 'Mainnet with full DeFi ecosystem'
  },
  {
    id: 'stellar',
    name: 'Stellar',
    symbol: 'XLM',
    icon: '🌟',
    color: 'stellar-blue',
    status: 'testnet',
    description: 'Fast, low-cost payments network'
  },
  {
    id: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    icon: '🅰️',
    color: 'neon-green',
    status: 'coming-soon',
    description: 'Next-gen blockchain for scalable apps'
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    symbol: 'ATOM',
    icon: '⚛️',
    color: 'neon-purple',
    status: 'coming-soon',
    description: 'Internet of blockchains'
  }
];

const NetworkSelector = () => {
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(['ethereum', 'stellar']);

  const toggleNetwork = (networkId: string) => {
    if (networks.find(n => n.id === networkId)?.status === 'coming-soon') return;
    
    setSelectedNetworks(prev => 
      prev.includes(networkId)
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">Live</Badge>;
      case 'testnet':
        return <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">Testnet</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>;
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-neon-cyan/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold">Supported Networks</h3>
        </div>

        <div className="grid gap-3">
          {networks.map((network) => (
            <div
              key={network.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedNetworks.includes(network.id)
                  ? 'border-neon-cyan bg-neon-cyan/5'
                  : 'border-border hover:border-border/60'
              } ${
                network.status === 'coming-soon' 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:bg-space-gray/50'
              }`}
              onClick={() => toggleNetwork(network.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{network.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{network.name}</h4>
                      {selectedNetworks.includes(network.id) && network.status !== 'coming-soon' && (
                        <CheckCircle className="w-4 h-4 text-neon-cyan" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{network.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(network.status)}
                  {network.status === 'live' && (
                    <div className="flex items-center gap-1 text-xs text-neon-green">
                      <Zap className="w-3 h-3" />
                      <span>Active</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>🔒 SwapSage AI currently supports Ethereum ↔ Stellar cross-chain swaps.</p>
          <p>More networks coming soon with modular architecture.</p>
        </div>
      </div>
    </Card>
  );
};

export default NetworkSelector;
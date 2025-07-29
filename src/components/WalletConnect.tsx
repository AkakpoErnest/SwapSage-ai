import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export default function WalletConnect() {
  const {
    ethereum,
    stellar,
    isConnecting,
    connectEthereum,
    connectStellar,
    disconnectEthereum,
    disconnectStellar,
    switchEthereumNetwork,
    switchStellarNetwork,
  } = useWallet();

  return (
    <Card className="p-6 bg-gradient-card border-neon-cyan/20">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-neon-cyan" />
        <h3 className="text-lg font-semibold">Wallet Connections</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Ethereum Wallet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-neon-cyan">Ethereum</h4>
            {ethereum && (
              <CheckCircle className="w-4 h-4 text-neon-green" />
            )}
          </div>
          
          {ethereum ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {ethereum.address.slice(0, 6)}...{ethereum.address.slice(-4)}
              </p>
              <p className="text-xs text-muted-foreground">
                Chain ID: {ethereum.chainId}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => switchEthereumNetwork(1)}
                  disabled={ethereum.chainId === 1}
                >
                  Mainnet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => switchEthereumNetwork(11155111)}
                  disabled={ethereum.chainId === 11155111}
                >
                  Sepolia
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={disconnectEthereum}
                className="w-full"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="neon"
              onClick={connectEthereum}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
          )}
        </div>

        {/* Stellar Wallet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-neon-purple">Stellar</h4>
            {stellar && (
              <CheckCircle className="w-4 h-4 text-neon-green" />
            )}
          </div>
          
          {stellar ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {stellar.publicKey.slice(0, 6)}...{stellar.publicKey.slice(-4)}
              </p>
              <p className="text-xs text-muted-foreground">
                Network: {stellar.network}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => switchStellarNetwork('MAINNET')}
                  disabled={stellar.network === 'MAINNET'}
                >
                  Mainnet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => switchStellarNetwork('TESTNET')}
                  disabled={stellar.network === 'TESTNET'}
                >
                  Testnet
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={disconnectStellar}
                className="w-full"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="ai"
              onClick={connectStellar}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect Freighter'}
            </Button>
          )}
        </div>
      </div>

      {/* Cross-chain Status */}
      {ethereum && stellar && (
        <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/20 rounded-lg">
          <div className="flex items-center gap-2 text-neon-green">
            <ArrowRightLeft className="w-4 h-4" />
            <span className="text-sm font-medium">
              Cross-chain swaps ready! Both wallets connected.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
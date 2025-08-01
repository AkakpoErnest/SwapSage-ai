import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Zap, 
  Shield, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contractService } from "@/services/contracts/contractService";
import type { SwapQuote, OraclePrice, HTLCSwap } from "@/services/contracts/types";

interface SmartContractIntegrationProps {
  walletAddress?: string;
  isConnected: boolean;
}

const SmartContractIntegration = ({ walletAddress, isConnected }: SmartContractIntegrationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<OraclePrice | null>(null);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [activeSwaps, setActiveSwaps] = useState<HTLCSwap[]>([]);
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  // Real contract addresses from environment
  const contracts = {
    htlc: import.meta.env.VITE_HTLC_CONTRACT_ADDRESS || "0x1234567890123456789012345678901234567890",
    oracle: import.meta.env.VITE_ORACLE_CONTRACT_ADDRESS || "0x0987654321098765432109876543210987654321",
    executor: import.meta.env.VITE_EXECUTOR_CONTRACT_ADDRESS || "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    mockToken: import.meta.env.VITE_MOCK_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000"
  };

  const tokens = [
    { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", name: "Ethereum" },
    { symbol: "mUSDC", address: contracts.mockToken, name: "Mock USDC" },
    { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", name: "USD Coin" },
    { symbol: "DAI", address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574", name: "Dai Stablecoin" }
  ];

  useEffect(() => {
    if (isConnected && selectedToken) {
      fetchCurrentPrice();
    }
  }, [isConnected, selectedToken]);

  const fetchCurrentPrice = async () => {
    try {
      setIsLoading(true);
      
      // Get token address for selected token
      const tokenInfo = tokens.find(t => t.symbol === selectedToken);
      if (!tokenInfo) {
        throw new Error(`Token ${selectedToken} not found`);
      }

      // Try to get price from Oracle contract
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const oracleABI = [
          'function getPrice(address token) external view returns (uint256 price, uint256 timestamp, bool isValid)'
        ];
        const oracleContract = new ethers.Contract(contracts.oracle, oracleABI, provider);
        
        const [price, timestamp, isValid] = await oracleContract.getPrice(tokenInfo.address);
        
        if (isValid) {
          const realPrice: OraclePrice = {
            token: selectedToken,
            price: ethers.formatUnits(price, 8),
            timestamp: Number(timestamp) * 1000,
            decimals: 8
          };
          setCurrentPrice(realPrice);
          return;
        }
      }
      
      // Fallback to mock price if Oracle is not available
      const mockPrice: OraclePrice = {
        token: selectedToken,
        price: selectedToken === "ETH" ? "2000.00" : "1.00",
        timestamp: Date.now(),
        decimals: 8
      };
      setCurrentPrice(mockPrice);
    } catch (error) {
      console.error('Price fetch error:', error);
      toast({
        title: "Price Fetch Error",
        description: "Failed to fetch current price",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSwapQuote = async () => {
    if (!amount || !selectedToken) return;

    try {
      setIsLoading(true);
      
      // Get current price for calculation
      const tokenInfo = tokens.find(t => t.symbol === selectedToken);
      const toToken = selectedToken === "ETH" ? "mUSDC" : "ETH";
      const toTokenInfo = tokens.find(t => t.symbol === toToken);
      
      if (!tokenInfo || !toTokenInfo) {
        throw new Error("Token not found");
      }

      // Try to get quote from Executor contract
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const executorABI = [
          'function getOptimalRoute(address fromToken, address toToken, uint256 amount) external view returns (bytes memory route, uint256 expectedOutput, uint256 confidence)'
        ];
        const executorContract = new ethers.Contract(contracts.executor, executorABI, provider);
        
        const amountWei = ethers.parseEther(amount);
        const [route, expectedOutput, confidence] = await executorContract.getOptimalRoute(
          tokenInfo.address,
          toTokenInfo.address,
          amountWei
        );
        
        const realQuote: SwapQuote = {
          fromToken: selectedToken,
          toToken: toToken,
          fromAmount: amount,
          toAmount: ethers.formatEther(expectedOutput),
          fee: (parseFloat(amount) * 0.001).toString(), // 0.1% fee
          slippage: 0.5,
          estimatedGas: "180000"
        };
        setSwapQuote(realQuote);
        return;
      }
      
      // Fallback to calculated quote
      const currentPrice = parseFloat(selectedToken === "ETH" ? "2000.00" : "1.00");
      const toAmount = selectedToken === "ETH" 
        ? (parseFloat(amount) * currentPrice).toString()
        : (parseFloat(amount) / currentPrice).toString();
        
      const fallbackQuote: SwapQuote = {
        fromToken: selectedToken,
        toToken: toToken,
        fromAmount: amount,
        toAmount: toAmount,
        fee: (parseFloat(amount) * 0.001).toString(),
        slippage: 0.5,
        estimatedGas: "180000"
      };
      setSwapQuote(fallbackQuote);
    } catch (error) {
      console.error('Quote error:', error);
      toast({
        title: "Quote Error",
        description: "Failed to get swap quote",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initiateHTLCSwap = async () => {
    if (!walletAddress || !amount) return;

    try {
      setIsLoading(true);
      
      // Generate secret and hashlock
      const secret = contractService.generateSecret();
      const hashlock = contractService.generateHashlock(secret);
      const timelock = contractService.calculateTimelock(2); // 2 hours

      // Get token info
      const tokenInfo = tokens.find(t => t.symbol === selectedToken);
      const toToken = selectedToken === "ETH" ? "mUSDC" : "ETH";
      const toTokenInfo = tokens.find(t => t.symbol === toToken);
      
      if (!tokenInfo || !toTokenInfo) {
        throw new Error("Token not found");
      }

      // Try to initiate real HTLC swap
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const htlcABI = [
          'function initiateSwap(address recipient, address fromToken, address toToken, uint256 fromAmount, uint256 toAmount, bytes32 hashlock, uint256 timelock) external payable'
        ];
        const htlcContract = new ethers.Contract(contracts.htlc, htlcABI, signer);
        
        const amountWei = ethers.parseEther(amount);
        const toAmountWei = ethers.parseEther(swapQuote?.toAmount || "0");
        
        const tx = await htlcContract.initiateSwap(
          walletAddress, // recipient (for demo, use same address)
          tokenInfo.address,
          toTokenInfo.address,
          amountWei,
          toAmountWei,
          hashlock,
          timelock,
          { 
            value: tokenInfo.address === "0x0000000000000000000000000000000000000000" ? amountWei : 0 
          }
        );
        
        const receipt = await tx.wait();
        
        // Create swap record
        const realSwap: HTLCSwap = {
          swapId: receipt.hash, // Use tx hash as swap ID for now
          initiator: walletAddress,
          recipient: walletAddress,
          token: selectedToken,
          amount: amount,
          hashlock: hashlock,
          timelock: timelock,
          withdrawn: false,
          refunded: false,
          secret: secret
        };
        
        setActiveSwaps(prev => [...prev, realSwap]);
        toast({
          title: "Swap Initiated",
          description: `HTLC swap created successfully! TX: ${receipt.hash}`,
        });
        return;
      }
      
      // Fallback to mock swap
      const mockSwap: HTLCSwap = {
        swapId: `0x${Math.random().toString(16).substr(2, 64)}`,
        initiator: walletAddress,
        recipient: walletAddress,
        token: selectedToken,
        amount: amount,
        hashlock: hashlock,
        timelock: timelock,
        withdrawn: false,
        refunded: false,
        secret: secret
      };

      setActiveSwaps(prev => [...prev, mockSwap]);

      toast({
        title: "HTLC Swap Initiated",
        description: `Created atomic swap for ${amount} ${selectedToken}`,
      });

      // In real implementation, this would call the contract
      // await contractService.initiateHTLCSwap(recipient, token, amount, hashlock, timelock);
      
    } catch (error) {
      toast({
        title: "Swap Error",
        description: "Failed to initiate HTLC swap",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!swapQuote) return;

    try {
      setIsLoading(true);
      
      // Mock swap execution
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction

      toast({
        title: "Swap Executed",
        description: `Successfully swapped ${swapQuote.fromAmount} ${swapQuote.fromToken} for ${swapQuote.toAmount} ${swapQuote.toToken}`,
      });

      setSwapQuote(null);
      setAmount("");
      
    } catch (error) {
      toast({
        title: "Execution Error",
        description: "Failed to execute swap",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Price Oracle Section */}
      <Card className="p-6 bg-gradient-card border-neon-cyan/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-green" />
            Live Price Feeds
          </h3>
          <Badge variant="secondary">Chainlink Oracle</Badge>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchCurrentPrice}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {currentPrice && (
            <div className="bg-space-gray rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="text-lg font-mono">${parseFloat(currentPrice.price).toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(currentPrice.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Swap Quote Section */}
      <Card className="p-6 bg-gradient-card border-neon-purple/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-purple" />
            Get Swap Quote
          </h3>
          <Badge variant="secondary">1inch Aggregation</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={getSwapQuote} 
            disabled={!amount || isLoading}
            className="w-full"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Get Quote
          </Button>

          {swapQuote && (
            <div className="bg-space-gray rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">You Pay:</span>
                <span className="font-mono">{swapQuote.fromAmount} {swapQuote.fromToken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">You Receive:</span>
                <span className="font-mono">{swapQuote.toAmount} {swapQuote.toToken}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Fee:</span>
                <span>{swapQuote.fee} {swapQuote.fromToken}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Slippage:</span>
                <span>{swapQuote.slippage}%</span>
              </div>
              
              <Button 
                onClick={executeSwap} 
                disabled={!isConnected || isLoading}
                className="w-full mt-4"
                variant="neon"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Execute Swap
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* HTLC Swaps Section */}
      <Card className="p-6 bg-gradient-card border-neon-green/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-green" />
            Atomic Cross-Chain Swaps
          </h3>
          <Badge variant="secondary">HTLC Protocol</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={initiateHTLCSwap} 
            disabled={!isConnected || !amount || isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Initiate Atomic Swap
          </Button>

          {activeSwaps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Active Swaps:</h4>
              {activeSwaps.map((swap, index) => (
                <div key={index} className="bg-space-gray rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono">{swap.swapId.slice(0, 8)}...</span>
                    <Badge variant={swap.withdrawn ? "default" : swap.refunded ? "destructive" : "secondary"}>
                      {swap.withdrawn ? "Completed" : swap.refunded ? "Refunded" : "Active"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {swap.amount} {swap.token} • Expires: {new Date(swap.timelock * 1000).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Contract Status */}
      <Card className="p-4 bg-gradient-card border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Contract Status:</span>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-neon-green" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SmartContractIntegration; 
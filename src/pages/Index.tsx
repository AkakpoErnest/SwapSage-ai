import { useState } from "react";
import Header from "@/components/Header";
import AIChat from "@/components/AIChat";
import SwapInterface from "@/components/SwapInterface";
import TransactionProgress from "@/components/TransactionProgress";
import NetworkSelector from "@/components/NetworkSelector";
import SmartContractIntegration from "@/components/SmartContractIntegration";
import Dashboard from "@/components/Dashboard";
import AnimatedBackground from "@/components/AnimatedBackground";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  // Mock wallet state - in real app this would come from useWallet hook
  const mockWalletState = {
    isConnected: true,
    address: "0x1234567890123456789012345678901234567890"
  };

  const [activeTab, setActiveTab] = useState("swap");

  return (
    <div className="min-h-screen bg-gradient-space relative">
      <AnimatedBackground />
      <Header />
      
      {/* Hero Section */}
      <section 
        className="relative py-20 px-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-deep-space/80 backdrop-blur-sm" />
        <div className="relative container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-float">
              SwapSage AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground animate-pulse-glow">
              Ask. Swap. Done.
            </p>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              The first AI-powered cross-chain DeFi assistant. Simply tell us what you want to swap 
              and we'll handle the complex routing across Ethereum, Stellar, and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* AI Assistant & Wallet Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            AI-Powered Cross-Chain Swaps
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Just tell our AI what you want to swap. Natural language commands, intelligent routing, atomic execution.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <AIChat />
        </div>
      </section>

      {/* Main Application Interface */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-space-gray rounded-lg p-1">
              <button
                onClick={() => setActiveTab("swap")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === "swap"
                    ? "bg-neon-cyan text-black shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                🔄 Swap Interface
              </button>
              <button
                onClick={() => setActiveTab("contracts")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === "contracts"
                    ? "bg-neon-cyan text-black shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                🔗 Smart Contracts
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === "dashboard"
                    ? "bg-neon-cyan text-black shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === "ai"
                    ? "bg-neon-cyan text-black shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                🤖 AI Assistant
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "swap" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  ⚡ Swap Interface
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Execute cross-chain swaps with real-time quotes and transaction monitoring.
                </p>
              </div>
              <div className="grid lg:grid-cols-2 gap-8">
                <SwapInterface />
                <div className="space-y-6">
                  <TransactionProgress />
                  <NetworkSelector />
                </div>
              </div>
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  🔗 Smart Contract Integration
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Live price feeds, atomic swaps, and real-time contract interactions powered by Chainlink and 1inch.
                </p>
              </div>
              <SmartContractIntegration 
                walletAddress={mockWalletState.address}
                isConnected={mockWalletState.isConnected}
              />
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  📊 System Dashboard
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Real-time monitoring of all system activities, transactions, and network status.
                </p>
              </div>
              <Dashboard 
                walletAddress={mockWalletState.address}
                isConnected={mockWalletState.isConnected}
              />
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  🤖 AI Assistant
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Natural language interface for executing swaps and getting market insights.
                </p>
              </div>
              <AIChat />
            </div>
          )}
        </div>
      </section>

      {/* Main Interface */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Swap Interface */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  ⚡ Manual Swap Interface
                </h2>
                <SwapInterface />
              </div>
            </div>

            {/* Right Column - Progress & Networks */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  📊 Transaction Status
                </h2>
                <TransactionProgress />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  🌐 Networks
                </h2>
                <NetworkSelector />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powered by Advanced Tech</h2>
            <p className="text-muted-foreground">Built on cutting-edge protocols for seamless cross-chain experiences</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-gradient-card border border-neon-cyan/20 text-center card-glow particle-effect animate-float">
              <div className="text-3xl mb-4 animate-pulse-glow">🔄</div>
              <h3 className="font-semibold mb-2">1inch Integration</h3>
              <p className="text-sm text-muted-foreground">
                Best swap rates using 1inch Aggregation API and Fusion+ for cross-chain execution
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-gradient-card border border-neon-purple/20 text-center card-glow particle-effect animate-float" style={{ animationDelay: '2s' }}>
              <div className="text-3xl mb-4 animate-pulse-glow">🔒</div>
              <h3 className="font-semibold mb-2">Atomic Swaps</h3>
              <p className="text-sm text-muted-foreground">
                Secure Hash Time Lock Contracts (HTLC) ensure trustless cross-chain transactions
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-gradient-card border border-neon-green/20 text-center card-glow particle-effect animate-float" style={{ animationDelay: '4s' }}>
              <div className="text-3xl mb-4 animate-pulse-glow">🧠</div>
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Natural language processing transforms your words into perfect swap instructions
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

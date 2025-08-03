import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Network, 
  Activity, 
  Bot, 
  Zap, 
  Shield, 
  Settings, 
  WalletIcon,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import EnhancedSwapInterface from "@/components/EnhancedSwapInterface";
import AIChat from "@/components/AIChat";
import Dashboard from "@/components/Dashboard";

import TransactionProgress from "@/components/TransactionProgress";
import BridgeInterface from "@/components/BridgeInterface";
import TransactionHistory from "@/components/TransactionHistory";

import Header from "@/components/Header";
import { useWalletContext } from "@/contexts/WalletContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("swap");
  const { walletState, connectEthereum } = useWalletContext();

  // Wallet state management

  // Listen for tab switch events from header navigation
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchTab', handleTabSwitch as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleTabSwitch as EventListener);
    };
  }, []);

  const tabs = [
    { id: "swap", label: "Swap", icon: Coins },
    { id: "bridge", label: "Bridge", icon: Network },
    { id: "ai", label: "AI Assistant", icon: Bot },
    { id: "history", label: "History", icon: Activity },

    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "swap":
        return <EnhancedSwapInterface />;
      case "bridge":
        return <BridgeInterface />;
      case "history":
        return <TransactionHistory />;

      case "dashboard":
        return (
          <Dashboard 
            walletAddress={walletState.address}
            isConnected={walletState.isConnected}
          />
        );
      case "ai":
        return <AIChat />;
      default:
        return <EnhancedSwapInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space">
      <Header />
      
      {/* Floating AI Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setActiveTab("ai")}
          className="bg-gradient-primary hover:bg-gradient-primary/80 rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float-subtle bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-cyan bg-clip-text text-transparent">
            SwapSage AI Oracle
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The future of DeFi is here. Ask. Swap. Done.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-card/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-neon-cyan/20">
              <span className="text-neon-cyan">⚡ Lightning Fast</span>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-neon-cyan/20">
              <span className="text-neon-cyan">🔒 Secure HTLC</span>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-neon-cyan/20">
              <span className="text-neon-cyan">🤖 AI Powered</span>
            </div>
          </div>
          
          {/* Wallet Connection Test */}
          {!walletState.isConnected && (
            <div className="mb-8">
              <Button 
                onClick={async () => {
                  try {
                    await connectEthereum();
                  } catch (error) {
                    // Handle connection error silently
                  }
                }}
                className="bg-gradient-primary hover:bg-gradient-primary/80"
                size="lg"
              >
                <WalletIcon className="w-5 h-5 mr-2" />
                Connect Wallet (Test)
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => {
                setActiveTab("swap");
                // Scroll to main interface section
                const mainSection = document.querySelector('[data-section="main-interface"]');
                if (mainSection) {
                  mainSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30 px-8 py-3 text-lg"
            >
              Start Swapping
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              onClick={() => {
                setActiveTab("ai");
                // Scroll to main interface section
                const mainSection = document.querySelector('[data-section="main-interface"]');
                if (mainSection) {
                  mainSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              variant="outline"
              className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 px-8 py-3 text-lg"
            >
              Try AI Chat
              <Bot className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                <Bot className="w-8 h-8 text-neon-cyan" />
                AI Assistant
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Chat with our AI to execute swaps using natural language. 
                Support for multiple languages and intelligent routing.
              </p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-lg p-6 border border-neon-cyan/20">
              <div className="text-center">
                <Bot className="w-16 h-16 mx-auto mb-4 text-neon-cyan" />
                <h3 className="text-xl font-semibold mb-2">Ready to Chat?</h3>
                <p className="text-muted-foreground mb-4">
                  Use the AI Assistant tab above to start chatting with our AI
                </p>
                <div className="bg-background/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Try saying:</p>
                  <p className="text-neon-cyan font-medium">"I want to swap 1 ETH to USDC"</p>
                </div>
                <Button 
                  onClick={() => {
                    setActiveTab("ai");
                    // Scroll to main interface section
                    const mainSection = document.querySelector('[data-section="main-interface"]');
                    if (mainSection) {
                      mainSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30"
                >
                  Start AI Chat
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card/30 backdrop-blur-sm rounded-lg p-6 border border-neon-cyan/20 text-center">
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Sub-second swap execution</p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-lg p-6 border border-neon-cyan/20 text-center">
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Secure HTLC</h3>
              <p className="text-sm text-muted-foreground">Atomic cross-chain swaps</p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-lg p-6 border border-neon-cyan/20 text-center">
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Network className="w-6 h-6 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Multi-Chain</h3>
              <p className="text-sm text-muted-foreground">Ethereum, Polygon, Stellar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Application Interface */}
      <section className="py-12 px-4" data-section="main-interface">
        <div className="container mx-auto">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-neon-cyan border border-neon-cyan/40 shadow-lg shadow-neon-cyan/20"
                      : "bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent hover:border-neon-cyan/20"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose SwapSage AI?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of DeFi with AI-powered cross-chain swapping
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-3">1inch Integration</h3>
              <p className="text-muted-foreground text-sm">
                Get the best swap rates using 1inch's aggregation protocol across multiple DEXs
              </p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Atomic Swaps</h3>
              <p className="text-muted-foreground text-sm">
                Secure cross-chain swaps using Hash Time Lock Contracts with zero counterparty risk
              </p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-xl flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-3">AI-Powered</h3>
              <p className="text-muted-foreground text-sm">
                Natural language processing for intuitive DeFi interactions in multiple languages
              </p>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-xl flex items-center justify-center mb-4">
                <Network className="w-7 h-7 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Multi-Chain</h3>
              <p className="text-muted-foreground text-sm">
                Seamlessly swap between Ethereum, Polygon, Arbitrum, and Stellar networks
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

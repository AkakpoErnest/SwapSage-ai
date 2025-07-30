import { useState } from "react";
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
import SwapInterface from "@/components/SwapInterface";
import AIChat from "@/components/AIChat";
import Dashboard from "@/components/Dashboard";
import SmartContractIntegration from "@/components/SmartContractIntegration";
import TransactionProgress from "@/components/TransactionProgress";
import Header from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";

const Index = () => {
  const [activeTab, setActiveTab] = useState("swap");
  const { walletState } = useWallet();

  const tabs = [
    { id: "swap", label: "Swap", icon: Coins },
    { id: "bridge", label: "Bridge", icon: Network },
    { id: "history", label: "History", icon: Activity },
    { id: "contracts", label: "Smart Contracts", icon: Settings },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "ai", label: "AI Assistant", icon: Bot },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "swap":
        return <SwapInterface />;
      case "bridge":
        return (
          <div className="text-center py-12">
            <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Cross-Chain Bridge</h3>
            <p className="text-muted-foreground">
              Bridge tokens between Ethereum and Stellar networks
            </p>
          </div>
        );
      case "history":
        return <TransactionProgress />;
      case "contracts":
        return <SmartContractIntegration 
          walletAddress={walletState.address}
          isConnected={walletState.isConnected}
        />;
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
        return <SwapInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space">
      <Header /> {/* Add the Header component here */}
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float-subtle">
            SwapSage AI Oracle
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The future of DeFi is here. Ask. Swap. Done.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
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
        </div>
      </section>

      {/* AI Assistant & Wallet Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                <Bot className="w-8 h-8 text-neon-cyan" />
                AI Assistant
              </h2>
              <p className="text-muted-foreground mb-6">
                Chat with our AI to execute swaps using natural language. 
                Support for multiple languages and intelligent routing.
              </p>
              <div className="bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-neon-cyan/20">
                <p className="text-center text-muted-foreground mb-4">
                  Use the AI Assistant tab above to start chatting with our AI
                </p>
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-2 text-neon-cyan" />
                  <p className="text-sm text-muted-foreground">
                    Try saying: "I want to swap 1 ETH to USDC"
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-8 h-8 text-neon-cyan" />
                Transaction Monitor
              </h2>
              <p className="text-muted-foreground mb-6">
                Track your swap transactions in real-time with detailed progress updates.
              </p>
              <div className="bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-neon-cyan/20">
                <p className="text-center text-muted-foreground mb-4">
                  Monitor your transactions in the Transaction Progress tab above
                </p>
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-neon-cyan" />
                  <p className="text-sm text-muted-foreground">
                    Real-time status updates and confirmations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Application Interface */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40"
                      : "bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
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
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose SwapSage AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-neon-cyan" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1inch Integration</h3>
              <p className="text-muted-foreground">
                Get the best swap rates using 1inch's aggregation protocol
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-neon-cyan" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Atomic Swaps</h3>
              <p className="text-muted-foreground">
                Secure cross-chain swaps using Hash Time Lock Contracts
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-neon-cyan" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-muted-foreground">
                Natural language processing for intuitive DeFi interactions
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

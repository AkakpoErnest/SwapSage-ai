import { Button } from "@/components/ui/button";
import { WalletIcon, Settings, Menu } from "lucide-react";

const Header = () => {
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
        <div className="flex items-center gap-3">
          <Button variant="chain" size="sm" className="hidden sm:flex">
            <WalletIcon className="w-4 h-4" />
            Connect Wallet
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
import { Home, LayoutDashboard, DollarSign, CreditCard, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: DollarSign, label: "Receitas", path: "/dashboard#receitas" },
    { icon: CreditCard, label: "Despesas", path: "/dashboard#despesas" },
    { icon: HelpCircle, label: "Ajuda", path: "/dashboard#ajuda" },
  ];

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">M</span>
              </div>
              <span className="text-lg font-bold text-foreground hidden md:block">MEI Gestão</span>
            </div>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path.includes("#") && location.pathname === "/dashboard");
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Button variant="default" size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">Falar com Contador</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;

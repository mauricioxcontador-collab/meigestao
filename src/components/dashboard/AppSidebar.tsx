import { Home, DollarSign, TrendingDown, User, LogOut, Menu, X, Target, BarChart2, FileText, Users, Briefcase, Calculator, Tag } from "lucide-react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const meiMenuItems = [
  { title: "Dashboard", tab: "dashboard", icon: Home },
  { title: "Receitas", tab: "receitas", icon: DollarSign },
  { title: "Despesas", tab: "despesas", icon: TrendingDown },
  { title: "Impostos", tab: "impostos", icon: Calculator },
  { title: "Trabalhista", tab: "trabalhista", icon: Briefcase, isRoute: true },
  { title: "Precificação", tab: "precificacao", icon: Tag, isRoute: true },
  { title: "Metas", tab: "metas", icon: Target, isRoute: true },
  { title: "Gráficos", tab: "graficos", icon: BarChart2, isRoute: true },
  { title: "Relatórios", tab: "relatorios", icon: FileText, isRoute: true },
  { title: "Meu Contador", tab: "contador-gestao", icon: Users },
  { title: "Minha Conta", tab: "conta", icon: User },
];

const contadorMenuItems = [
  { title: "Dashboard", tab: "dashboard", icon: Home, basePath: "/contador" },
  { title: "Meus Clientes", tab: "contador-gestao", icon: Users, basePath: "/contador" },
  { title: "Minha Conta", tab: "conta", icon: User, basePath: "/contador" },
];

interface AppSidebarProps {
  userEmail: string;
  onLogout: () => void;
}

export function AppSidebar({ userEmail, onLogout }: AppSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isContador, isLoading: roleLoading } = useUserRole();
  const currentTab = searchParams.get("tab") || "dashboard";
  const currentPath = location.pathname;

  const menuItems = useMemo(() => {
    return isContador ? contadorMenuItems : meiMenuItems;
  }, [isContador]);
  const handleTabChange = (item: typeof menuItems[0]) => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setExpanded(false);
    }
    
    const tab = item.tab;
    const isRoute = 'isRoute' in item && item.isRoute;
    const basePath = 'basePath' in item ? item.basePath : '/dashboard';
    
    if (isRoute) {
      navigate(`/${tab}`);
      return;
    }
    
    // For contador menu items with basePath
    if (basePath === "/contador") {
      if (tab === "dashboard") {
        navigate("/contador");
      } else {
        navigate(`/contador?tab=${tab}`);
      }
      return;
    }
    
    // Default behavior for MEI
    if (currentPath !== "/dashboard") {
      if (tab === "dashboard") {
        navigate("/dashboard");
      } else {
        navigate(`/dashboard?tab=${tab}`);
      }
      return;
    }
    
    if (tab === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const isItemActive = (item: typeof menuItems[0]) => {
    const isRoute = 'isRoute' in item && item.isRoute;
    const basePath = 'basePath' in item ? item.basePath : '/dashboard';
    
    if (isRoute) {
      return currentPath === `/${item.tab}`;
    }
    
    if (basePath === "/contador") {
      if (item.tab === "dashboard") {
        return currentPath === "/contador" && !searchParams.get("tab");
      }
      return currentPath === "/contador" && currentTab === item.tab;
    }
    
    return currentPath === "/dashboard" && currentTab === item.tab;
  };

  return (
    <>
      {/* Mobile overlay */}
      {expanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Mobile toggle button - only show when sidebar is closed */}
      {!expanded && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(true)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-40 h-screen transition-all duration-300 ease-in-out",
          "bg-sidebar flex flex-col",
          expanded ? "w-72 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/10 rounded-xl blur" />
                <img 
                  src={logoMeiGestao} 
                  alt="MEI Gestão" 
                  className="relative h-12 w-12 object-contain"
                />
              </div>
              {expanded && (
                <div className="overflow-hidden">
                  <h2 className="font-bold text-sidebar-foreground text-lg">MEI Gestão</h2>
                  <p className="text-xs text-sidebar-foreground/50 truncate max-w-[160px]">{userEmail}</p>
                </div>
              )}
            </div>
            {/* Mobile close button inside sidebar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(false)}
              className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Toggle button (desktop) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-primary rounded-full items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
        >
          <svg
            className={cn("w-4 h-4 transition-transform", expanded ? "rotate-180" : "")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = isItemActive(item);
            return (
              <button
                key={item.tab}
                onClick={() => handleTabChange(item)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200",
                  "text-left group",
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-border"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform",
                  isActive ? "text-white" : "group-hover:scale-110"
                )} />
                {expanded && (
                  <span className="font-medium truncate">{item.title}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200",
              "text-destructive hover:bg-destructive/10"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {expanded && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

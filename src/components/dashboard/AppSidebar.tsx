import { Home, DollarSign, TrendingDown, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", tab: "dashboard", icon: Home },
  { title: "Receitas", tab: "receitas", icon: DollarSign },
  { title: "Despesas", tab: "despesas", icon: TrendingDown },
  { title: "Conta do Cliente", tab: "conta", icon: User },
];

interface AppSidebarProps {
  userEmail: string;
  onLogout: () => void;
}

export function AppSidebar({ userEmail, onLogout }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const handleTabChange = (tab: string) => {
    if (tab === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={logoMeiGestao} 
              alt="MEI Gestão" 
              className={`${collapsed ? "w-10 h-10" : "w-12 h-12"} object-contain transition-all duration-300`}
            />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <h2 className="text-base font-bold text-sidebar-foreground">MEI Gestão</h2>
              <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = currentTab === item.tab;
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      onClick={() => handleTabChange(item.tab)}
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        relative transition-all duration-200 rounded-xl h-12
                        ${isActive 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" 
                          : "hover:bg-sidebar-border text-sidebar-foreground/80 hover:text-sidebar-foreground"
                        }
                      `}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? "text-sidebar-primary-foreground" : ""}`} />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-border"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
        <SidebarMenuButton
          onClick={onLogout}
          tooltip="Sair"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-12"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

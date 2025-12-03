import { Home, DollarSign, TrendingDown, User, LogOut } from "lucide-react";
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
  const { state } = useSidebar();
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <img 
            src={logoMeiGestao} 
            alt="MEI Gestão" 
            className={`${collapsed ? "w-8 h-8" : "w-10 h-10"} object-contain transition-all`}
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-sidebar-foreground">MEI Gestão</h2>
              <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
            </div>
          )}
        </div>
        <SidebarTrigger className="mt-2" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = currentTab === item.tab;
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      onClick={() => handleTabChange(item.tab)}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenuButton
          onClick={onLogout}
          tooltip="Sair"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

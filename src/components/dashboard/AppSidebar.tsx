import { Home, DollarSign, TrendingDown, User, LogOut } from "lucide-react";
import { useSearchParams } from "react-router-dom";

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
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">MEI Gestão</h2>
            <p className="text-xs text-sidebar-foreground/60 truncate mt-1">{userEmail}</p>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary mx-auto" />
        )}
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

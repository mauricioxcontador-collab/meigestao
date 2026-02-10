import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, TrendingUp, FileText, DollarSign, TrendingDown, Loader2, Eye, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ClientDetailModal from "@/components/contador/ClientDetailModal";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AddClientForm } from "@/components/contador/AddClientForm";
import { InviteExistingClient } from "@/components/contador/InviteExistingClient";
import { ContadorRevenuesManager } from "@/components/contador/ContadorRevenuesManager";
import { useUserRole } from "@/hooks/useUserRole";

interface Client {
  id: string;
  mei_user_id: string;
  cnpj: string;
  razao_social: string;
  atividade: string | null;
  created_at: string;
  totalRevenue?: number;
  totalExpenses?: number;
  pendingObligations?: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
}

const DashboardContador = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { isMei, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && isMei) {
      navigate("/dashboard");
      return;
    }
  }, [roleLoading, isMei, navigate]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchClients(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchClients = async (userId: string) => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("contador_user_id", userId);

      if (clientsError) throw clientsError;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async (client) => {
          const [revenuesAll, expensesAll, revenuesMonth, expensesMonth, obligations] = await Promise.all([
            supabase.from("revenues").select("valor").eq("client_id", client.id),
            supabase.from("expenses").select("valor").eq("client_id", client.id),
            supabase.from("revenues").select("valor").eq("client_id", client.id).gte("data", startOfMonth).lte("data", endOfMonth),
            supabase.from("expenses").select("valor").eq("client_id", client.id).gte("data", startOfMonth).lte("data", endOfMonth),
            supabase.from("obligations").select("*").eq("client_id", client.id).eq("pago", false),
          ]);

          return {
            ...client,
            totalRevenue: revenuesAll.data?.reduce((sum, r) => sum + Number(r.valor), 0) || 0,
            totalExpenses: expensesAll.data?.reduce((sum, e) => sum + Number(e.valor), 0) || 0,
            monthlyRevenue: revenuesMonth.data?.reduce((sum, r) => sum + Number(r.valor), 0) || 0,
            monthlyExpenses: expensesMonth.data?.reduce((sum, e) => sum + Number(e.valor), 0) || 0,
            pendingObligations: obligations.data?.length || 0,
          };
        })
      );

      setClients(clientsWithStats);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({ title: "Erro ao carregar clientes", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logout realizado", description: "Até logo!" });
    navigate("/");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (!user) return null;

  const pendingAlerts = clients.reduce((sum, c) => sum + (c.pendingObligations || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AppSidebar userEmail={user?.email || ""} onLogout={handleLogout} />

      <main className="flex-1 min-h-screen overflow-auto">
        {/* === DASHBOARD TAB: Contador's own area === */}
        {currentTab === "dashboard" && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Meu Escritório</h1>
              <p className="text-muted-foreground">
                Gerencie seus honorários e receitas do escritório
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{clients.length}</div>
                  <p className="text-xs text-muted-foreground">MEIs vinculados</p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Pendentes</CardTitle>
                  <AlertCircle className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{pendingAlerts}</div>
                  <p className="text-xs text-muted-foreground">Obrigações vencendo</p>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Clientes</CardTitle>
                  <TrendingUp className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(clients.reduce((s, c) => s + (c.monthlyRevenue || 0), 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Mês atual (consolidado)</p>
                </CardContent>
              </Card>
            </div>

            {/* Contador's own revenues */}
            <ContadorRevenuesManager
              contadorUserId={user.id}
              clients={clients.map((c) => ({ id: c.id, razao_social: c.razao_social }))}
            />
          </div>
        )}

        {/* === MEUS CLIENTES TAB === */}
        {currentTab === "contador-gestao" && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Meus Clientes</h1>
              <p className="text-muted-foreground">
                Gerencie seus clientes MEI vinculados
              </p>
            </div>

            <Card className="border-border mb-8">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Clientes MEI
                    </CardTitle>
                    <CardDescription>Lista de todos os microempreendedores vinculados</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <InviteExistingClient
                      contadorUserId={user.id}
                      onSuccess={() => fetchClients(user.id)}
                    />
                    <AddClientForm
                      contadorUserId={user.id}
                      onSuccess={() => fetchClients(user.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cliente cadastrado ainda</p>
                    <p className="text-sm mt-2">Use os botões acima para adicionar ou vincular clientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{client.razao_social}</h3>
                            {client.pendingObligations && client.pendingObligations > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {client.pendingObligations} pendência(s)
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            CNPJ: {client.cnpj}
                            {client.atividade && ` • ${client.atividade}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cliente desde {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10">
                            <DollarSign className="w-4 h-4 text-success" />
                            <div>
                              <p className="text-xs text-muted-foreground">Receitas</p>
                              <p className="font-semibold text-success">{formatCurrency(client.totalRevenue || 0)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10">
                            <TrendingDown className="w-4 h-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Despesas</p>
                              <p className="font-semibold text-destructive">{formatCurrency(client.totalExpenses || 0)}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClient(client);
                              setModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <ClientDetailModal
              client={selectedClient}
              open={modalOpen}
              onOpenChange={setModalOpen}
            />
          </div>
        )}

        {/* === MINHA CONTA TAB === */}
        {currentTab === "conta" && (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Minha Conta</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardContador;

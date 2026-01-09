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
import ClientFinancialSummary from "@/components/contador/ClientFinancialSummary";
import RevenueExpenseChart from "@/components/contador/RevenueExpenseChart";
import MonthlyEvolutionChart from "@/components/contador/MonthlyEvolutionChart";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { ContadorInviteManager } from "@/components/contador/ContadorInviteManager";
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

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
  const [consolidatedData, setConsolidatedData] = useState<{
    monthlyChart: { month: string; receita: number; despesa: number }[];
    evolutionChart: { month: string; faturamento: number }[];
  }>({ monthlyChart: [], evolutionChart: [] });
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingAlerts: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
  });

  const { isMei, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    // Redirect MEI users to their dashboard
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

          const totalRevenue = revenuesAll.data?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
          const totalExpenses = expensesAll.data?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;
          const monthlyRevenue = revenuesMonth.data?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
          const monthlyExpenses = expensesMonth.data?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;

          return {
            ...client,
            totalRevenue,
            totalExpenses,
            monthlyRevenue,
            monthlyExpenses,
            pendingObligations: obligations.data?.length || 0,
          };
        })
      );

      setClients(clientsWithStats);

      const totalRevenue = clientsWithStats.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
      const totalExpenses = clientsWithStats.reduce((sum, c) => sum + (c.totalExpenses || 0), 0);
      const monthlyRevenue = clientsWithStats.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
      const monthlyExpenses = clientsWithStats.reduce((sum, c) => sum + (c.monthlyExpenses || 0), 0);
      const pendingAlerts = clientsWithStats.reduce((sum, c) => sum + (c.pendingObligations || 0), 0);

      setStats({
        totalClients: clientsWithStats.length,
        pendingAlerts,
        totalRevenue,
        totalExpenses,
        monthlyRevenue,
        monthlyExpenses,
      });

      // Fetch consolidated charts data
      await fetchConsolidatedCharts(clientsData || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConsolidatedCharts = async (clientsList: { id: string }[]) => {
    if (clientsList.length === 0) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);
    const startDate = twelveMonthsAgo.toISOString().split('T')[0];

    const clientIds = clientsList.map(c => c.id);

    const [revenuesRes, expensesRes] = await Promise.all([
      supabase.from('revenues').select('valor, data, client_id').in('client_id', clientIds).gte('data', startDate),
      supabase.from('expenses').select('valor, data, client_id').in('client_id', clientIds).gte('data', startDate),
    ]);

    const monthlyMap = new Map<string, { receita: number; despesa: number }>();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - 11 + i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { receita: 0, despesa: 0 });
    }

    revenuesRes.data?.forEach(r => {
      const date = new Date(r.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        const current = monthlyMap.get(key)!;
        current.receita += Number(r.valor);
      }
    });

    expensesRes.data?.forEach(e => {
      const date = new Date(e.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(key)) {
        const current = monthlyMap.get(key)!;
        current.despesa += Number(e.valor);
      }
    });

    const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    const monthlyChart = sortedEntries.map(([key, val]) => {
      const [, month] = key.split('-');
      return {
        month: MONTH_LABELS[parseInt(month) - 1],
        receita: val.receita,
        despesa: val.despesa,
      };
    });

    const evolutionChart = sortedEntries.map(([key, val]) => {
      const [, month] = key.split('-');
      return {
        month: MONTH_LABELS[parseInt(month) - 1],
        faturamento: val.receita,
      };
    });

    setConsolidatedData({ monthlyChart, evolutionChart });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const statsCards = [
    {
      title: "Clientes Ativos",
      value: stats.totalClients.toString(),
      description: "MEIs cadastrados",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Alertas Pendentes",
      value: stats.pendingAlerts.toString(),
      description: "Obrigações vencendo",
      icon: AlertCircle,
      color: "text-warning"
    },
    {
      title: "Receita Total",
      value: formatCurrency(stats.totalRevenue),
      description: "Faturamento dos clientes",
      icon: TrendingUp,
      color: "text-success"
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AppSidebar userEmail={user?.email || ""} onLogout={handleLogout} />
      
      <main className="flex-1 min-h-screen overflow-auto">
        {currentTab === "contador-gestao" ? (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Meus Clientes
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus convites e veja os clientes que você atende
              </p>
            </div>
            <ContadorInviteManager />
          </div>
        ) : currentTab === "conta" ? (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Minha Conta
              </h1>
              <p className="text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Bem-vindo, Contador!
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus clientes e acompanhe todas as obrigações
              </p>
            </div>

        {/* Monthly Financial Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Resumo Financeiro Mensal (Consolidado)
          </h2>
          <ClientFinancialSummary
            totalRevenue={stats.monthlyRevenue}
            totalExpenses={stats.monthlyExpenses}
            profit={stats.monthlyRevenue - stats.monthlyExpenses}
            clientName="Todos os clientes - Mês atual"
          />
        </div>

        {/* Charts Section */}
        {!loading && clients.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <RevenueExpenseChart 
              data={consolidatedData.monthlyChart} 
              title="Receita x Despesa (Consolidado)"
            />
            <MonthlyEvolutionChart 
              data={consolidatedData.evolutionChart}
              title="Evolução do Faturamento (12 meses)"
            />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clients List */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Clientes MEI
            </CardTitle>
            <CardDescription>
              Lista de todos os microempreendedores cadastrados
            </CardDescription>
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
                <p className="text-sm mt-2">
                  Os clientes aparecerão aqui quando aceitarem seu convite
                </p>
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
                        <h3 className="font-semibold text-foreground">
                          {client.razao_social}
                        </h3>
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

        {/* Pending Tasks */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Tarefas Pendentes
            </CardTitle>
            <CardDescription>
              Obrigações que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pendingAlerts === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Todas as obrigações estão em dia</p>
                <p className="text-sm mt-2">
                  Você será notificado quando houver pendências
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-warning" />
                <p className="text-warning font-medium">
                  {stats.pendingAlerts} obrigação(ões) pendente(s)
                </p>
                <p className="text-sm mt-2">
                  Verifique os detalhes de cada cliente acima
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Detail Modal */}
        <ClientDetailModal
          client={selectedClient}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardContador;

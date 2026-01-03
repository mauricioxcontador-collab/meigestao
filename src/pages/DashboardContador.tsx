import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, AlertCircle, TrendingUp, FileText, DollarSign, TrendingDown, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";

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
}

const DashboardContador = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingAlerts: 0,
    totalRevenue: 0,
  });

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
      // Fetch clients where this user is the contador
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("contador_user_id", userId);

      if (clientsError) throw clientsError;

      // For each client, fetch their financial summary
      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async (client) => {
          // Fetch revenues
          const { data: revenues } = await supabase
            .from("revenues")
            .select("valor")
            .eq("client_id", client.id);

          // Fetch expenses
          const { data: expenses } = await supabase
            .from("expenses")
            .select("valor")
            .eq("client_id", client.id);

          // Fetch pending obligations
          const { data: obligations } = await supabase
            .from("obligations")
            .select("*")
            .eq("client_id", client.id)
            .eq("pago", false);

          const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
          const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;

          return {
            ...client,
            totalRevenue,
            totalExpenses,
            pendingObligations: obligations?.length || 0,
          };
        })
      );

      setClients(clientsWithStats);

      // Calculate overall stats
      const totalRevenue = clientsWithStats.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
      const pendingAlerts = clientsWithStats.reduce((sum, c) => sum + (c.pendingObligations || 0), 0);

      setStats({
        totalClients: clientsWithStats.length,
        pendingAlerts,
        totalRevenue,
      });
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoMeiGestao} alt="MEI Gestão" className="h-10 w-10" />
            <div>
              <span className="text-xl font-bold text-foreground block">MEI Gestão</span>
              <span className="text-xs text-muted-foreground">Painel do Contador</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.email}
            </span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, Contador!
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe todas as obrigações
          </p>
        </div>

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
                      <Button variant="outline" size="sm">
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
      </div>
    </div>
  );
};

export default DashboardContador;

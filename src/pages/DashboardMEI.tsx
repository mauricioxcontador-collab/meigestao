import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, DollarSign, TrendingUp, AlertCircle, FileText, Upload, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExpensesManager } from "@/components/dashboard/ExpensesManager";
import { RevenuesManager } from "@/components/dashboard/RevenuesManager";
import { ClientRegistrationForm } from "@/components/dashboard/ClientRegistrationForm";

const DashboardMEI = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientActivity, setClientActivity] = useState<string>("");
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [annualRevenue, setAnnualRevenue] = useState<number>(0);
  const [showClientForm, setShowClientForm] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Load client data
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, atividade")
        .eq("mei_user_id", session.user.id)
        .maybeSingle();

      if (clientData) {
        setClientId(clientData.id);
        setClientActivity(clientData.atividade || "");
        loadRevenues(clientData.id);
      } else {
        setShowClientForm(true);
      }
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

  const loadRevenues = async (clientId: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get all revenues for the current year
    const { data: revenues, error } = await supabase
      .from("revenues")
      .select("valor, data")
      .eq("client_id", clientId)
      .gte("data", `${currentYear}-01-01`)
      .lte("data", `${currentYear}-12-31`);

    if (error) {
      console.error("Error loading revenues:", error);
      return;
    }

    if (revenues) {
      // Calculate annual revenue
      const annual = revenues.reduce((sum, rev) => sum + Number(rev.valor), 0);
      setAnnualRevenue(annual);

      // Calculate monthly revenue (current month)
      const monthly = revenues
        .filter((rev) => {
          const revenueDate = new Date(rev.data);
          return revenueDate.getMonth() === currentMonth && 
                 revenueDate.getFullYear() === currentYear;
        })
        .reduce((sum, rev) => sum + Number(rev.valor), 0);
      setMonthlyRevenue(monthly);
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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDASValue = (activity: string): number => {
    const activityLower = activity.toLowerCase();
    
    // Comércio e Serviços (simultaneamente)
    if (activityLower.includes("comércio") && activityLower.includes("serviço")) {
      return 81.90;
    }
    // Prestação de Serviços
    if (activityLower.includes("serviço")) {
      return 80.90;
    }
    // Comércio ou Indústria (padrão)
    return 76.90;
  };

  const getDASDescription = (): string => {
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 20);
    
    return `Vencimento: ${dueDate.toLocaleDateString('pt-BR')}`;
  };

  const percentageUsed = ((annualRevenue / 81000) * 100).toFixed(1);

  const metrics = [
    {
      title: "Faturamento Mensal",
      value: formatCurrency(monthlyRevenue),
      description: "Mês atual",
      icon: DollarSign,
      color: "text-primary"
    },
    {
      title: "Faturamento Anual",
      value: formatCurrency(annualRevenue),
      description: `${percentageUsed}% do limite (R$ 81.000,00)`,
      icon: TrendingUp,
      color: annualRevenue > 81000 ? "text-destructive" : "text-success"
    },
    {
      title: "DAS do Mês",
      value: formatCurrency(getDASValue(clientActivity)),
      description: getDASDescription(),
      icon: AlertCircle,
      color: "text-warning"
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary" />
            <span className="text-xl font-bold text-foreground">MEI Gestão</span>
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
        {showClientForm ? (
          <ClientRegistrationForm 
            userId={user.id} 
            onSuccess={(newClientId) => {
              setClientId(newClientId);
              setShowClientForm(false);
              loadRevenues(newClientId);
            }} 
          />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Olá, {user?.user_metadata?.full_name || "MEI"}!
              </h1>
              <p className="text-muted-foreground">
                Bem-vindo ao seu painel de controle
              </p>
            </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Management */}
        {clientId && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <RevenuesManager clientId={clientId} onUpdate={() => loadRevenues(clientId)} />
            <ExpensesManager clientId={clientId} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Enviar Documentos
              </CardTitle>
              <CardDescription>
                Envie suas notas fiscais e recibos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full gradient-primary">
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Falar com Contador
              </CardTitle>
              <CardDescription>
                Tire suas dúvidas diretamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Abrir Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas movimentações da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade registrada ainda</p>
              <p className="text-sm mt-2">
                Comece enviando seus documentos ou lançando receitas
              </p>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardMEI;

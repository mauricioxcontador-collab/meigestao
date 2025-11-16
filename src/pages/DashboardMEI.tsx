import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExpensesManager } from "@/components/dashboard/ExpensesManager";
import { RevenuesManager } from "@/components/dashboard/RevenuesManager";
import { ClientRegistrationForm } from "@/components/dashboard/ClientRegistrationForm";
import NavigationBar from "@/components/dashboard/NavigationBar";
import NotificationsSidebar from "@/components/dashboard/NotificationsSidebar";
import RevenueExpenseChart from "@/components/dashboard/RevenueExpenseChart";

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

const DashboardMEI = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientActivity, setClientActivity] = useState<string>("");
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [annualRevenue, setAnnualRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [showClientForm, setShowClientForm] = useState(false);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);

  // Ativar dark mode por padrão
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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
        loadFinancialData(clientData.id);
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

  const loadFinancialData = async (clientId: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get all revenues for the current year
    const { data: revenues, error: revenuesError } = await supabase
      .from("revenues")
      .select("valor, data")
      .eq("client_id", clientId)
      .gte("data", `${currentYear}-01-01`)
      .lte("data", `${currentYear}-12-31`);

    // Get all expenses for the current year
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("valor, data")
      .eq("client_id", clientId)
      .gte("data", `${currentYear}-01-01`)
      .lte("data", `${currentYear}-12-31`);

    if (revenuesError || expensesError) {
      console.error("Error loading financial data:", revenuesError || expensesError);
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

    if (expenses) {
      // Calculate total expenses
      const total = expenses.reduce((sum, exp) => sum + Number(exp.valor), 0);
      setTotalExpenses(total);
    }

    // Generate chart data
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyData: MonthlyData[] = months.map((month, index) => {
      const monthRevenues = revenues
        ?.filter((rev) => {
          const date = new Date(rev.data);
          return date.getMonth() === index && date.getFullYear() === currentYear;
        })
        .reduce((sum, rev) => sum + Number(rev.valor), 0) || 0;

      const monthExpenses = expenses
        ?.filter((exp) => {
          const date = new Date(exp.data);
          return date.getMonth() === index && date.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + Number(exp.valor), 0) || 0;

      return {
        month,
        receitas: monthRevenues,
        despesas: monthExpenses,
      };
    });

    setChartData(monthlyData);
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

  const netProfit = annualRevenue - totalExpenses;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <NavigationBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {showClientForm ? (
          <ClientRegistrationForm 
            userId={user.id} 
            onSuccess={(newClientId) => {
              setClientId(newClientId);
              setShowClientForm(false);
              loadFinancialData(newClientId);
            }} 
          />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Dashboard MEI
              </h1>
              <p className="text-muted-foreground">
                Seja bem-vindo(a).
              </p>
            </div>

            {/* Layout: Sidebar + Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Notifications Sidebar */}
              <div className="lg:col-span-1">
                <NotificationsSidebar 
                  annualRevenue={annualRevenue}
                  dasValue={getDASValue(clientActivity)}
                  dasDescription={getDASDescription()}
                />
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Metrics Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-revenue border-none text-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium opacity-90">
                        Minhas Receitas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-1">
                        {formatCurrency(annualRevenue)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Minhas Despesas
                      </CardTitle>
                      <TrendingDown className="w-5 h-5 text-chart-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {formatCurrency(totalExpenses)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-profit border-none text-white">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium opacity-90">
                        Meu Lucro Líquido
                      </CardTitle>
                      <TrendingUp className="w-5 h-5 opacity-90" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-1">
                        {formatCurrency(netProfit)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart */}
                <RevenueExpenseChart data={chartData} />

                {/* Financial Management */}
                {clientId && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <RevenuesManager 
                      clientId={clientId} 
                      onUpdate={() => loadFinancialData(clientId)} 
                    />
                    <ExpensesManager 
                      clientId={clientId}
                      onUpdate={() => loadFinancialData(clientId)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMEI;

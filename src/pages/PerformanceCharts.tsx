import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DailyRevenueChart } from '@/components/charts/DailyRevenueChart';
import { MonthlyComparisonChart } from '@/components/charts/MonthlyComparisonChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { ChartFilters } from '@/components/charts/ChartFilters';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { BarChart2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

type FilterPeriod = 'current' | 'last' | 'custom';

const PerformanceCharts = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('current');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const {
    dailyRevenue,
    revenueByCategory,
    expensesByCategory,
    monthlyComparison,
    totalRevenue,
    totalExpenses,
    currentGoal,
    isLoading
  } = usePerformanceData(clientId, filterPeriod, customStartDate, customEndDate);

  const { isContador, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && isContador) {
      navigate('/contador');
      return;
    }
  }, [roleLoading, isContador, navigate]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // Get client ID
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .or(`mei_user_id.eq.${user.id},contador_user_id.eq.${user.id}`)
        .maybeSingle();

      if (client) {
        setClientId(client.id);
      } else {
        toast.error('Nenhum cliente encontrado');
      }
    };

    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleFilterChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    if (period !== 'custom') {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const handleCustomDateChange = (start: Date | undefined, end: Date | undefined) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <AppSidebar userEmail={user.email || ''} onLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 pt-12 lg:pt-0">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Gráficos de Desempenho
                </h1>
                <p className="text-muted-foreground">
                  Análise visual completa do seu negócio
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-lg font-bold text-success">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-muted-foreground">Despesa Total</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground">Lucro</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalRevenue - totalExpenses)}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <ChartFilters
            filterPeriod={filterPeriod}
            onFilterChange={handleFilterChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
          />

          {/* Chart 1 - Daily Revenue Evolution (Full Width) */}
          <DailyRevenueChart 
            data={dailyRevenue} 
            currentGoal={currentGoal}
            isLoading={isLoading} 
          />

          {/* Chart 2 - Monthly Comparison (Full Width) */}
          <MonthlyComparisonChart 
            data={monthlyComparison} 
            isLoading={isLoading} 
          />

          {/* Charts 3 & 4 - Pie Charts Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryPieChart
              data={revenueByCategory}
              title="Receitas por Categoria"
              type="revenue"
              isLoading={isLoading}
            />
            <CategoryPieChart
              data={expensesByCategory}
              title="Despesas por Categoria"
              type="expense"
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PerformanceCharts;

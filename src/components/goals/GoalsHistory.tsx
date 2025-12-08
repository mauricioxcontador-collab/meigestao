import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, TrendingDown, Target, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoalsHistoryProps {
  clientId: string;
}

interface HistoricalGoal {
  id: string;
  month: number;
  year: number;
  revenue_goal: number;
  profit_goal: number;
  sales_count_goal: number;
  achieved_revenue: number;
  achieved_profit: number;
  achieved_sales: number;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const GoalsHistory = ({ clientId }: GoalsHistoryProps) => {
  const [goals, setGoals] = useState<HistoricalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);

      // Fetch all goals
      let query = supabase
        .from('monthly_goals')
        .select('*')
        .eq('client_id', clientId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (yearFilter !== 'all') {
        query = query.eq('year', parseInt(yearFilter));
      }

      const { data: goalsData } = await query;

      if (!goalsData) {
        setGoals([]);
        setLoading(false);
        return;
      }

      // Fetch actual achievements for each goal
      const enrichedGoals = await Promise.all(
        goalsData.map(async (goal) => {
          const startOfMonth = new Date(goal.year, goal.month - 1, 1).toISOString().split('T')[0];
          const endOfMonth = new Date(goal.year, goal.month, 0).toISOString().split('T')[0];

          const { data: revenues } = await supabase
            .from('revenues')
            .select('valor')
            .eq('client_id', clientId)
            .gte('data', startOfMonth)
            .lte('data', endOfMonth);

          const { data: expenses } = await supabase
            .from('expenses')
            .select('valor')
            .eq('client_id', clientId)
            .gte('data', startOfMonth)
            .lte('data', endOfMonth);

          const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
          const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;

          return {
            ...goal,
            achieved_revenue: totalRevenue,
            achieved_profit: totalRevenue - totalExpenses,
            achieved_sales: revenues?.length || 0
          };
        })
      );

      setGoals(enrichedGoals);
      setLoading(false);
    };

    if (clientId) {
      fetchHistory();
    }
  }, [clientId, yearFilter]);

  // Calculate statistics
  const filteredGoals = typeFilter === 'all' 
    ? goals 
    : goals.filter(g => {
        if (typeFilter === 'achieved') {
          return g.achieved_revenue >= Number(g.revenue_goal);
        }
        return g.achieved_revenue < Number(g.revenue_goal);
      });

  const bestMonth = [...goals].sort((a, b) => b.achieved_revenue - a.achieved_revenue)[0];
  const worstMonth = [...goals].sort((a, b) => a.achieved_revenue - b.achieved_revenue)[0];
  
  const yearGoals = goals.filter(g => g.year === currentYear);
  const avgPerformance = yearGoals.length > 0
    ? yearGoals.reduce((sum, g) => sum + (g.achieved_revenue / Number(g.revenue_goal) * 100), 0) / yearGoals.length
    : 0;

  const achievedCount = goals.filter(g => g.achieved_revenue >= Number(g.revenue_goal)).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metas Atingidas</p>
                <p className="text-2xl font-bold">{achievedCount}/{goals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Melhor Mês</p>
                <p className="text-lg font-bold">
                  {bestMonth ? `${monthNames[bestMonth.month - 1]}/${bestMonth.year}` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pior Mês</p>
                <p className="text-lg font-bold">
                  {worstMonth ? `${monthNames[worstMonth.month - 1]}/${worstMonth.year}` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Anual</p>
                <p className="text-2xl font-bold">{avgPerformance.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Histórico de Metas
            </CardTitle>
            <div className="flex gap-3">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="achieved">Atingidas</SelectItem>
                  <SelectItem value="missed">Não Atingidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma meta encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGoals.map((goal, index) => {
                const revenuePercent = (goal.achieved_revenue / Number(goal.revenue_goal)) * 100;
                const profitPercent = (goal.achieved_profit / Number(goal.profit_goal)) * 100;
                const isAchieved = revenuePercent >= 100;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border ${isAchieved ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30 border-border'}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isAchieved ? 'bg-green-500/20' : 'bg-muted'}`}>
                          <span className="text-lg font-bold">{monthNames[goal.month - 1].slice(0, 3)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{monthNames[goal.month - 1]} {goal.year}</p>
                          <Badge variant={isAchieved ? 'default' : 'secondary'} className={isAchieved ? 'bg-green-500' : ''}>
                            {isAchieved ? 'Atingida' : 'Não Atingida'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Faturamento</p>
                          <p className="font-semibold">{formatCurrency(goal.achieved_revenue)}</p>
                          <p className="text-xs text-muted-foreground">Meta: {formatCurrency(Number(goal.revenue_goal))}</p>
                          <p className={`text-xs font-medium ${revenuePercent >= 100 ? 'text-green-500' : 'text-red-500'}`}>
                            {revenuePercent.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Lucro</p>
                          <p className="font-semibold">{formatCurrency(goal.achieved_profit)}</p>
                          <p className="text-xs text-muted-foreground">Meta: {formatCurrency(Number(goal.profit_goal))}</p>
                          <p className={`text-xs font-medium ${profitPercent >= 100 ? 'text-green-500' : 'text-red-500'}`}>
                            {profitPercent.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vendas</p>
                          <p className="font-semibold">{goal.achieved_sales}</p>
                          <p className="text-xs text-muted-foreground">Meta: {goal.sales_count_goal}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MonthlyGoal {
  id: string;
  client_id: string;
  month: number;
  year: number;
  revenue_goal: number;
  profit_goal: number;
  sales_count_goal: number;
  expense_reduction_goal: number;
  expense_reduction_type: 'percentage' | 'absolute';
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  revenueProgress: number;
  profitProgress: number;
  salesProgress: number;
  expenseReductionProgress: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  salesCount: number;
  projectedRevenue: number;
  projectedProfit: number;
  previousMonths: {
    month: number;
    year: number;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  dailyRevenue: { date: string; value: number }[];
  categoryBreakdown: { category: string; value: number }[];
}

export interface Achievement {
  id: string;
  client_id: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  goal_type: string;
  month: number;
  year: number;
  points: number;
  achieved_at: string;
}

export interface Notification {
  id: string;
  client_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const useGoals = (clientId: string | null) => {
  const [currentGoal, setCurrentGoal] = useState<MonthlyGoal | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchCurrentGoal = useCallback(async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from('monthly_goals')
      .select('*')
      .eq('client_id', clientId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .maybeSingle();

    if (error) {
      console.error('Error fetching goal:', error);
      return;
    }

    if (data) {
      setCurrentGoal({
        ...data,
        expense_reduction_type: data.expense_reduction_type as 'percentage' | 'absolute'
      });
    } else {
      setCurrentGoal(null);
    }
  }, [clientId, currentMonth, currentYear]);

  const calculateProgress = useCallback(async () => {
    if (!clientId) return;

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Fetch revenues for current month
    const { data: revenues } = await supabase
      .from('revenues')
      .select('*')
      .eq('client_id', clientId)
      .gte('data', startOfMonth)
      .lte('data', endOfMonth);

    // Fetch expenses for current month
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('client_id', clientId)
      .gte('data', startOfMonth)
      .lte('data', endOfMonth);

    // Fetch previous 2 months data
    const previousMonthsData = [];
    for (let i = 1; i <= 2; i++) {
      const prevMonth = currentMonth - i <= 0 ? 12 + (currentMonth - i) : currentMonth - i;
      const prevYear = currentMonth - i <= 0 ? currentYear - 1 : currentYear;
      const prevStart = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0];
      const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

      const { data: prevRevenues } = await supabase
        .from('revenues')
        .select('valor')
        .eq('client_id', clientId)
        .gte('data', prevStart)
        .lte('data', prevEnd);

      const { data: prevExpenses } = await supabase
        .from('expenses')
        .select('valor')
        .eq('client_id', clientId)
        .gte('data', prevStart)
        .lte('data', prevEnd);

      const prevTotalRevenue = prevRevenues?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
      const prevTotalExpenses = prevExpenses?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;

      previousMonthsData.push({
        month: prevMonth,
        year: prevYear,
        revenue: prevTotalRevenue,
        expenses: prevTotalExpenses,
        profit: prevTotalRevenue - prevTotalExpenses
      });
    }

    const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;
    const totalProfit = totalRevenue - totalExpenses;
    const salesCount = revenues?.length || 0;

    // Calculate projections based on current pace
    const dailyAvgRevenue = totalRevenue / dayOfMonth;
    const dailyAvgExpenses = totalExpenses / dayOfMonth;
    const projectedRevenue = dailyAvgRevenue * daysInMonth;
    const projectedProfit = (dailyAvgRevenue - dailyAvgExpenses) * daysInMonth;

    // Daily revenue breakdown
    const dailyRevenue: { date: string; value: number }[] = [];
    const revenueByDate: { [key: string]: number } = {};
    
    revenues?.forEach(r => {
      const date = r.data;
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(r.valor);
    });

    for (let d = 1; d <= dayOfMonth; d++) {
      const date = new Date(currentYear, currentMonth - 1, d).toISOString().split('T')[0];
      dailyRevenue.push({
        date,
        value: revenueByDate[date] || 0
      });
    }

    // Category breakdown
    const categoryMap: { [key: string]: number } = {};
    revenues?.forEach(r => {
      const cat = r.categoria || 'Outros';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(r.valor);
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, value]) => ({
      category,
      value
    }));

    // Calculate expense reduction compared to previous month average
    const prevAvgExpenses = previousMonthsData.reduce((sum, p) => sum + p.expenses, 0) / 2;
    const expenseReduction = prevAvgExpenses > 0 ? ((prevAvgExpenses - totalExpenses) / prevAvgExpenses) * 100 : 0;

    const progressData: GoalProgress = {
      revenueProgress: currentGoal?.revenue_goal ? (totalRevenue / Number(currentGoal.revenue_goal)) * 100 : 0,
      profitProgress: currentGoal?.profit_goal ? (totalProfit / Number(currentGoal.profit_goal)) * 100 : 0,
      salesProgress: currentGoal?.sales_count_goal ? (salesCount / currentGoal.sales_count_goal) * 100 : 0,
      expenseReductionProgress: currentGoal?.expense_reduction_goal 
        ? currentGoal.expense_reduction_type === 'percentage'
          ? (expenseReduction / Number(currentGoal.expense_reduction_goal)) * 100
          : ((prevAvgExpenses - totalExpenses) / Number(currentGoal.expense_reduction_goal)) * 100
        : 0,
      totalRevenue,
      totalExpenses,
      totalProfit,
      salesCount,
      projectedRevenue,
      projectedProfit,
      previousMonths: previousMonthsData,
      dailyRevenue,
      categoryBreakdown
    };

    setProgress(progressData);
  }, [clientId, currentMonth, currentYear, currentGoal]);

  const fetchAchievements = useCallback(async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('client_id', clientId)
      .order('achieved_at', { ascending: false });

    if (!error && data) {
      setAchievements(data.map(a => ({
        ...a,
        type: a.type as 'bronze' | 'silver' | 'gold' | 'platinum'
      })));
    }
  }, [clientId]);

  const fetchNotifications = useCallback(async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotifications(data);
    }
  }, [clientId]);

  const saveGoal = async (goal: Partial<MonthlyGoal>) => {
    if (!clientId) return;

    const goalData = {
      client_id: clientId,
      month: currentMonth,
      year: currentYear,
      revenue_goal: goal.revenue_goal || 0,
      profit_goal: goal.profit_goal || 0,
      sales_count_goal: goal.sales_count_goal || 0,
      expense_reduction_goal: goal.expense_reduction_goal || 0,
      expense_reduction_type: goal.expense_reduction_type || 'percentage'
    };

    if (currentGoal?.id) {
      const { error } = await supabase
        .from('monthly_goals')
        .update(goalData)
        .eq('id', currentGoal.id);

      if (error) {
        toast({ title: 'Erro ao atualizar meta', variant: 'destructive' });
        return false;
      }
    } else {
      const { error } = await supabase
        .from('monthly_goals')
        .insert(goalData);

      if (error) {
        toast({ title: 'Erro ao criar meta', variant: 'destructive' });
        return false;
      }
    }

    toast({ title: 'Meta salva com sucesso!' });
    await fetchCurrentGoal();
    return true;
  };

  const checkAndCreateAlerts = useCallback(async () => {
    if (!clientId || !currentGoal || !progress) return;

    const thresholds = [
      { percent: 100, type: 'goal_100', title: '🎉 Meta Atingida!', message: 'Parabéns! Você atingiu 100% da sua meta!' },
      { percent: 80, type: 'goal_80', title: '🔥 Quase lá!', message: 'Você atingiu 80% da sua meta. Continue assim!' },
      { percent: 50, type: 'goal_50', title: '📊 Meio do caminho!', message: 'Você atingiu 50% da sua meta. Mantenha o ritmo!' }
    ];

    const goalTypes = [
      { key: 'revenue', progress: progress.revenueProgress, name: 'faturamento' },
      { key: 'profit', progress: progress.profitProgress, name: 'lucro' },
      { key: 'sales', progress: progress.salesProgress, name: 'vendas' }
    ];

    for (const goalType of goalTypes) {
      for (const threshold of thresholds) {
        if (goalType.progress >= threshold.percent) {
          const notifType = `${threshold.type}_${goalType.key}_${currentMonth}_${currentYear}`;
          
          // Check if notification already exists
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('client_id', clientId)
            .eq('type', notifType)
            .maybeSingle();

          if (!existing) {
            await supabase.from('notifications').insert({
              client_id: clientId,
              type: notifType,
              title: threshold.title,
              message: `${threshold.message} (Meta de ${goalType.name})`
            });

            // Create achievement if 100%
            if (threshold.percent === 100) {
              const medalType = goalType.progress >= 150 ? 'platinum' 
                : goalType.progress >= 120 ? 'gold' 
                : goalType.progress >= 100 ? 'silver' 
                : 'bronze';

              const points = medalType === 'platinum' ? 100 
                : medalType === 'gold' ? 75 
                : medalType === 'silver' ? 50 
                : 25;

              await supabase.from('achievements').insert({
                client_id: clientId,
                type: medalType,
                goal_type: goalType.key,
                month: currentMonth,
                year: currentYear,
                points
              });
            }
          }
          break; // Only create highest threshold notification
        }
      }
    }

    await fetchNotifications();
    await fetchAchievements();
  }, [clientId, currentGoal, progress, currentMonth, currentYear, fetchNotifications, fetchAchievements]);

  const markNotificationRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    await fetchNotifications();
  };

  const getHistoricalGoals = async (year?: number) => {
    if (!clientId) return [];

    let query = supabase
      .from('monthly_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (year) {
      query = query.eq('year', year);
    }

    const { data } = await query;
    return data || [];
  };

  const getTotalPoints = useCallback(() => {
    return achievements.reduce((sum, a) => sum + a.points, 0);
  }, [achievements]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCurrentGoal();
      await fetchAchievements();
      await fetchNotifications();
      setLoading(false);
    };

    if (clientId) {
      loadData();
    }
  }, [clientId, fetchCurrentGoal, fetchAchievements, fetchNotifications]);

  useEffect(() => {
    if (currentGoal) {
      calculateProgress();
    }
  }, [currentGoal, calculateProgress]);

  useEffect(() => {
    if (progress && currentGoal) {
      checkAndCreateAlerts();
    }
  }, [progress, currentGoal, checkAndCreateAlerts]);

  return {
    currentGoal,
    progress,
    achievements,
    notifications,
    loading,
    saveGoal,
    fetchCurrentGoal,
    calculateProgress,
    markNotificationRead,
    getHistoricalGoals,
    getTotalPoints,
    currentMonth,
    currentYear
  };
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyRevenue {
  date: string;
  value: number;
}

export interface CategoryData {
  category: string;
  value: number;
  percentage: number;
}

export interface MonthlyComparison {
  month: string;
  year: number;
  revenue: number;
  revenueGoal: number;
  expenses: number;
  profit: number;
}

export interface PerformanceData {
  dailyRevenue: DailyRevenue[];
  revenueByCategory: CategoryData[];
  expensesByCategory: CategoryData[];
  monthlyComparison: MonthlyComparison[];
  totalRevenue: number;
  totalExpenses: number;
  currentGoal: number | null;
  isLoading: boolean;
}

type FilterPeriod = 'current' | 'last' | 'custom';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const usePerformanceData = (
  clientId: string | null,
  filterPeriod: FilterPeriod = 'current',
  customStartDate?: Date,
  customEndDate?: Date
) => {
  const [data, setData] = useState<PerformanceData>({
    dailyRevenue: [],
    revenueByCategory: [],
    expensesByCategory: [],
    monthlyComparison: [],
    totalRevenue: 0,
    totalExpenses: 0,
    currentGoal: null,
    isLoading: true
  });

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filterPeriod) {
      case 'last':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'custom':
        startDate = customStartDate || new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = customEndDate || now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    return { startDate, endDate };
  }, [filterPeriod, customStartDate, customEndDate]);

  const fetchData = useCallback(async () => {
    if (!clientId) return;

    setData(prev => ({ ...prev, isLoading: true }));

    const { startDate, endDate } = getDateRange();
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    try {
      // Fetch revenues for the period
      const { data: revenues } = await supabase
        .from('revenues')
        .select('*')
        .eq('client_id', clientId)
        .gte('data', startStr)
        .lte('data', endStr)
        .order('data');

      // Fetch expenses for the period
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('client_id', clientId)
        .gte('data', startStr)
        .lte('data', endStr)
        .order('data');

      // Fetch current month goal
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { data: goalData } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('client_id', clientId)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      // Fetch last 6 months data for comparison
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      const sixMonthsStr = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1)
        .toISOString().split('T')[0];

      const { data: allRevenues } = await supabase
        .from('revenues')
        .select('*')
        .eq('client_id', clientId)
        .gte('data', sixMonthsStr)
        .order('data');

      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('client_id', clientId)
        .gte('data', sixMonthsStr)
        .order('data');

      const { data: allGoals } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('client_id', clientId)
        .gte('year', sixMonthsAgo.getFullYear())
        .order('year')
        .order('month');

      // Process daily revenue
      const dailyMap = new Map<string, number>();
      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < daysInPeriod; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, 0);
      }

      revenues?.forEach(r => {
        const current = dailyMap.get(r.data) || 0;
        dailyMap.set(r.data, current + Number(r.valor));
      });

      const dailyRevenue: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, value]) => ({
        date,
        value
      }));

      // Process revenue by category
      const revenueCatMap = new Map<string, number>();
      revenues?.forEach(r => {
        const cat = r.categoria || 'Outros';
        revenueCatMap.set(cat, (revenueCatMap.get(cat) || 0) + Number(r.valor));
      });

      const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
      const revenueByCategory: CategoryData[] = Array.from(revenueCatMap.entries()).map(([category, value]) => ({
        category,
        value,
        percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0
      })).sort((a, b) => b.value - a.value);

      // Process expenses by category
      const expenseCatMap = new Map<string, number>();
      expenses?.forEach(e => {
        const cat = e.categoria || 'Outros';
        expenseCatMap.set(cat, (expenseCatMap.get(cat) || 0) + Number(e.valor));
      });

      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;
      const expensesByCategory: CategoryData[] = Array.from(expenseCatMap.entries()).map(([category, value]) => ({
        category,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
      })).sort((a, b) => b.value - a.value);

      // Process monthly comparison (last 6 months)
      const monthlyData = new Map<string, { revenue: number; expenses: number; goal: number }>();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyData.set(key, { revenue: 0, expenses: 0, goal: 0 });
      }

      allRevenues?.forEach(r => {
        const date = new Date(r.data);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (monthlyData.has(key)) {
          const current = monthlyData.get(key)!;
          current.revenue += Number(r.valor);
        }
      });

      allExpenses?.forEach(e => {
        const date = new Date(e.data);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (monthlyData.has(key)) {
          const current = monthlyData.get(key)!;
          current.expenses += Number(e.valor);
        }
      });

      allGoals?.forEach(g => {
        const key = `${g.year}-${g.month}`;
        if (monthlyData.has(key)) {
          const current = monthlyData.get(key)!;
          current.goal = Number(g.revenue_goal);
        }
      });

      const monthlyComparison: MonthlyComparison[] = Array.from(monthlyData.entries()).map(([key, val]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month: monthNames[month - 1].substring(0, 3),
          year,
          revenue: val.revenue,
          revenueGoal: val.goal,
          expenses: val.expenses,
          profit: val.revenue - val.expenses
        };
      });

      setData({
        dailyRevenue,
        revenueByCategory,
        expensesByCategory,
        monthlyComparison,
        totalRevenue,
        totalExpenses,
        currentGoal: goalData ? Number(goalData.revenue_goal) : null,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [clientId, getDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('performance-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'revenues' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchData]);

  return { ...data, refetch: fetchData };
};

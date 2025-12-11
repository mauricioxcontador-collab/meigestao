import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, format, parseISO } from 'date-fns';

export type FilterPeriod = 'current_month' | 'last_3_months' | 'current_year' | 'custom';

interface Revenue {
  id: string;
  valor: number;
  descricao: string | null;
  categoria: string | null;
  data: string;
}

interface Expense {
  id: string;
  valor: number;
  descricao: string | null;
  categoria: string | null;
  data: string;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
}

export interface ReportData {
  // Revenues
  totalRevenue: number;
  revenueByCategory: CategoryData[];
  topProducts: { name: string; value: number; count: number }[];
  revenueVariation: number;
  revenues: Revenue[];
  
  // Expenses
  totalExpenses: number;
  expensesByCategory: CategoryData[];
  fixedExpenses: number;
  variableExpenses: number;
  expenseVariation: number;
  expenses: Expense[];
  
  // Billing
  monthlyBilling: MonthlyData[];
  annualBilling: number;
  monthlyGrowth: number;
  averageTicket: number;
  
  // Profit
  netProfit: number;
  profitMargin: number;
  previousMonthProfit: number;
  profitVariation: number;
  
  // Period info
  periodStart: Date;
  periodEnd: Date;
  previousPeriodStart: Date;
  previousPeriodEnd: Date;
}

const FIXED_EXPENSE_CATEGORIES = ['Aluguel', 'Internet', 'Energia', 'Água', 'Telefone', 'Salário', 'Imposto', 'DAS'];

export function useReportData(
  clientId: string | null,
  filterPeriod: FilterPeriod,
  customStartDate?: Date,
  customEndDate?: Date
) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [previousRevenues, setPreviousRevenues] = useState<Revenue[]>([]);
  const [previousExpenses, setPreviousExpenses] = useState<Expense[]>([]);
  const [yearlyRevenues, setYearlyRevenues] = useState<Revenue[]>([]);
  const [yearlyExpenses, setYearlyExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (filterPeriod) {
      case 'current_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_3_months':
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case 'current_year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        start = customStartDate || startOfMonth(now);
        end = customEndDate || endOfMonth(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    // Previous period (same duration, immediately before)
    const duration = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return {
      start,
      end,
      previousStart,
      previousEnd,
      yearStart: startOfYear(now),
      yearEnd: endOfYear(now),
    };
  }, [filterPeriod, customStartDate, customEndDate]);

  // Fetch data
  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Fetch company info
        const { data: clientData } = await supabase
          .from('clients')
          .select('razao_social')
          .eq('id', clientId)
          .maybeSingle();

        if (clientData) {
          setCompanyName(clientData.razao_social);
        }

        // Current period revenues
        const { data: currentRevenues } = await supabase
          .from('revenues')
          .select('id, valor, descricao, categoria, data')
          .eq('client_id', clientId)
          .gte('data', format(dateRanges.start, 'yyyy-MM-dd'))
          .lte('data', format(dateRanges.end, 'yyyy-MM-dd'))
          .order('data', { ascending: false });

        // Current period expenses
        const { data: currentExpenses } = await supabase
          .from('expenses')
          .select('id, valor, descricao, categoria, data')
          .eq('client_id', clientId)
          .gte('data', format(dateRanges.start, 'yyyy-MM-dd'))
          .lte('data', format(dateRanges.end, 'yyyy-MM-dd'))
          .order('data', { ascending: false });

        // Previous period revenues
        const { data: prevRevenues } = await supabase
          .from('revenues')
          .select('id, valor, descricao, categoria, data')
          .eq('client_id', clientId)
          .gte('data', format(dateRanges.previousStart, 'yyyy-MM-dd'))
          .lte('data', format(dateRanges.previousEnd, 'yyyy-MM-dd'));

        // Previous period expenses
        const { data: prevExpenses } = await supabase
          .from('expenses')
          .select('id, valor, descricao, categoria, data')
          .eq('client_id', clientId)
          .gte('data', format(dateRanges.previousStart, 'yyyy-MM-dd'))
          .lte('data', format(dateRanges.previousEnd, 'yyyy-MM-dd'));

        // Yearly data for monthly evolution
        const { data: yearRevenues } = await supabase
          .from('revenues')
          .select('id, valor, descricao, categoria, data')
          .eq('client_id', clientId)
          .gte('data', format(subMonths(new Date(), 11), 'yyyy-MM-dd'))
          .lte('data', format(new Date(), 'yyyy-MM-dd'));

        const { data: yearExpenses } = await supabase
          .from('expenses')
          .select('id, valor, descricao, categoria, data')
          .eq('client_id', clientId)
          .gte('data', format(subMonths(new Date(), 11), 'yyyy-MM-dd'))
          .lte('data', format(new Date(), 'yyyy-MM-dd'));

        setRevenues(currentRevenues || []);
        setExpenses(currentExpenses || []);
        setPreviousRevenues(prevRevenues || []);
        setPreviousExpenses(prevExpenses || []);
        setYearlyRevenues(yearRevenues || []);
        setYearlyExpenses(yearExpenses || []);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, dateRanges]);

  // Calculate report data
  const reportData = useMemo((): ReportData => {
    // Totals
    const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.valor), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.valor), 0);
    const previousTotalRevenue = previousRevenues.reduce((sum, r) => sum + Number(r.valor), 0);
    const previousTotalExpenses = previousExpenses.reduce((sum, e) => sum + Number(e.valor), 0);

    // Revenue by category
    const revenueCategoryMap = new Map<string, number>();
    revenues.forEach(r => {
      const cat = r.categoria || 'Outros';
      revenueCategoryMap.set(cat, (revenueCategoryMap.get(cat) || 0) + Number(r.valor));
    });
    const revenueByCategory: CategoryData[] = Array.from(revenueCategoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Top products/services
    const productMap = new Map<string, { value: number; count: number }>();
    revenues.forEach(r => {
      const name = r.descricao || 'Sem descrição';
      const existing = productMap.get(name) || { value: 0, count: 0 };
      productMap.set(name, {
        value: existing.value + Number(r.valor),
        count: existing.count + 1
      });
    });
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Expense by category
    const expenseCategoryMap = new Map<string, number>();
    expenses.forEach(e => {
      const cat = e.categoria || 'Outros';
      expenseCategoryMap.set(cat, (expenseCategoryMap.get(cat) || 0) + Number(e.valor));
    });
    const expensesByCategory: CategoryData[] = Array.from(expenseCategoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Fixed vs Variable expenses
    let fixedExpenses = 0;
    let variableExpenses = 0;
    expenses.forEach(e => {
      const isFixed = FIXED_EXPENSE_CATEGORIES.some(cat => 
        e.categoria?.toLowerCase().includes(cat.toLowerCase())
      );
      if (isFixed) {
        fixedExpenses += Number(e.valor);
      } else {
        variableExpenses += Number(e.valor);
      }
    });

    // Monthly billing evolution (last 12 months)
    const monthlyMap = new Map<string, { revenue: number; expense: number }>();
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, 'yyyy-MM');
      monthlyMap.set(monthKey, { revenue: 0, expense: 0 });
    }

    yearlyRevenues.forEach(r => {
      const monthKey = format(parseISO(r.data), 'yyyy-MM');
      const existing = monthlyMap.get(monthKey);
      if (existing) {
        monthlyMap.set(monthKey, { ...existing, revenue: existing.revenue + Number(r.valor) });
      }
    });

    yearlyExpenses.forEach(e => {
      const monthKey = format(parseISO(e.data), 'yyyy-MM');
      const existing = monthlyMap.get(monthKey);
      if (existing) {
        monthlyMap.set(monthKey, { ...existing, expense: existing.expense + Number(e.valor) });
      }
    });

    const monthlyBilling: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: format(parseISO(month + '-01'), 'MMM/yy'),
      revenue: data.revenue,
      expense: data.expense,
      profit: data.revenue - data.expense
    }));

    // Annual billing
    const annualBilling = yearlyRevenues.reduce((sum, r) => sum + Number(r.valor), 0);

    // Monthly growth
    const currentMonthRevenue = monthlyBilling[monthlyBilling.length - 1]?.revenue || 0;
    const previousMonthRevenue = monthlyBilling[monthlyBilling.length - 2]?.revenue || 0;
    const monthlyGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Average ticket
    const averageTicket = revenues.length > 0 ? totalRevenue / revenues.length : 0;

    // Profit calculations
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const previousNetProfit = previousTotalRevenue - previousTotalExpenses;
    const profitVariation = previousNetProfit !== 0 
      ? ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100 
      : 0;

    // Variations
    const revenueVariation = previousTotalRevenue > 0 
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
      : 0;
    const expenseVariation = previousTotalExpenses > 0 
      ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100 
      : 0;

    return {
      totalRevenue,
      revenueByCategory,
      topProducts,
      revenueVariation,
      revenues,
      totalExpenses,
      expensesByCategory,
      fixedExpenses,
      variableExpenses,
      expenseVariation,
      expenses,
      monthlyBilling,
      annualBilling,
      monthlyGrowth,
      averageTicket,
      netProfit,
      profitMargin,
      previousMonthProfit: previousNetProfit,
      profitVariation,
      periodStart: dateRanges.start,
      periodEnd: dateRanges.end,
      previousPeriodStart: dateRanges.previousStart,
      previousPeriodEnd: dateRanges.previousEnd,
    };
  }, [revenues, expenses, previousRevenues, previousExpenses, yearlyRevenues, yearlyExpenses, dateRanges]);

  return {
    reportData,
    isLoading,
    companyName,
  };
}

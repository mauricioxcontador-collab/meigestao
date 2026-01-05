import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import ClientFinancialSummary from "./ClientFinancialSummary";
import RevenueExpenseChart from "./RevenueExpenseChart";
import MonthlyEvolutionChart from "./MonthlyEvolutionChart";

interface Client {
  id: string;
  razao_social: string;
  cnpj: string;
}

interface ClientDetailModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const ClientDetailModal = ({ client, open, onOpenChange }: ClientDetailModalProps) => {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ month: string; receita: number; despesa: number }[]>([]);
  const [evolutionData, setEvolutionData] = useState<{ month: string; faturamento: number }[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, profit: 0 });

  const fetchClientData = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Fetch current month data for summary
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

      const [revenuesRes, expensesRes] = await Promise.all([
        supabase
          .from('revenues')
          .select('valor')
          .eq('client_id', client.id)
          .gte('data', startOfMonth)
          .lte('data', endOfMonth),
        supabase
          .from('expenses')
          .select('valor')
          .eq('client_id', client.id)
          .gte('data', startOfMonth)
          .lte('data', endOfMonth),
      ]);

      const totalRevenue = revenuesRes.data?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
      const totalExpenses = expensesRes.data?.reduce((sum, e) => sum + Number(e.valor), 0) || 0;
      setSummary({
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
      });

      // Fetch last 12 months data
      const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);
      const startDate = twelveMonthsAgo.toISOString().split('T')[0];

      const [allRevenuesRes, allExpensesRes] = await Promise.all([
        supabase
          .from('revenues')
          .select('valor, data')
          .eq('client_id', client.id)
          .gte('data', startDate),
        supabase
          .from('expenses')
          .select('valor, data')
          .eq('client_id', client.id)
          .gte('data', startDate),
      ]);

      // Process monthly data
      const monthlyMap = new Map<string, { receita: number; despesa: number }>();
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, currentMonth - 11 + i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, { receita: 0, despesa: 0 });
      }

      allRevenuesRes.data?.forEach(r => {
        const date = new Date(r.data);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          current.receita += Number(r.valor);
        }
      });

      allExpensesRes.data?.forEach(e => {
        const date = new Date(e.data);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          current.despesa += Number(e.valor);
        }
      });

      const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      
      const monthlyChartData = sortedEntries.map(([key, val]) => {
        const [, month] = key.split('-');
        return {
          month: MONTH_LABELS[parseInt(month) - 1],
          receita: val.receita,
          despesa: val.despesa,
        };
      });

      const evolutionChartData = sortedEntries.map(([key, val]) => {
        const [, month] = key.split('-');
        return {
          month: MONTH_LABELS[parseInt(month) - 1],
          faturamento: val.receita,
        };
      });

      setMonthlyData(monthlyChartData);
      setEvolutionData(evolutionChartData);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (open && client) {
      fetchClientData();
    }
  }, [open, client, fetchClientData]);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{client.razao_social}</DialogTitle>
          <DialogDescription>
            CNPJ: {client.cnpj}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="resumo" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumo">Resumo Mensal</TabsTrigger>
              <TabsTrigger value="comparativo">Receita x Despesa</TabsTrigger>
              <TabsTrigger value="evolucao">Evolução 12 meses</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-4">
              <ClientFinancialSummary
                totalRevenue={summary.totalRevenue}
                totalExpenses={summary.totalExpenses}
                profit={summary.profit}
                clientName="Mês atual"
              />
            </TabsContent>

            <TabsContent value="comparativo" className="mt-4">
              <RevenueExpenseChart data={monthlyData} />
            </TabsContent>

            <TabsContent value="evolucao" className="mt-4">
              <MonthlyEvolutionChart data={evolutionData} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;

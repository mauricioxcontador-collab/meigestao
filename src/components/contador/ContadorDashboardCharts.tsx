import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

interface ContadorDashboardChartsProps {
  contadorUserId: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(346, 77%, 50%)",
  "hsl(24, 95%, 53%)",
];

export function ContadorDashboardCharts({ contadorUserId }: ContadorDashboardChartsProps) {
  const [revenues, setRevenues] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [revRes, expRes] = await Promise.all([
        supabase.from("contador_revenues").select("*").eq("contador_user_id", contadorUserId),
        supabase.from("contador_expenses").select("*").eq("contador_user_id", contadorUserId),
      ]);
      setRevenues(revRes.data || []);
      setExpenses(expRes.data || []);
      setLoading(false);
    };
    load();
  }, [contadorUserId]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyRevenue = useMemo(() =>
    revenues
      .filter((r) => { const d = new Date(r.data); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
      .reduce((s, r) => s + Number(r.valor), 0),
    [revenues, currentMonth, currentYear]
  );

  const monthlyExpense = useMemo(() =>
    expenses
      .filter((e) => { const d = new Date(e.data); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
      .reduce((s, e) => s + Number(e.valor), 0),
    [expenses, currentMonth, currentYear]
  );

  const annualRevenue = useMemo(() =>
    revenues.filter((r) => new Date(r.data).getFullYear() === currentYear).reduce((s, r) => s + Number(r.valor), 0),
    [revenues, currentYear]
  );

  const annualExpense = useMemo(() =>
    expenses.filter((e) => new Date(e.data).getFullYear() === currentYear).reduce((s, e) => s + Number(e.valor), 0),
    [expenses, currentYear]
  );

  const monthlyData = useMemo(() => {
    return MONTHS.map((label, i) => {
      const rev = revenues.filter((r) => { const d = new Date(r.data); return d.getMonth() === i && d.getFullYear() === currentYear; }).reduce((s, r) => s + Number(r.valor), 0);
      const exp = expenses.filter((e) => { const d = new Date(e.data); return d.getMonth() === i && d.getFullYear() === currentYear; }).reduce((s, e) => s + Number(e.valor), 0);
      return { name: label, receitas: rev, despesas: exp, lucro: rev - exp };
    });
  }, [revenues, expenses, currentYear]);

  const expenseCategoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses
      .filter((e) => new Date(e.data).getFullYear() === currentYear)
      .forEach((e) => { catMap[e.categoria] = (catMap[e.categoria] || 0) + Number(e.valor); });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [expenses, currentYear]);

  const revenueCategoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    revenues
      .filter((r) => new Date(r.data).getFullYear() === currentYear)
      .forEach((r) => { catMap[r.categoria] = (catMap[r.categoria] || 0) + Number(r.valor); });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [revenues, currentYear]);

  if (loading) return <p className="text-center text-muted-foreground py-8">Carregando dashboard...</p>;

  const profit = monthlyRevenue - monthlyExpense;
  const annualProfit = annualRevenue - annualExpense;

  const chartConfig = {
    receitas: { label: "Receitas", color: "hsl(142, 76%, 36%)" },
    despesas: { label: "Despesas", color: "hsl(var(--destructive))" },
    lucro: { label: "Lucro", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">{formatCurrency(monthlyRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Despesa Mensal</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">{formatCurrency(monthlyExpense)}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Lucro Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(profit)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Faturamento Anual</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">{formatCurrency(annualRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lucro: <span className={annualProfit >= 0 ? "text-success" : "text-destructive"}>{formatCurrency(annualProfit)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas x Despesas Mensal ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Profit Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do Lucro ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {revenueCategoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receitas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie data={revenueCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenueCategoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {expenseCategoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie data={expenseCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseCategoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

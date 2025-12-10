import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface MonthlyData {
  month: string;
  monthLabel: string;
  receita: number;
  despesa: number;
}

interface MonthlyGrowthChartProps {
  clientId: string;
}

const MONTH_LABELS = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyGrowthChart({ clientId }: MonthlyGrowthChartProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!clientId) return;

    setIsLoading(true);

    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [revenuesResult, expensesResult] = await Promise.all([
      supabase
        .from("revenues")
        .select("valor, data")
        .eq("client_id", clientId)
        .gte("data", startDate.toISOString().split("T")[0])
        .lte("data", endDate.toISOString().split("T")[0]),
      supabase
        .from("expenses")
        .select("valor, data")
        .eq("client_id", clientId)
        .gte("data", startDate.toISOString().split("T")[0])
        .lte("data", endDate.toISOString().split("T")[0]),
    ]);

    const revenues = revenuesResult.data || [];
    const expenses = expensesResult.data || [];

    // Generate last 12 months
    const monthlyData: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthRevenue = revenues
        .filter((r) => {
          const rDate = new Date(r.data);
          return rDate.getFullYear() === year && rDate.getMonth() === month;
        })
        .reduce((sum, r) => sum + Number(r.valor), 0);

      const monthExpense = expenses
        .filter((e) => {
          const eDate = new Date(e.data);
          return eDate.getFullYear() === year && eDate.getMonth() === month;
        })
        .reduce((sum, e) => sum + Number(e.valor), 0);

      monthlyData.push({
        month: `${year}-${String(month + 1).padStart(2, "0")}`,
        monthLabel: `${MONTH_LABELS[month]}/${String(year).slice(-2)}`,
        receita: monthRevenue,
        despesa: monthExpense,
      });
    }

    setData(monthlyData);
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel("monthly-growth-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "revenues",
        },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchData]);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px] rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold">
            Evolução Financeira - Últimos 12 Meses
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  compactDisplay: "short",
                  currency: "BRL",
                }).format(value)
              }
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span className="text-foreground text-sm">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="receita"
              name="Receita"
              stroke="hsl(165 70% 45%)"
              strokeWidth={3}
              dot={{ fill: "hsl(165 70% 45%)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="despesa"
              name="Despesa"
              stroke="hsl(0 84% 60%)"
              strokeWidth={3}
              dot={{ fill: "hsl(0 84% 60%)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

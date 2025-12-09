import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { MonthlyComparison } from '@/hooks/usePerformanceData';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyComparisonChartProps {
  data: MonthlyComparison[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

export const MonthlyComparisonChart = ({ data, isLoading }: MonthlyComparisonChartProps) => {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Comparativo Mensal - Metas x Realizado</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[350px]" />
        </CardContent>
      </Card>
    );
  }

  // Calculate remaining to goal for each month
  const chartData = data.map(item => ({
    ...item,
    faltaParaMeta: item.revenueGoal > item.revenue ? item.revenueGoal - item.revenue : 0,
    metaAtingida: item.revenueGoal > 0 && item.revenue >= item.revenueGoal
  }));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Comparativo Mensal - Metas x Realizado</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Visualize o progresso em relação às metas dos últimos 6 meses
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                return v.toString();
              }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  revenue: 'Faturamento Realizado',
                  revenueGoal: 'Meta de Faturamento',
                  faltaParaMeta: 'Falta para Meta'
                };
                return [formatCurrency(value), labels[name] || name];
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend 
              formatter={(value) => {
                const labels: Record<string, string> = {
                  revenue: 'Faturamento Realizado',
                  revenueGoal: 'Meta de Faturamento',
                  faltaParaMeta: 'Falta para Meta'
                };
                return labels[value] || value;
              }}
            />
            <Bar 
              dataKey="revenueGoal" 
              name="revenueGoal"
              fill="hsl(var(--secondary))" 
              radius={[4, 4, 0, 0]}
              opacity={0.6}
            />
            <Bar 
              dataKey="revenue" 
              name="revenue"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.metaAtingida ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="faltaParaMeta" 
              name="faltaParaMeta"
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
              opacity={0.4}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend for goal status */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success" />
            <span className="text-muted-foreground">Meta atingida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Em progresso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive opacity-40" />
            <span className="text-muted-foreground">Falta para meta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

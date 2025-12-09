import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { DailyRevenue } from '@/hooks/usePerformanceData';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyRevenueChartProps {
  data: DailyRevenue[];
  currentGoal: number | null;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

export const DailyRevenueChart = ({ data, currentGoal, isLoading }: DailyRevenueChartProps) => {
  // Calculate cumulative values
  const chartData = data.map((item, index) => {
    const cumulativeValue = data
      .slice(0, index + 1)
      .reduce((sum, d) => sum + d.value, 0);
    
    return {
      day: new Date(item.date).getDate(),
      date: item.date,
      valorDiario: item.value,
      acumulado: cumulativeValue
    };
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Evolução Diária do Faturamento</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[350px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Evolução Diária do Faturamento</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhe o crescimento do seu faturamento ao longo do mês
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `Dia ${v}`}
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
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'acumulado' ? 'Acumulado' : 'Valor Diário'
              ]}
              labelFormatter={(label) => `Dia ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend 
              formatter={(value) => value === 'acumulado' ? 'Faturamento Acumulado' : 'Valor Diário'}
            />
            {currentGoal && (
              <ReferenceLine 
                y={currentGoal} 
                stroke="hsl(var(--secondary))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: `Meta: ${formatCurrency(currentGoal)}`, 
                  position: 'right',
                  fill: 'hsl(var(--secondary))',
                  fontSize: 12
                }}
              />
            )}
            <Line 
              type="monotone" 
              dataKey="valorDiario" 
              name="valorDiario"
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))', r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="acumulado" 
              name="acumulado"
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

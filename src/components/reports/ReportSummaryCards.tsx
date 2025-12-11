import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Receipt, PiggyBank, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportData } from '@/hooks/useReportData';

interface ReportSummaryCardsProps {
  data: ReportData;
  isLoading: boolean;
}

export function ReportSummaryCards({ data, isLoading }: ReportSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Receita Total',
      value: formatCurrency(data.totalRevenue),
      variation: data.revenueVariation,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Despesa Total',
      value: formatCurrency(data.totalExpenses),
      variation: data.expenseVariation,
      icon: Receipt,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      invertVariation: true,
    },
    {
      title: 'Lucro Líquido',
      value: formatCurrency(data.netProfit),
      variation: data.profitVariation,
      icon: PiggyBank,
      color: data.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: data.netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      title: 'Margem de Lucro',
      value: `${data.profitMargin.toFixed(1)}%`,
      subtext: `Ticket médio: ${formatCurrency(data.averageTicket)}`,
      icon: Percent,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.invertVariation 
          ? (card.variation || 0) <= 0 
          : (card.variation || 0) >= 0;
        
        return (
          <Card key={index} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              {card.variation !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatPercent(card.variation)} vs período anterior
                  </span>
                </div>
              )}
              {card.subtext && (
                <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

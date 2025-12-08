import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, ShoppingCart, TrendingDown, Target } from 'lucide-react';
import { GoalProgress, MonthlyGoal } from '@/hooks/useGoals';
import { motion } from 'framer-motion';

interface ProgressCardsProps {
  progress: GoalProgress;
  goal: MonthlyGoal;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const ProgressCards = ({ progress, goal }: ProgressCardsProps) => {
  const cards = [
    {
      title: 'Faturamento',
      icon: DollarSign,
      current: progress.totalRevenue,
      target: Number(goal.revenue_goal),
      progress: Math.min(progress.revenueProgress, 100),
      color: 'from-primary to-orange-400',
      iconBg: 'bg-primary/20',
      textColor: 'text-primary'
    },
    {
      title: 'Lucro',
      icon: TrendingUp,
      current: progress.totalProfit,
      target: Number(goal.profit_goal),
      progress: Math.min(progress.profitProgress, 100),
      color: 'from-green-500 to-emerald-400',
      iconBg: 'bg-green-500/20',
      textColor: 'text-green-500'
    },
    {
      title: 'Vendas/Serviços',
      icon: ShoppingCart,
      current: progress.salesCount,
      target: goal.sales_count_goal,
      progress: Math.min(progress.salesProgress, 100),
      color: 'from-blue-500 to-cyan-400',
      iconBg: 'bg-blue-500/20',
      textColor: 'text-blue-500',
      isCurrency: false
    },
    {
      title: 'Redução de Despesas',
      icon: TrendingDown,
      current: goal.expense_reduction_type === 'percentage' 
        ? progress.expenseReductionProgress 
        : progress.previousMonths[0]?.expenses - progress.totalExpenses,
      target: Number(goal.expense_reduction_goal),
      progress: Math.min(progress.expenseReductionProgress, 100),
      color: 'from-red-500 to-rose-400',
      iconBg: 'bg-red-500/20',
      textColor: 'text-red-500',
      isCurrency: goal.expense_reduction_type === 'absolute',
      isPercentage: goal.expense_reduction_type === 'percentage'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const remaining = card.target - card.current;
        const isCurrency = card.isCurrency !== false && !card.isPercentage;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${card.color}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.textColor}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {card.progress.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <h3 className="font-medium text-foreground mb-1">{card.title}</h3>
                
                <div className="mb-3">
                  <Progress 
                    value={card.progress} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Atual</span>
                    <span className="font-medium text-foreground">
                      {isCurrency ? formatCurrency(card.current) : card.isPercentage ? `${card.current.toFixed(1)}%` : card.current}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Meta</span>
                    <span className="font-medium text-foreground">
                      {isCurrency ? formatCurrency(card.target) : card.isPercentage ? `${card.target}%` : card.target}
                    </span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Falta</span>
                      <span className={`font-medium ${card.textColor}`}>
                        {isCurrency ? formatCurrency(remaining) : card.isPercentage ? `${remaining.toFixed(1)}%` : remaining}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

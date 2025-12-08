import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, DollarSign, TrendingUp, ShoppingCart, TrendingDown, Save } from 'lucide-react';
import { MonthlyGoal } from '@/hooks/useGoals';

interface GoalFormProps {
  currentGoal: MonthlyGoal | null;
  onSave: (goal: Partial<MonthlyGoal>) => Promise<boolean>;
  currentMonth: number;
  currentYear: number;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const GoalForm = ({ currentGoal, onSave, currentMonth, currentYear }: GoalFormProps) => {
  const [revenueGoal, setRevenueGoal] = useState('');
  const [profitGoal, setProfitGoal] = useState('');
  const [salesGoal, setSalesGoal] = useState('');
  const [expenseReductionGoal, setExpenseReductionGoal] = useState('');
  const [expenseReductionType, setExpenseReductionType] = useState<'percentage' | 'absolute'>('percentage');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentGoal) {
      setRevenueGoal(String(currentGoal.revenue_goal || ''));
      setProfitGoal(String(currentGoal.profit_goal || ''));
      setSalesGoal(String(currentGoal.sales_count_goal || ''));
      setExpenseReductionGoal(String(currentGoal.expense_reduction_goal || ''));
      setExpenseReductionType(currentGoal.expense_reduction_type || 'percentage');
    }
  }, [currentGoal]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      revenue_goal: parseFloat(revenueGoal) || 0,
      profit_goal: parseFloat(profitGoal) || 0,
      sales_count_goal: parseInt(salesGoal) || 0,
      expense_reduction_goal: parseFloat(expenseReductionGoal) || 0,
      expense_reduction_type: expenseReductionType
    });
    setSaving(false);
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl">Definir Metas - {monthNames[currentMonth - 1]} {currentYear}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure suas metas mensais para acompanhar o crescimento
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Goal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="w-4 h-4 text-primary" />
              Meta de Faturamento
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                value={revenueGoal}
                onChange={(e) => setRevenueGoal(e.target.value)}
                placeholder="0,00"
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Profit Goal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Meta de Lucro
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                value={profitGoal}
                onChange={(e) => setProfitGoal(e.target.value)}
                placeholder="0,00"
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Sales Goal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              Meta de Vendas/Serviços
            </Label>
            <Input
              type="number"
              value={salesGoal}
              onChange={(e) => setSalesGoal(e.target.value)}
              placeholder="Quantidade"
              className="h-12 text-lg"
            />
          </div>

          {/* Expense Reduction Goal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Meta de Redução de Despesas
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                {expenseReductionType === 'absolute' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                )}
                <Input
                  type="number"
                  value={expenseReductionGoal}
                  onChange={(e) => setExpenseReductionGoal(e.target.value)}
                  placeholder="0"
                  className={`h-12 text-lg ${expenseReductionType === 'absolute' ? 'pl-10' : ''}`}
                />
                {expenseReductionType === 'percentage' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                )}
              </div>
              <Select value={expenseReductionType} onValueChange={(v) => setExpenseReductionType(v as 'percentage' | 'absolute')}>
                <SelectTrigger className="w-32 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual</SelectItem>
                  <SelectItem value="absolute">Valor (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Salvando...' : currentGoal ? 'Atualizar Metas' : 'Definir Metas'}
        </Button>
      </CardContent>
    </Card>
  );
};

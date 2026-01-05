import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface ClientFinancialSummaryProps {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  clientName?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const ClientFinancialSummary = ({
  totalRevenue,
  totalExpenses,
  profit,
  clientName,
}: ClientFinancialSummaryProps) => {
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const isPositiveProfit = profit >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-success/30 bg-success/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receita Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(totalRevenue)}
          </div>
          {clientName && (
            <p className="text-xs text-muted-foreground mt-1">
              {clientName}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesa Total
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gastos do período
          </p>
        </CardContent>
      </Card>

      <Card className={`border-${isPositiveProfit ? 'primary' : 'destructive'}/30 bg-${isPositiveProfit ? 'primary' : 'destructive'}/5`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lucro
          </CardTitle>
          <TrendingUp className={`h-4 w-4 ${isPositiveProfit ? 'text-primary' : 'text-destructive'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositiveProfit ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(profit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Margem: {profitMargin.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFinancialSummary;

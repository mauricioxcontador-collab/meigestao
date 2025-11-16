import { ThumbsUp, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationsSidebarProps {
  annualRevenue: number;
  dasValue: number;
  dasDescription: string;
}

const NotificationsSidebar = ({ annualRevenue, dasValue, dasDescription }: NotificationsSidebarProps) => {
  const percentageUsed = ((annualRevenue / 81000) * 100).toFixed(0);
  const isOverLimit = annualRevenue > 81000;
  const isNearLimit = annualRevenue > 64800; // 80% do limite

  const profitPercentage = percentageUsed;
  const limitWarning = 81000 - annualRevenue;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desempenho */}
        <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <ThumbsUp className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Desempenho: {profitPercentage}% de lucro</h3>
            <p className="text-xs text-muted-foreground">
              Excelente! Alto desempenho financeiro, com possibilidade de crescimento e reinvestimento.
            </p>
          </div>
        </div>

        {/* Condição MEI */}
        <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${isOverLimit ? 'bg-destructive/20' : isNearLimit ? 'bg-warning/20' : 'bg-primary/20'} flex items-center justify-center`}>
            <AlertCircle className={`w-5 h-5 ${isOverLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Condição MEI</h3>
            <p className="text-xs text-muted-foreground">
              {isOverLimit 
                ? `Você ultrapassou o limite! Faturamento: R$ ${annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : isNearLimit
                  ? `Faltam R$ ${limitWarning.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} para atingir o limite de faturamento do MEI.`
                  : `Faturamento dentro do limite. R$ ${limitWarning.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} disponível.`
              }
            </p>
          </div>
        </div>

        {/* Pagamento DAS */}
        <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Pagamento DAS</h3>
            <p className="text-xs text-muted-foreground">
              {dasDescription} - R$ {dasValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsSidebar;

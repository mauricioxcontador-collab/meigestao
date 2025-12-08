import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, Download, Loader2 } from 'lucide-react';
import { GoalProgress, MonthlyGoal } from '@/hooks/useGoals';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface AIReportProps {
  progress: GoalProgress;
  goal: MonthlyGoal;
  clientName: string;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const AIReport = ({ progress, goal, clientName }: AIReportProps) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generateReport = async () => {
    setLoading(true);

    const dataContext = `
      Empresa: ${clientName}
      Período: ${monthNames[currentMonth]} de ${currentYear}
      
      METAS DEFINIDAS:
      - Meta de Faturamento: ${formatCurrency(Number(goal.revenue_goal))}
      - Meta de Lucro: ${formatCurrency(Number(goal.profit_goal))}
      - Meta de Vendas: ${goal.sales_count_goal} unidades
      
      RESULTADOS ATUAIS:
      - Faturamento Atual: ${formatCurrency(progress.totalRevenue)} (${progress.revenueProgress.toFixed(1)}% da meta)
      - Lucro Atual: ${formatCurrency(progress.totalProfit)} (${progress.profitProgress.toFixed(1)}% da meta)
      - Vendas Realizadas: ${progress.salesCount} unidades (${progress.salesProgress.toFixed(1)}% da meta)
      - Despesas: ${formatCurrency(progress.totalExpenses)}
      
      PROJEÇÕES PARA O MÊS:
      - Faturamento Projetado: ${formatCurrency(progress.projectedRevenue)}
      - Lucro Projetado: ${formatCurrency(progress.projectedProfit)}
      
      COMPARATIVO COM MESES ANTERIORES:
      ${progress.previousMonths.map(p => 
        `- ${monthNames[p.month - 1]}/${p.year}: Faturamento ${formatCurrency(p.revenue)}, Lucro ${formatCurrency(p.profit)}`
      ).join('\n')}
      
      CATEGORIAS QUE MAIS GERAM RECEITA:
      ${progress.categoryBreakdown.map(c => `- ${c.category}: ${formatCurrency(c.value)}`).join('\n')}
    `;

    try {
      const response = await supabase.functions.invoke('generate-goal-report', {
        body: { dataContext }
      });

      if (response.error) {
        throw response.error;
      }

      setReport(response.data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Tente novamente em alguns instantes',
        variant: 'destructive'
      });
    }

    setLoading(false);
  };

  const downloadPDF = () => {
    if (!report) return;

    // Create a simple HTML document for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Metas - ${monthNames[currentMonth]} ${currentYear}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              line-height: 1.6;
              color: #333;
            }
            h1 {
              color: #f97316;
              border-bottom: 2px solid #f97316;
              padding-bottom: 10px;
            }
            h2 {
              color: #8b5cf6;
              margin-top: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #f97316;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
            .content {
              white-space: pre-wrap;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">MEI Gestão</div>
            <h1>Relatório Inteligente de Metas</h1>
            <p class="date">${monthNames[currentMonth]} de ${currentYear} - ${clientName}</p>
          </div>
          <div class="content">${report.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Relatório Inteligente</CardTitle>
              <p className="text-sm text-muted-foreground">
                Análise completa gerada por IA
              </p>
            </div>
          </div>
          {report && (
            <Button variant="outline" onClick={downloadPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!report ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              Clique no botão abaixo para gerar um relatório completo com análise inteligente do seu desempenho
            </p>
            <Button 
              onClick={generateReport} 
              disabled={loading}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando relatório...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Relatório com IA
                </>
              )}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm max-w-none dark:prose-invert"
          >
            <div className="bg-muted/30 rounded-xl p-6 whitespace-pre-wrap text-sm leading-relaxed">
              {report}
            </div>
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={generateReport} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Gerar Novo Relatório
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

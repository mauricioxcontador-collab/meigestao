import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Report {
  id: string;
  created_at: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_expenses: number;
  profit: number;
  profit_margin: number;
}

interface ReportHistoryProps {
  clientId: string | null;
}

export function ReportHistory({ clientId }: ReportHistoryProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    if (!clientId) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, created_at, period_start, period_end, total_revenue, total_expenses, profit, profit_margin')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [clientId]);

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
      setReports(reports.filter(r => r.id !== id));
      toast.success('Relatório excluído');
    } catch (error) {
      toast.error('Erro ao excluir relatório');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Histórico de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {format(parseISO(report.period_start), 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                    {format(parseISO(report.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gerado em {format(parseISO(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-emerald-600">
                      Receita: {formatCurrency(report.total_revenue)}
                    </span>
                    <span className="text-xs text-red-600">
                      Despesa: {formatCurrency(report.total_expenses)}
                    </span>
                    <span className={`text-xs ${report.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Lucro: {formatCurrency(report.profit)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteReport(report.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Nenhum relatório gerado ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
}

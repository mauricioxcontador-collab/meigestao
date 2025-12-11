import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportData } from '@/hooks/useReportData';

interface ReportTablesProps {
  data: ReportData;
  isLoading: boolean;
}

export function ReportTables({ data, isLoading }: ReportTablesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="report-tables">
      {/* Top Products Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">Top 5 Produtos/Serviços Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto/Serviço</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{product.count}x</Badge>
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      {formatCurrency(product.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhum produto/serviço vendido no período</p>
          )}
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">Despesas Fixas x Variáveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-muted-foreground">Despesas Fixas</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(data.fixedExpenses)}</p>
              <p className="text-xs text-muted-foreground">
                {data.totalExpenses > 0 
                  ? `${((data.fixedExpenses / data.totalExpenses) * 100).toFixed(0)}% do total`
                  : '0% do total'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-muted-foreground">Despesas Variáveis</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(data.variableExpenses)}</p>
              <p className="text-xs text-muted-foreground">
                {data.totalExpenses > 0 
                  ? `${((data.variableExpenses / data.totalExpenses) * 100).toFixed(0)}% do total`
                  : '0% do total'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenues List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">Lista de Receitas ({data.revenues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.revenues.length > 0 ? (
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.revenues.map((revenue) => (
                    <TableRow key={revenue.id}>
                      <TableCell>{formatDate(revenue.data)}</TableCell>
                      <TableCell>{revenue.descricao || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{revenue.categoria || 'Outros'}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(revenue.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma receita no período</p>
          )}
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">Lista de Despesas ({data.expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.expenses.length > 0 ? (
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.data)}</TableCell>
                      <TableCell>{expense.descricao || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.categoria || 'Outros'}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {formatCurrency(expense.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma despesa no período</p>
          )}
        </CardContent>
      </Card>

      {/* Consolidated Totals */}
      <Card className="border-border bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base font-medium">Totais Consolidados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Receitas</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Despesas</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(data.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lucro Líquido</p>
              <p className={`text-lg font-bold ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(data.netProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Anual</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(data.annualBilling)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

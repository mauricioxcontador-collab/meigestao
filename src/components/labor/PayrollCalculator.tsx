import { useState } from "react";
import { Employee } from "@/hooks/useLaborData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Save, Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { calculatePayroll, formatCurrency, LABOR_RATES } from "@/lib/laborCalculations";

interface PayrollCalculatorProps {
  employee: Employee;
  onSave: (payroll: any) => Promise<any>;
  onClose: () => void;
}

export function PayrollCalculator({ employee, onSave, onClose }: PayrollCalculatorProps) {
  const currentDate = new Date();
  const [mes, setMes] = useState(currentDate.getMonth() + 1);
  const [ano, setAno] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(false);

  const payroll = calculatePayroll(employee.salario_bruto);

  const handleSave = async () => {
    setLoading(true);
    await onSave({
      employee_id: employee.id,
      mes,
      ano,
      salario_bruto: payroll.salarioBruto,
      inss_empregador: payroll.inssEmpregador,
      fgts: payroll.fgts,
      fgts_adicional: payroll.fgtsAdicional,
      inss_empregado: payroll.inssEmpregado,
      salario_liquido: payroll.salarioLiquido,
      custo_total: payroll.custoTotal,
    });
    setLoading(false);
    onClose();
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Cálculo da Folha - {employee.nome_completo}
        </CardTitle>
        <CardDescription>
          Cálculo automático de encargos trabalhistas MEI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Salary Breakdown */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Salário Bruto</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(payroll.salarioBruto)}
              </span>
            </div>
          </div>

          {/* Employer Charges */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Encargos do MEI (Empregador)
            </h4>
            <div className="grid gap-2 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>INSS Empregador ({(LABOR_RATES.INSS_EMPREGADOR * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(payroll.inssEmpregador)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>FGTS ({(LABOR_RATES.FGTS * 100).toFixed(0)}%)</span>
                <span>{formatCurrency(payroll.fgts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>FGTS Adicional Rescisão ({(LABOR_RATES.FGTS_ADICIONAL * 100).toFixed(1)}%)</span>
                <span>{formatCurrency(payroll.fgtsAdicional)}</span>
              </div>
            </div>
          </div>

          {/* Employee Deductions */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Descontos do Funcionário
            </h4>
            <div className="grid gap-2 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>INSS Empregado ({(LABOR_RATES.INSS_EMPREGADO * 100).toFixed(0)}%)</span>
                <span className="text-destructive">-{formatCurrency(payroll.inssEmpregado)}</span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between">
              <span className="font-medium">Salário Líquido (Funcionário)</span>
              <span className="font-bold text-success">{formatCurrency(payroll.salarioLiquido)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
              <span className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Custo Total para o MEI
              </span>
              <span className="text-lg font-bold text-warning">{formatCurrency(payroll.custoTotal)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Folha
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

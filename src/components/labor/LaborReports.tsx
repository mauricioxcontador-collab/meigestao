import { Employee, PayrollRecord, ProvisionRecord } from "@/hooks/useLaborData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { calculatePayroll, calculateProvisions, calculateAnnualCost, formatCurrency } from "@/lib/laborCalculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

interface LaborReportsProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  provisions: ProvisionRecord[];
}

export function LaborReports({ employees, payrolls, provisions }: LaborReportsProps) {
  const activeEmployees = employees.filter((e) => e.ativo);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Relatório Trabalhista MEI", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${format(currentDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 20, 30);
    
    let y = 50;
    
    doc.setFontSize(14);
    doc.text("Funcionários Ativos", 20, y);
    y += 10;
    
    doc.setFontSize(10);
    activeEmployees.forEach((emp) => {
      const payroll = calculatePayroll(emp.salario_bruto);
      doc.text(`${emp.nome_completo} - ${emp.cargo}`, 20, y);
      y += 6;
      doc.text(`  Salário: ${formatCurrency(emp.salario_bruto)} | Custo Total: ${formatCurrency(payroll.custoTotal)}`, 20, y);
      y += 10;
    });
    
    y += 10;
    doc.setFontSize(14);
    doc.text("Resumo de Encargos Mensais", 20, y);
    y += 10;
    
    const totalPayroll = activeEmployees.reduce((acc, emp) => {
      const p = calculatePayroll(emp.salario_bruto);
      return {
        bruto: acc.bruto + p.salarioBruto,
        inss: acc.inss + p.inssEmpregador,
        fgts: acc.fgts + p.fgts + p.fgtsAdicional,
        total: acc.total + p.custoTotal,
      };
    }, { bruto: 0, inss: 0, fgts: 0, total: 0 });
    
    doc.setFontSize(10);
    doc.text(`Total Salários Brutos: ${formatCurrency(totalPayroll.bruto)}`, 20, y);
    y += 6;
    doc.text(`Total INSS Empregador: ${formatCurrency(totalPayroll.inss)}`, 20, y);
    y += 6;
    doc.text(`Total FGTS: ${formatCurrency(totalPayroll.fgts)}`, 20, y);
    y += 6;
    doc.text(`Custo Total Mensal: ${formatCurrency(totalPayroll.total)}`, 20, y);
    
    doc.save(`relatorio-trabalhista-${format(currentDate, "yyyy-MM-dd")}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ["Funcionário", "Cargo", "Salário Bruto", "INSS Empregador", "FGTS", "FGTS Adicional", "Custo Total"];
    const rows = activeEmployees.map((emp) => {
      const payroll = calculatePayroll(emp.salario_bruto);
      return [
        emp.nome_completo,
        emp.cargo,
        emp.salario_bruto.toFixed(2),
        payroll.inssEmpregador.toFixed(2),
        payroll.fgts.toFixed(2),
        payroll.fgtsAdicional.toFixed(2),
        payroll.custoTotal.toFixed(2),
      ];
    });
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `folha-pagamento-${format(currentDate, "yyyy-MM")}.csv`;
    a.click();
  };

  // Calculate totals
  const totals = activeEmployees.reduce((acc, emp) => {
    const payroll = calculatePayroll(emp.salario_bruto);
    const prov = calculateProvisions(emp.salario_bruto);
    return {
      salarios: acc.salarios + emp.salario_bruto,
      inss: acc.inss + payroll.inssEmpregador,
      fgts: acc.fgts + payroll.fgts + payroll.fgtsAdicional,
      provisoes: acc.provisoes + prov.totalProvisao,
      custoTotal: acc.custoTotal + payroll.custoTotal + prov.totalProvisao,
      custoAnual: acc.custoAnual + calculateAnnualCost(emp.salario_bruto),
    };
  }, { salarios: 0, inss: 0, fgts: 0, provisoes: 0, custoTotal: 0, custoAnual: 0 });

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Relatórios Trabalhistas
              </CardTitle>
              <CardDescription>
                Exporte relatórios detalhados de custos trabalhistas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Monthly Payroll Report */}
      <Card>
        <CardHeader>
          <CardTitle>Folha Mensal Detalhada</CardTitle>
          <CardDescription>
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeEmployees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum funcionário ativo
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-right">Salário Bruto</TableHead>
                    <TableHead className="text-right">INSS (3%)</TableHead>
                    <TableHead className="text-right">FGTS (11.2%)</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((emp) => {
                    const payroll = calculatePayroll(emp.salario_bruto);
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.nome_completo}</TableCell>
                        <TableCell>{emp.cargo}</TableCell>
                        <TableCell className="text-right">{formatCurrency(emp.salario_bruto)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payroll.inssEmpregador)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payroll.fgts + payroll.fgtsAdicional)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(payroll.custoTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={2} className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totals.salarios)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totals.inss)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totals.fgts)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{formatCurrency(totals.custoTotal - totals.provisoes)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provisions Report */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Provisões</CardTitle>
          <CardDescription>Provisões mensais acumuladas</CardDescription>
        </CardHeader>
        <CardContent>
          {activeEmployees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum funcionário ativo
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="text-right">Provisão Férias</TableHead>
                    <TableHead className="text-right">Provisão 13º</TableHead>
                    <TableHead className="text-right">Provisão FGTS</TableHead>
                    <TableHead className="text-right">Total Mensal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((emp) => {
                    const prov = calculateProvisions(emp.salario_bruto);
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.nome_completo}</TableCell>
                        <TableCell className="text-right">{formatCurrency(prov.provisaoFerias)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(prov.provisaoDecimoTerceiro)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(prov.provisaoFgts)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(prov.totalProvisao)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">TOTAL MENSAL</TableCell>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-right font-bold text-primary">{formatCurrency(totals.provisoes)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Annual Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Custo Anual do Funcionário</CardTitle>
          <CardDescription>Projeção de custos para o ano completo</CardDescription>
        </CardHeader>
        <CardContent>
          {activeEmployees.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum funcionário ativo
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="text-right">Custo Mensal</TableHead>
                    <TableHead className="text-right">Custo Anual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((emp) => {
                    const payroll = calculatePayroll(emp.salario_bruto);
                    const prov = calculateProvisions(emp.salario_bruto);
                    const monthly = payroll.custoTotal + prov.totalProvisao;
                    const annual = calculateAnnualCost(emp.salario_bruto);
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.nome_completo}</TableCell>
                        <TableCell className="text-right">{formatCurrency(monthly)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(annual)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">TOTAL ANUAL</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totals.custoTotal)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{formatCurrency(totals.custoAnual)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

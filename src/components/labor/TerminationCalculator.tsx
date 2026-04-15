import { useState, useMemo, useRef } from "react";
import { Employee } from "@/hooks/useLaborData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UserMinus, Save, Loader2, AlertTriangle, FileDown, Printer, Calculator, Calendar, DollarSign, Info } from "lucide-react";
import { calculateTermination, formatCurrency, LABOR_RATES } from "@/lib/laborCalculations";

interface TerminationCalculatorProps {
  employees: Employee[];
  onSave: (termination: any) => Promise<any>;
  onClose: () => void;
}

function generateTerminationPDF(employee: Employee, termination: ReturnType<typeof calculateTermination>, tipoRescisao: string, dataDesligamento: string) {
  const tipoLabel = tipoRescisao === 'sem_justa_causa' ? 'Demissão Sem Justa Causa' : 'Pedido de Demissão';
  const dataAdmissao = new Date(employee.data_admissao);
  const dataDesl = new Date(dataDesligamento);
  const mesesTrabalhados = Math.floor((dataDesl.getTime() - dataAdmissao.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  const fgtsAcumulado = employee.salario_bruto * LABOR_RATES.FGTS * mesesTrabalhados;
  const descontos = termination.saldoSalario * LABOR_RATES.INSS_EMPREGADO;
  const valorLiquido = termination.totalRescisao - descontos;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Rescisão - ${employee.nome_completo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 22px; color: #1e3a5f; margin-bottom: 4px; }
  .header p { font-size: 12px; color: #64748b; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .field { font-size: 12px; }
  .field .label { color: #64748b; }
  .field .value { font-weight: 600; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; }
  td { font-size: 12px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  td.value { text-align: right; font-weight: 600; }
  .total-row { background: #f0f9ff; }
  .total-row td { font-weight: 700; font-size: 13px; color: #1e3a5f; }
  .discount-row td { color: #dc2626; }
  .net-row { background: #dcfce7; }
  .net-row td { font-weight: 700; font-size: 14px; color: #166534; }
  .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  .badge { display: inline-block; background: ${tipoRescisao === 'sem_justa_causa' ? '#fef3c7' : '#dbeafe'}; color: ${tipoRescisao === 'sem_justa_causa' ? '#92400e' : '#1e40af'}; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>TERMO DE RESCISÃO DE CONTRATO DE TRABALHO</h1>
    <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} • MEI Gestão</p>
  </div>

  <div class="section">
    <div class="section-title">Dados do Funcionário</div>
    <div class="grid">
      <div class="field"><span class="label">Nome: </span><span class="value">${employee.nome_completo}</span></div>
      <div class="field"><span class="label">CPF: </span><span class="value">${employee.cpf}</span></div>
      <div class="field"><span class="label">Cargo: </span><span class="value">${employee.cargo}</span></div>
      <div class="field"><span class="label">Salário Bruto: </span><span class="value">${formatCurrency(employee.salario_bruto)}</span></div>
      <div class="field"><span class="label">Admissão: </span><span class="value">${new Date(employee.data_admissao).toLocaleDateString('pt-BR')}</span></div>
      <div class="field"><span class="label">Desligamento: </span><span class="value">${new Date(dataDesligamento).toLocaleDateString('pt-BR')}</span></div>
      <div class="field"><span class="label">Tipo: </span><span class="badge">${tipoLabel}</span></div>
      <div class="field"><span class="label">Tempo: </span><span class="value">${mesesTrabalhados} meses</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Verbas Rescisórias</div>
    <table>
      <thead><tr><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>
        <tr><td>Saldo de Salário</td><td class="value">${formatCurrency(termination.saldoSalario)}</td></tr>
        ${termination.avisoPrevio > 0 ? `<tr><td>Aviso Prévio Indenizado</td><td class="value">${formatCurrency(termination.avisoPrevio)}</td></tr>` : ''}
        ${termination.feriasVencidas > 0 ? `<tr><td>Férias Vencidas</td><td class="value">${formatCurrency(termination.feriasVencidas)}</td></tr>` : ''}
        <tr><td>Férias Proporcionais</td><td class="value">${formatCurrency(termination.feriasProporcionais)}</td></tr>
        <tr><td>1/3 Constitucional de Férias</td><td class="value">${formatCurrency(termination.tercoFerias)}</td></tr>
        <tr><td>13º Salário Proporcional</td><td class="value">${formatCurrency(termination.decimoTerceiro)}</td></tr>
        ${termination.multaFgts > 0 ? `<tr><td>Multa FGTS (40%)</td><td class="value">${formatCurrency(termination.multaFgts)}</td></tr>` : ''}
        <tr class="total-row"><td><strong>Total Bruto</strong></td><td class="value">${formatCurrency(termination.totalRescisao)}</td></tr>
        <tr class="discount-row"><td>(-) INSS Empregado (8% sobre saldo salário)</td><td class="value">- ${formatCurrency(descontos)}</td></tr>
        <tr class="net-row"><td><strong>Valor Líquido a Pagar</strong></td><td class="value">${formatCurrency(valorLiquido)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">FGTS</div>
    <div class="grid">
      <div class="field"><span class="label">FGTS Acumulado Estimado: </span><span class="value">${formatCurrency(fgtsAcumulado)}</span></div>
      ${tipoRescisao === 'sem_justa_causa' ? `<div class="field"><span class="label">Multa 40% FGTS: </span><span class="value">${formatCurrency(termination.multaFgts)}</span></div>` : ''}
    </div>
  </div>

  <div class="footer">
    <p>Este documento é uma estimativa baseada em regras simplificadas da CLT para MEI.</p>
    <p>Consulte um contador para validação dos valores antes do pagamento.</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }
}

function exportCSV(employee: Employee, termination: ReturnType<typeof calculateTermination>, tipoRescisao: string, dataDesligamento: string) {
  const dataDesl = new Date(dataDesligamento);
  const mesesTrabalhados = Math.floor((dataDesl.getTime() - new Date(employee.data_admissao).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const descontos = termination.saldoSalario * LABOR_RATES.INSS_EMPREGADO;
  const valorLiquido = termination.totalRescisao - descontos;

  const rows = [
    ['Funcionário', employee.nome_completo],
    ['CPF', employee.cpf],
    ['Cargo', employee.cargo],
    ['Salário Bruto', employee.salario_bruto.toFixed(2)],
    ['Admissão', new Date(employee.data_admissao).toLocaleDateString('pt-BR')],
    ['Desligamento', new Date(dataDesligamento).toLocaleDateString('pt-BR')],
    ['Tipo de Rescisão', tipoRescisao === 'sem_justa_causa' ? 'Sem Justa Causa' : 'Pedido de Demissão'],
    ['Meses Trabalhados', mesesTrabalhados.toString()],
    [''],
    ['Verba', 'Valor (R$)'],
    ['Saldo de Salário', termination.saldoSalario.toFixed(2)],
    ['Aviso Prévio', termination.avisoPrevio.toFixed(2)],
    ['Férias Vencidas', termination.feriasVencidas.toFixed(2)],
    ['Férias Proporcionais', termination.feriasProporcionais.toFixed(2)],
    ['1/3 de Férias', termination.tercoFerias.toFixed(2)],
    ['13º Proporcional', termination.decimoTerceiro.toFixed(2)],
    ['Multa FGTS 40%', termination.multaFgts.toFixed(2)],
    ['Total Bruto', termination.totalRescisao.toFixed(2)],
    ['Descontos (INSS)', descontos.toFixed(2)],
    ['Valor Líquido', valorLiquido.toFixed(2)],
  ];

  const csv = rows.map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rescisao_${employee.nome_completo.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TerminationCalculator({ employees, onSave, onClose }: TerminationCalculatorProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [tipoRescisao, setTipoRescisao] = useState<'sem_justa_causa' | 'pedido_demissao'>('sem_justa_causa');
  const [dataDesligamento, setDataDesligamento] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeEmployees = employees.filter(e => e.ativo);
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || null;

  const termination = useMemo(() => {
    if (!selectedEmployee) return null;
    return calculateTermination(
      selectedEmployee.salario_bruto,
      new Date(selectedEmployee.data_admissao),
      new Date(dataDesligamento),
      tipoRescisao
    );
  }, [selectedEmployee, dataDesligamento, tipoRescisao]);

  const mesesTrabalhados = useMemo(() => {
    if (!selectedEmployee) return 0;
    return Math.floor(
      (new Date(dataDesligamento).getTime() - new Date(selectedEmployee.data_admissao).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
  }, [selectedEmployee, dataDesligamento]);

  const fgtsAcumulado = useMemo(() => {
    if (!selectedEmployee) return 0;
    return selectedEmployee.salario_bruto * LABOR_RATES.FGTS * mesesTrabalhados;
  }, [selectedEmployee, mesesTrabalhados]);

  const descontos = useMemo(() => {
    if (!termination) return 0;
    return termination.saldoSalario * LABOR_RATES.INSS_EMPREGADO;
  }, [termination]);

  const valorLiquido = useMemo(() => {
    if (!termination) return 0;
    return termination.totalRescisao - descontos;
  }, [termination, descontos]);

  const handleSave = async () => {
    if (!selectedEmployee || !termination) return;
    setLoading(true);
    await onSave({
      employee_id: selectedEmployee.id,
      tipo_rescisao: tipoRescisao,
      data_desligamento: dataDesligamento,
      saldo_salario: termination.saldoSalario,
      aviso_previo: termination.avisoPrevio,
      ferias_vencidas: termination.feriasVencidas,
      ferias_proporcionais: termination.feriasProporcionais,
      terco_ferias: termination.tercoFerias,
      decimo_terceiro: termination.decimoTerceiro,
      multa_fgts: termination.multaFgts,
      total_rescisao: termination.totalRescisao,
    });
    setSaved(true);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Cálculo de Rescisão
          </h2>
          <p className="text-sm text-muted-foreground">
            Simule e calcule verbas rescisórias com base nas regras da CLT simplificada para MEI
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>Voltar</Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da Rescisão</CardTitle>
          <CardDescription>Selecione o funcionário e preencha as informações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Funcionário</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.length === 0 && (
                    <SelectItem value="none" disabled>Nenhum funcionário ativo</SelectItem>
                  )}
                  {activeEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome_completo} — {emp.cargo} — {formatCurrency(emp.salario_bruto)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Salário Bruto
                  </Label>
                  <Input value={formatCurrency(selectedEmployee.salario_bruto)} disabled />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data de Admissão
                  </Label>
                  <Input value={new Date(selectedEmployee.data_admissao).toLocaleDateString('pt-BR')} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Data de Desligamento</Label>
                  <Input
                    type="date"
                    value={dataDesligamento}
                    onChange={(e) => { setDataDesligamento(e.target.value); setSaved(false); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Rescisão</Label>
                  <Select value={tipoRescisao} onValueChange={(v: any) => { setTipoRescisao(v); setSaved(false); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_justa_causa">Demissão Sem Justa Causa</SelectItem>
                      <SelectItem value="pedido_demissao">Pedido de Demissão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Tempo de serviço: <strong className="text-foreground">{mesesTrabalhados} meses</strong> ({Math.floor(mesesTrabalhados / 12)} anos e {mesesTrabalhados % 12} meses)</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {selectedEmployee && termination && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Bruto</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(termination.totalRescisao)}</p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Descontos</p>
                <p className="text-2xl font-bold text-destructive">- {formatCurrency(descontos)}</p>
                <p className="text-xs text-muted-foreground">INSS 8% sobre saldo de salário</p>
              </CardContent>
            </Card>
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor Líquido</p>
                <p className="text-2xl font-bold text-accent-foreground">{formatCurrency(valorLiquido)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo Detalhado</CardTitle>
              <CardDescription>Detalhamento de cada verba rescisória calculada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <DetailRow
                  label="Saldo de Salário"
                  value={termination.saldoSalario}
                  description={`${new Date(dataDesligamento).getDate()} dias trabalhados no mês`}
                />
                {termination.avisoPrevio > 0 && (
                  <DetailRow
                    label="Aviso Prévio Indenizado"
                    value={termination.avisoPrevio}
                    description={`30 dias + ${Math.min(Math.floor(mesesTrabalhados / 12) * 3, 60)} dias adicionais por tempo de serviço`}
                  />
                )}
                {termination.feriasVencidas > 0 && (
                  <DetailRow
                    label="Férias Vencidas"
                    value={termination.feriasVencidas}
                    description="Período aquisitivo completo não usufruído"
                  />
                )}
                <DetailRow
                  label="Férias Proporcionais"
                  value={termination.feriasProporcionais}
                  description={`${mesesTrabalhados % 12}/12 avos de férias`}
                />
                <DetailRow
                  label="1/3 Constitucional de Férias"
                  value={termination.tercoFerias}
                  description="Adicional de 1/3 sobre férias vencidas + proporcionais"
                />
                <DetailRow
                  label="13º Salário Proporcional"
                  value={termination.decimoTerceiro}
                  description={`${new Date(dataDesligamento).getMonth() + 1}/12 avos de 13º`}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">FGTS</h4>
                <DetailRow
                  label="FGTS Acumulado (estimativa)"
                  value={fgtsAcumulado}
                  description={`8% × salário × ${mesesTrabalhados} meses`}
                />
                {termination.multaFgts > 0 && (
                  <DetailRow
                    label="Multa de 40% do FGTS"
                    value={termination.multaFgts}
                    description="Aplicável em demissão sem justa causa"
                    highlight
                  />
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Descontos</h4>
                <DetailRow
                  label="INSS Empregado (8%)"
                  value={-descontos}
                  description="Incide sobre o saldo de salário"
                  negative
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center p-4 rounded-lg bg-accent/10 border border-accent/20">
                <span className="font-bold text-lg">Valor Líquido a Pagar</span>
                <span className="text-2xl font-bold text-accent-foreground">{formatCurrency(valorLiquido)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Alert */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-warning">Atenção</p>
              <p className="text-muted-foreground">
                Confirmar a rescisão irá desativar o funcionário no sistema. Os valores são estimativas baseadas em regras simplificadas da CLT para MEI. Consulte um profissional para validação.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => generateTerminationPDF(selectedEmployee, termination, tipoRescisao, dataDesligamento)}
            >
              <Printer className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => exportCSV(selectedEmployee, termination, tipoRescisao, dataDesligamento)}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            {!saved && (
              <Button
                onClick={handleSave}
                disabled={loading}
                variant="destructive"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Confirmar Rescisão
              </Button>
            )}
            {saved && (
              <Badge variant="secondary" className="self-center px-4 py-2 text-sm">
                ✓ Rescisão salva com sucesso
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value, description, highlight, negative }: {
  label: string;
  value: number;
  description: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg ${highlight ? 'bg-primary/5 border border-primary/10' : 'bg-muted/30'}`}>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <p className={`text-sm font-bold mt-1 sm:mt-0 ${negative ? 'text-destructive' : 'text-foreground'}`}>
        {formatCurrency(Math.abs(value))}
        {negative && <span className="text-xs ml-1">(desconto)</span>}
      </p>
    </div>
  );
}

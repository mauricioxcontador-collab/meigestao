import { useState } from "react";
import { Employee } from "@/hooks/useLaborData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserMinus, Save, Loader2, AlertTriangle } from "lucide-react";
import { calculateTermination, formatCurrency } from "@/lib/laborCalculations";

interface TerminationCalculatorProps {
  employee: Employee;
  onSave: (termination: any) => Promise<any>;
  onClose: () => void;
}

export function TerminationCalculator({ employee, onSave, onClose }: TerminationCalculatorProps) {
  const [tipoRescisao, setTipoRescisao] = useState<'sem_justa_causa' | 'pedido_demissao'>('sem_justa_causa');
  const [dataDesligamento, setDataDesligamento] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const termination = calculateTermination(
    employee.salario_bruto,
    new Date(employee.data_admissao),
    new Date(dataDesligamento),
    tipoRescisao
  );

  const handleSave = async () => {
    setLoading(true);
    await onSave({
      employee_id: employee.id,
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
    setLoading(false);
    onClose();
  };

  return (
    <Card className="border-warning/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <UserMinus className="w-5 h-5" />
          Cálculo de Rescisão - {employee.nome_completo}
        </CardTitle>
        <CardDescription>
          Cálculo automático de verbas rescisórias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning">Atenção</p>
            <p className="text-muted-foreground">
              Esta ação irá desativar o funcionário e registrar a rescisão. Os valores são estimativas baseadas na legislação MEI.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Tipo de Rescisão</Label>
            <Select value={tipoRescisao} onValueChange={(v: any) => setTipoRescisao(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem_justa_causa">Demissão Sem Justa Causa</SelectItem>
                <SelectItem value="pedido_demissao">Pedido de Demissão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Desligamento</Label>
            <Input
              type="date"
              value={dataDesligamento}
              onChange={(e) => setDataDesligamento(e.target.value)}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium">Verbas Rescisórias</h4>
          
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm">
              <span>Saldo de Salário</span>
              <span>{formatCurrency(termination.saldoSalario)}</span>
            </div>
            
            {termination.avisoPrevio > 0 && (
              <div className="flex justify-between text-sm">
                <span>Aviso Prévio Indenizado</span>
                <span>{formatCurrency(termination.avisoPrevio)}</span>
              </div>
            )}
            
            {termination.feriasVencidas > 0 && (
              <div className="flex justify-between text-sm">
                <span>Férias Vencidas</span>
                <span>{formatCurrency(termination.feriasVencidas)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span>Férias Proporcionais</span>
              <span>{formatCurrency(termination.feriasProporcionais)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>1/3 de Férias</span>
              <span>{formatCurrency(termination.tercoFerias)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>13º Proporcional</span>
              <span>{formatCurrency(termination.decimoTerceiro)}</span>
            </div>
            
            {termination.multaFgts > 0 && (
              <div className="flex justify-between text-sm">
                <span>Multa FGTS (40%)</span>
                <span>{formatCurrency(termination.multaFgts)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="font-medium">Total a Pagar</span>
            <span className="text-xl font-bold text-destructive">
              {formatCurrency(termination.totalRescisao)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            variant="destructive"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Confirmar Rescisão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

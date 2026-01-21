import { Employee, ProvisionRecord } from "@/hooks/useLaborData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, RefreshCw, Loader2 } from "lucide-react";
import { calculateProvisions, formatCurrency } from "@/lib/laborCalculations";
import { useState } from "react";

interface ProvisionsPanelProps {
  employees: Employee[];
  provisions: ProvisionRecord[];
  onSaveProvision: (provision: any) => Promise<any>;
}

export function ProvisionsPanel({ employees, provisions, onSaveProvision }: ProvisionsPanelProps) {
  const [loading, setLoading] = useState(false);
  const activeEmployees = employees.filter((e) => e.ativo);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Calculate total provisions for all employees
  const totalProvisions = activeEmployees.reduce((acc, employee) => {
    const provisions = calculateProvisions(employee.salario_bruto);
    return {
      provisaoFerias: acc.provisaoFerias + provisions.provisaoFerias,
      provisaoDecimoTerceiro: acc.provisaoDecimoTerceiro + provisions.provisaoDecimoTerceiro,
      provisaoFgts: acc.provisaoFgts + provisions.provisaoFgts,
      totalProvisao: acc.totalProvisao + provisions.totalProvisao,
    };
  }, {
    provisaoFerias: 0,
    provisaoDecimoTerceiro: 0,
    provisaoFgts: 0,
    totalProvisao: 0,
  });

  const handleCalculateAll = async () => {
    setLoading(true);
    for (const employee of activeEmployees) {
      const provision = calculateProvisions(employee.salario_bruto);
      await onSaveProvision({
        employee_id: employee.id,
        mes: currentMonth,
        ano: currentYear,
        provisao_ferias: provision.provisaoFerias,
        provisao_decimo_terceiro: provision.provisaoDecimoTerceiro,
        provisao_fgts: provision.provisaoFgts,
        total_provisao: provision.totalProvisao,
      });
    }
    setLoading(false);
  };

  if (activeEmployees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Sem funcionários ativos para provisionar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                Provisões Trabalhistas Mensais
              </CardTitle>
              <CardDescription>
                Valores a serem provisionados mensalmente para obrigações futuras
              </CardDescription>
            </div>
            <Button onClick={handleCalculateAll} disabled={loading} size="sm">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Calcular Mês Atual
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-muted-foreground">Provisão de Férias</p>
              <p className="text-2xl font-bold text-blue-500">
                {formatCurrency(totalProvisions.provisaoFerias)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">1/12 + 1/3 do salário</p>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-muted-foreground">Provisão de 13º</p>
              <p className="text-2xl font-bold text-purple-500">
                {formatCurrency(totalProvisions.provisaoDecimoTerceiro)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">1/12 do salário</p>
            </div>

            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-muted-foreground">Provisão FGTS</p>
              <p className="text-2xl font-bold text-orange-500">
                {formatCurrency(totalProvisions.provisaoFgts)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">8% sobre férias e 13º</p>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Total Mensal</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalProvisions.totalProvisao)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Impacto no caixa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per Employee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provisão por Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeEmployees.map((employee) => {
              const provision = calculateProvisions(employee.salario_bruto);
              return (
                <div
                  key={employee.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{employee.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">{employee.cargo}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">Férias</p>
                      <p className="font-medium">{formatCurrency(provision.provisaoFerias)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">13º</p>
                      <p className="font-medium">{formatCurrency(provision.provisaoDecimoTerceiro)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">FGTS</p>
                      <p className="font-medium">{formatCurrency(provision.provisaoFgts)}</p>
                    </div>
                    <div className="text-center px-3 py-1 rounded bg-primary/10">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold text-primary">{formatCurrency(provision.totalProvisao)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

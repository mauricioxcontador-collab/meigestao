import { Employee } from "@/hooks/useLaborData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trash2, Calculator, UserMinus } from "lucide-react";
import { formatCurrency } from "@/lib/laborCalculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeListProps {
  employees: Employee[];
  onDelete: (id: string) => void;
  onCalculatePayroll: (employee: Employee) => void;
  onTerminate: (employee: Employee) => void;
}

export function EmployeeList({
  employees,
  onDelete,
  onCalculatePayroll,
  onTerminate,
}: EmployeeListProps) {
  const activeEmployees = employees.filter((e) => e.ativo);
  const inactiveEmployees = employees.filter((e) => !e.ativo);

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Use o formulário acima para cadastrar o primeiro funcionário
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Funcionários Ativos ({activeEmployees.length})
            </CardTitle>
            <CardDescription>
              Funcionários em regime CLT atualmente vinculados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{employee.nome_completo}</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {employee.cargo} • {formatCurrency(employee.salario_bruto)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Admissão: {format(new Date(employee.data_admissao), "dd/MM/yyyy", { locale: ptBR })}
                      {" • "} CPF: {employee.cpf}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCalculatePayroll(employee)}
                    >
                      <Calculator className="w-4 h-4 mr-1" />
                      Folha
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-warning hover:text-warning"
                      onClick={() => onTerminate(employee)}
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Rescindir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(employee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {inactiveEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Funcionários Desligados ({inactiveEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">
                        {employee.nome_completo}
                      </span>
                      <Badge variant="secondary">Desligado</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {employee.cargo} • {formatCurrency(employee.salario_bruto)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Admissão: {format(new Date(employee.data_admissao), "dd/MM/yyyy", { locale: ptBR })}
                      {employee.data_demissao && (
                        <>
                          {" • "}Demissão: {format(new Date(employee.data_demissao), "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

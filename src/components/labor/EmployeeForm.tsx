import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";

interface EmployeeFormProps {
  clientId: string;
  onSubmit: (employee: any) => Promise<any>;
  onCancel?: () => void;
}

export function EmployeeForm({ clientId, onSubmit, onCancel }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    cargo: "",
    salario_bruto: "",
    data_admissao: "",
    tipo_contrato: "CLT",
    jornada: "mensalista",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await onSubmit({
      client_id: clientId,
      nome_completo: formData.nome_completo,
      cpf: formData.cpf,
      cargo: formData.cargo,
      salario_bruto: parseFloat(formData.salario_bruto),
      data_admissao: formData.data_admissao,
      tipo_contrato: formData.tipo_contrato,
      jornada: formData.jornada,
      ativo: true,
    });

    setFormData({
      nome_completo: "",
      cpf: "",
      cargo: "",
      salario_bruto: "",
      data_admissao: "",
      tipo_contrato: "CLT",
      jornada: "mensalista",
    });
    setLoading(false);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Cadastrar Funcionário
        </CardTitle>
        <CardDescription>
          Preencha os dados do funcionário CLT
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                placeholder="Nome do funcionário"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Ex: Auxiliar Administrativo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario_bruto">Salário Bruto (R$)</Label>
              <Input
                id="salario_bruto"
                type="number"
                step="0.01"
                min="0"
                value={formData.salario_bruto}
                onChange={(e) => setFormData({ ...formData, salario_bruto: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_admissao">Data de Admissão</Label>
              <Input
                id="data_admissao"
                type="date"
                value={formData.data_admissao}
                onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_contrato">Tipo de Contrato</Label>
              <Select
                value={formData.tipo_contrato}
                onValueChange={(value) => setFormData({ ...formData, tipo_contrato: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="jornada">Jornada</Label>
              <Select
                value={formData.jornada}
                onValueChange={(value) => setFormData({ ...formData, jornada: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensalista">Mensalista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Funcionário
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

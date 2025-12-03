import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, Calendar, DollarSign, Briefcase } from "lucide-react";

interface Client {
  id: string;
  razao_social: string;
  cnpj: string;
  atividade: string | null;
  data_abertura: string | null;
  limite_faturamento_anual: number | null;
}

interface AccountInfoProps {
  client: Client | null;
}

export function AccountInfo({ client }: AccountInfoProps) {
  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando informações da conta...</p>
      </div>
    );
  }

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conta do Cliente</h1>
        <p className="text-muted-foreground">Dados cadastrais do seu MEI</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Razão Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.razao_social}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CNPJ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-mono">{formatCNPJ(client.cnpj)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Atividade Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{client.atividade || "Não informada"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Abertura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {client.data_abertura
                ? new Date(client.data_abertura).toLocaleDateString("pt-BR")
                : "Não informada"}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Limite de Faturamento Anual MEI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {(client.limite_faturamento_anual || 81000).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

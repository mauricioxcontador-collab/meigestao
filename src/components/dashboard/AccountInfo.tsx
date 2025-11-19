import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, FileText, Calendar, DollarSign } from "lucide-react";

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
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Carregando informações da conta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Informações da Conta</h2>
        <p className="text-muted-foreground">Dados cadastrais do seu MEI</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Razão Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{client.razao_social}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              CNPJ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{client.cnpj}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{client.atividade || "Não informada"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Data de Abertura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {client.data_abertura
                ? new Date(client.data_abertura).toLocaleDateString("pt-BR")
                : "Não informada"}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Limite de Faturamento Anual
            </CardTitle>
            <CardDescription>
              Limite máximo permitido para MEI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {client.limite_faturamento_anual
                ? client.limite_faturamento_anual.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "R$ 81.000,00"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

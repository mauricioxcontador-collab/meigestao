import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FileText, Calendar, DollarSign, Briefcase, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  onClientUpdate?: (updatedClient: Client) => void;
}

export function AccountInfo({ client, onClientUpdate }: AccountInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    razao_social: "",
    atividade: "",
    data_abertura: "",
  });

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

  const handleEdit = () => {
    setFormData({
      razao_social: client.razao_social,
      atividade: client.atividade || "",
      data_abertura: client.data_abertura || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          razao_social: formData.razao_social,
          atividade: formData.atividade || null,
          data_abertura: formData.data_abertura || null,
        })
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Dados atualizados com sucesso!");
      setIsEditing(false);
      
      if (onClientUpdate) {
        onClientUpdate({
          ...client,
          razao_social: formData.razao_social,
          atividade: formData.atividade || null,
          data_abertura: formData.data_abertura || null,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      toast.error("Erro ao atualizar dados. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Dados</h1>
            <p className="text-muted-foreground">Atualize as informações do seu MEI</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Razão Social
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                placeholder="Razão Social"
              />
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
              <p className="text-lg font-semibold font-mono text-muted-foreground">
                {formatCNPJ(client.cnpj)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">O CNPJ não pode ser alterado</p>
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
              <Input
                type="date"
                value={formData.data_abertura}
                onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Atividade Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.atividade}
                onChange={(e) => setFormData({ ...formData, atividade: e.target.value })}
                placeholder="Atividade Principal"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conta do Cliente</h1>
          <p className="text-muted-foreground">Dados cadastrais do seu MEI</p>
        </div>
        <Button variant="outline" onClick={handleEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar Dados
        </Button>
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

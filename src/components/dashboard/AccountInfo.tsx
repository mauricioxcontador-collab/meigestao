import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, FileText, Calendar, DollarSign, Briefcase, Pencil, Save, X, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";

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
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando informações...</p>
        </div>
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center shadow-lg">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Editar Dados</h1>
              <p className="text-muted-foreground">Atualize as informações do seu MEI</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="flex-1 sm:flex-initial h-11">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-initial h-11 bg-gradient-to-r from-primary to-secondary">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="sm:col-span-2 border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Razão Social
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                placeholder="Razão Social"
                className="h-12 text-base"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                CNPJ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold font-mono text-muted-foreground">
                {formatCNPJ(client.cnpj)}
              </p>
              <p className="text-xs text-muted-foreground mt-2 bg-muted px-2 py-1 rounded-md inline-block">
                O CNPJ não pode ser alterado
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                Data de Abertura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={formData.data_abertura}
                onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
                className="h-12 text-base"
              />
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-warning" />
                Atividade Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.atividade}
                onChange={(e) => setFormData({ ...formData, atividade: e.target.value })}
                placeholder="Ex: Comércio varejista de produtos"
                className="h-12 text-base"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-secondary/90 to-primary p-8">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/30">
              <img src={logoMeiGestao} alt="MEI Gestão" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Minha Conta</h1>
              <p className="text-white/80">Dados cadastrais do seu MEI</p>
            </div>
          </div>
          <Button 
            onClick={handleEdit}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar Dados
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              Razão Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{client.razao_social}</p>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-secondary" />
              </div>
              CNPJ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold font-mono">{formatCNPJ(client.cnpj)}</p>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-warning" />
              </div>
              Atividade Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{client.atividade || "Não informada"}</p>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-accent" />
              </div>
              Data de Abertura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {client.data_abertura
                ? new Date(client.data_abertura).toLocaleDateString("pt-BR")
                : "Não informada"}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              Limite de Faturamento Anual MEI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gradient">
              {(client.limite_faturamento_anual || 81000).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
            <p className="text-muted-foreground mt-2">Valor máximo de faturamento permitido para MEI em 2025</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

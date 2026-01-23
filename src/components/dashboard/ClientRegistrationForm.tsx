import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, "");
  
  if (cleaned.length !== 14) return false;
  
  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
};

const clientSchema = z.object({
  razao_social: z.string().min(3, "Razão social deve ter no mínimo 3 caracteres").max(200, "Razão social muito longa"),
  cnpj: z.string()
    .min(14, "CNPJ inválido")
    .max(18, "CNPJ inválido")
    .refine((val) => {
      const cleaned = val.replace(/\D/g, "");
      return cleaned.length === 14;
    }, "CNPJ deve ter 14 dígitos")
    .refine((val) => validateCNPJ(val), "CNPJ inválido"),
  atividade: z.string().min(3, "Atividade deve ter no mínimo 3 caracteres").max(200, "Atividade muito longa"),
  tipo_atividade: z.enum(["comercio", "servicos", "comercio_servicos"]),
  data_abertura: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

interface ClientRegistrationFormProps {
  userId: string;
  onSuccess: (clientId: string) => void;
}

export function ClientRegistrationForm({ userId, onSuccess }: ClientRegistrationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tipoAtividade, setTipoAtividade] = useState<"comercio" | "servicos" | "comercio_servicos">("comercio");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      tipo_atividade: "comercio",
    },
  });

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const onSubmit = async (data: ClientForm) => {
    setIsLoading(true);
    
    const cleanedCNPJ = data.cnpj.replace(/\D/g, "");

    // Get contador_user_id (for now, using a placeholder - needs proper assignment)
    const { data: contadorData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "contador")
      .limit(1)
      .maybeSingle();

    const clientData = {
      mei_user_id: userId,
      contador_user_id: contadorData?.user_id || userId, // Fallback to userId if no contador
      razao_social: data.razao_social.trim(),
      cnpj: cleanedCNPJ,
      atividade: data.atividade.trim(),
      tipo_atividade: data.tipo_atividade,
      data_abertura: data.data_abertura || null,
    };

    const { data: newClient, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao cadastrar MEI",
        description: error.message,
        variant: "destructive",
      });
    } else if (newClient) {
      toast({
        title: "MEI cadastrado com sucesso!",
        description: "Agora você pode começar a usar o sistema",
      });
      onSuccess(newClient.id);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl border-border">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-foreground">Cadastro do MEI</CardTitle>
              <CardDescription>
                Complete seu cadastro para começar a usar o sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                {...register("razao_social")}
                placeholder="Ex: João Silva MEI"
              />
              {errors.razao_social && (
                <p className="text-sm text-destructive mt-1">{errors.razao_social.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                {...register("cnpj", {
                  onChange: (e) => {
                    e.target.value = formatCNPJ(e.target.value);
                  }
                })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              {errors.cnpj && (
                <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="atividade">Atividade Principal *</Label>
              <Input
                id="atividade"
                {...register("atividade")}
                placeholder="Ex: Comércio varejista de artigos diversos"
              />
              {errors.atividade && (
                <p className="text-sm text-destructive mt-1">{errors.atividade.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tipo_atividade">Tipo de Atividade (para cálculo do DAS) *</Label>
              <Select
                value={tipoAtividade}
                onValueChange={(value: "comercio" | "servicos" | "comercio_servicos") => {
                  setTipoAtividade(value);
                  setValue("tipo_atividade", value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo de atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercio">Comércio ou Indústria - DAS R$ 82,05</SelectItem>
                  <SelectItem value="servicos">Prestação de Serviços - DAS R$ 86,05</SelectItem>
                  <SelectItem value="comercio_servicos">Comércio e Serviços - DAS R$ 87,05</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_atividade && (
                <p className="text-sm text-destructive mt-1">{errors.tipo_atividade.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="data_abertura">Data de Abertura (opcional)</Label>
              <Input
                id="data_abertura"
                type="date"
                {...register("data_abertura")}
              />
              {errors.data_abertura && (
                <p className="text-sm text-destructive mt-1">{errors.data_abertura.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary shadow-glow"
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Concluir Cadastro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, "");
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(12))) return false;
  
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
  data_abertura: z.string().optional(),
  mei_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

type ClientForm = z.infer<typeof clientSchema>;

interface AddClientFormProps {
  contadorUserId: string;
  onSuccess: () => void;
}

export function AddClientForm({ contadorUserId, onSuccess }: AddClientFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
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

    // For now, mei_user_id will be the same as contador_user_id (placeholder)
    // In a real scenario, this could be linked to an invited MEI user
    const clientData = {
      mei_user_id: contadorUserId, // Placeholder - will be updated when MEI accepts invite
      contador_user_id: contadorUserId,
      razao_social: data.razao_social.trim(),
      cnpj: cleanedCNPJ,
      atividade: data.atividade.trim(),
      data_abertura: data.data_abertura || null,
    };

    const { error } = await supabase
      .from("clients")
      .insert(clientData);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cliente cadastrado com sucesso!",
        description: `${data.razao_social} foi adicionado à sua carteira`,
      });
      reset();
      setOpen(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary shadow-glow">
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Cadastrar Novo Cliente MEI
          </DialogTitle>
          <DialogDescription>
            Adicione um novo cliente MEI à sua carteira
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
            <Label htmlFor="data_abertura">Data de Abertura (opcional)</Label>
            <Input
              id="data_abertura"
              type="date"
              {...register("data_abertura")}
            />
          </div>

          <div>
            <Label htmlFor="mei_email">E-mail do MEI (opcional)</Label>
            <Input
              id="mei_email"
              type="email"
              {...register("mei_email")}
              placeholder="mei@email.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O MEI poderá ser convidado posteriormente para acessar o sistema
            </p>
            {errors.mei_email && (
              <p className="text-sm text-destructive mt-1">{errors.mei_email.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary shadow-glow"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Cliente"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

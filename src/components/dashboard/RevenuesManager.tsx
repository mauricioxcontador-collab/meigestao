import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const revenueSchema = z.object({
  valor: z.string().min(1, "Valor é obrigatório").refine((val) => !isNaN(Number(val.replace(",", "."))), "Valor deve ser numérico"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(200, "Descrição muito longa"),
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória").max(100, "Categoria muito longa"),
});

type RevenueForm = z.infer<typeof revenueSchema>;

interface Revenue {
  id: string;
  valor: number;
  descricao: string;
  data: string;
  categoria: string;
}

export function RevenuesManager({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RevenueForm>({
    resolver: zodResolver(revenueSchema),
  });

  useEffect(() => {
    loadRevenues();
  }, [clientId]);

  const loadRevenues = async () => {
    const { data, error } = await supabase
      .from("revenues")
      .select("*")
      .eq("client_id", clientId)
      .order("data", { ascending: false })
      .limit(2);

    if (error) {
      toast({
        title: "Erro ao carregar receitas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRevenues(data || []);
    }
  };

  const onSubmit = async (formData: RevenueForm) => {
    const revenueData = {
      client_id: clientId,
      valor: Number(formData.valor.replace(",", ".")),
      descricao: formData.descricao.trim(),
      data: formData.data,
      categoria: formData.categoria.trim(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("revenues")
        .update(revenueData)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Erro ao atualizar receita",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Receita atualizada",
          description: "Receita atualizada com sucesso!",
        });
        setEditingId(null);
        reset();
        loadRevenues();
      }
    } else {
      const { error } = await supabase
        .from("revenues")
        .insert(revenueData);

      if (error) {
        toast({
          title: "Erro ao adicionar receita",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Receita adicionada",
          description: "Receita adicionada com sucesso!",
        });
        setIsAdding(false);
        reset();
        loadRevenues();
      }
    }
  };

  const startEdit = (revenue: Revenue) => {
    setEditingId(revenue.id);
    setIsAdding(false);
    reset({
      valor: revenue.valor.toString(),
      descricao: revenue.descricao,
      data: revenue.data,
      categoria: revenue.categoria,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    reset();
  };

  const canAddMore = revenues.length < 2;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Receitas</CardTitle>
        {canAddMore && !isAdding && !editingId && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form for adding/editing */}
        {(isAdding || editingId) && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                {...register("valor")}
                placeholder="0,00"
              />
              {errors.valor && <p className="text-sm text-destructive mt-1">{errors.valor.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                {...register("descricao")}
                placeholder="Ex: Venda de produtos"
              />
              {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao.message}</p>}
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                {...register("categoria")}
                placeholder="Ex: Vendas"
              />
              {errors.categoria && <p className="text-sm text-destructive mt-1">{errors.categoria.message}</p>}
            </div>

            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                {...register("data")}
              />
              {errors.data && <p className="text-sm text-destructive mt-1">{errors.data.message}</p>}
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* List of revenues */}
        {revenues.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma receita cadastrada
          </p>
        ) : (
          <div className="space-y-3">
            {revenues.map((revenue) => (
              <div
                key={revenue.id}
                className="p-4 border border-border rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-success">
                      R$ {Number(revenue.valor).toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(revenue.data).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{revenue.descricao}</p>
                  <span className="text-xs text-muted-foreground">{revenue.categoria}</span>
                </div>
                {!editingId && !isAdding && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(revenue)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

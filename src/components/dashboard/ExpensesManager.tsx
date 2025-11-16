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

const expenseSchema = z.object({
  valor: z.string().min(1, "Valor é obrigatório").refine((val) => !isNaN(Number(val.replace(",", "."))), "Valor deve ser numérico"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(200, "Descrição muito longa"),
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória").max(100, "Categoria muito longa"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface Expense {
  id: string;
  valor: number;
  descricao: string;
  data: string;
  categoria: string;
}

export function ExpensesManager({ clientId, onUpdate }: { clientId: string; onUpdate?: () => void }) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
  });

  useEffect(() => {
    loadExpenses();
  }, [clientId]);

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("client_id", clientId)
      .order("data", { ascending: false })
      .limit(2);

    if (error) {
      toast({
        title: "Erro ao carregar despesas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExpenses(data || []);
    }
  };

  const onSubmit = async (formData: ExpenseForm) => {
    const expenseData = {
      client_id: clientId,
      valor: Number(formData.valor.replace(",", ".")),
      descricao: formData.descricao.trim(),
      data: formData.data,
      categoria: formData.categoria.trim(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("expenses")
        .update(expenseData)
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Erro ao atualizar despesa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Despesa atualizada",
          description: "Despesa atualizada com sucesso!",
        });
        setEditingId(null);
        reset();
        loadExpenses();
        onUpdate?.();
      }
    } else {
      const { error } = await supabase
        .from("expenses")
        .insert(expenseData);

      if (error) {
        toast({
          title: "Erro ao adicionar despesa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Despesa adicionada",
          description: "Despesa adicionada com sucesso!",
        });
        setIsAdding(false);
        reset();
        loadExpenses();
        onUpdate?.();
      }
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setIsAdding(false);
    reset({
      valor: expense.valor.toString(),
      descricao: expense.descricao,
      data: expense.data,
      categoria: expense.categoria,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    reset();
  };

  const canAddMore = expenses.length < 2;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Despesas</CardTitle>
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
                placeholder="Ex: Material de escritório"
              />
              {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao.message}</p>}
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                {...register("categoria")}
                placeholder="Ex: Material"
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

        {/* List of expenses */}
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma despesa cadastrada
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 border border-border rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">
                      R$ {Number(expense.valor).toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(expense.data).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{expense.descricao}</p>
                  <span className="text-xs text-muted-foreground">{expense.categoria}</span>
                </div>
                {!editingId && !isAdding && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(expense)}
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

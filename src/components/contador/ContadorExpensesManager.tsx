import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Save, Trash2, X, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ContadorExpense {
  id: string;
  valor: number;
  descricao: string | null;
  categoria: string;
  data: string;
  client_id: string | null;
  client_name?: string;
}

interface Client {
  id: string;
  razao_social: string;
}

interface ContadorExpensesManagerProps {
  contadorUserId: string;
  clients: Client[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function ContadorExpensesManager({ contadorUserId, clients }: ContadorExpensesManagerProps) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<ContadorExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Aluguel");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [clientId, setClientId] = useState<string>("none");

  useEffect(() => {
    loadExpenses();
  }, [contadorUserId]);

  const loadExpenses = async () => {
    setLoading(true);
    const { data: expData, error } = await supabase
      .from("contador_expenses")
      .select("*")
      .eq("contador_user_id", contadorUserId)
      .order("data", { ascending: false });

    if (error) {
      console.error("Error loading contador expenses:", error);
    } else {
      const enriched = (expData || []).map((e) => {
        const client = clients.find((c) => c.id === e.client_id);
        return { ...e, client_name: client?.razao_social || undefined };
      });
      setExpenses(enriched);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setValor("");
    setDescricao("");
    setCategoria("Aluguel");
    setData(new Date().toISOString().split("T")[0]);
    setClientId("none");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValor = Number(valor.replace(",", "."));
    if (isNaN(numericValor) || numericValor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    const payload = {
      contador_user_id: contadorUserId,
      valor: numericValor,
      descricao: descricao.trim() || null,
      categoria: categoria.trim(),
      data,
      client_id: clientId === "none" ? null : clientId,
    };

    if (editingId) {
      const { error } = await supabase
        .from("contador_expenses")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Despesa atualizada!" });
    } else {
      const { error } = await supabase
        .from("contador_expenses")
        .insert(payload as any);
      if (error) {
        toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Despesa adicionada!" });
    }

    resetForm();
    loadExpenses();
  };

  const startEdit = (exp: ContadorExpense) => {
    setEditingId(exp.id);
    setIsAdding(true);
    setValor(exp.valor.toString());
    setDescricao(exp.descricao || "");
    setCategoria(exp.categoria);
    setData(exp.data);
    setClientId(exp.client_id || "none");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contador_expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Despesa excluída!" });
      loadExpenses();
    }
  };

  const totalMonth = expenses
    .filter((e) => {
      const now = new Date();
      const d = new Date(e.data);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + Number(e.valor), 0);

  const categories = ["Aluguel", "Software", "Contabilidade", "Marketing", "Salários", "Impostos", "Material de Escritório", "Transporte", "Outros"];

  return (
    <div className="space-y-6">
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do Mês</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(totalMonth)}</div>
          <p className="text-xs text-muted-foreground mt-1">Despesas operacionais do escritório</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Nova Despesa
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Valor (R$)</Label>
                <Input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" required />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente (opcional)</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Aluguel do escritório" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" size="sm">
                  <Save className="w-4 h-4 mr-2" /> {editingId ? "Salvar" : "Adicionar"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Despesas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma despesa cadastrada</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{new Date(exp.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{exp.categoria}</TableCell>
                      <TableCell>{exp.descricao || "-"}</TableCell>
                      <TableCell>{exp.client_name || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {formatCurrency(Number(exp.valor))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(exp)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(exp.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

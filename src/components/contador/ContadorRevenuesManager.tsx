import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Save, Trash2, X, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ContadorRevenue {
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

interface ContadorRevenuesManagerProps {
  contadorUserId: string;
  clients: Client[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function ContadorRevenuesManager({ contadorUserId, clients }: ContadorRevenuesManagerProps) {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<ContadorRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Honorários");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [clientId, setClientId] = useState<string>("none");

  useEffect(() => {
    loadRevenues();
  }, [contadorUserId]);

  const loadRevenues = async () => {
    setLoading(true);
    const { data: revData, error } = await supabase
      .from("contador_revenues")
      .select("*")
      .eq("contador_user_id", contadorUserId)
      .order("data", { ascending: false });

    if (error) {
      console.error("Error loading contador revenues:", error);
    } else {
      const enriched = (revData || []).map((r) => {
        const client = clients.find((c) => c.id === r.client_id);
        return { ...r, client_name: client?.razao_social || undefined };
      });
      setRevenues(enriched);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setValor("");
    setDescricao("");
    setCategoria("Honorários");
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
        .from("contador_revenues")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Receita atualizada!" });
    } else {
      const { error } = await supabase
        .from("contador_revenues")
        .insert(payload as any);
      if (error) {
        toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Receita adicionada!" });
    }

    resetForm();
    loadRevenues();
  };

  const startEdit = (rev: ContadorRevenue) => {
    setEditingId(rev.id);
    setIsAdding(true);
    setValor(rev.valor.toString());
    setDescricao(rev.descricao || "");
    setCategoria(rev.categoria);
    setData(rev.data);
    setClientId(rev.client_id || "none");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contador_revenues").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Receita excluída!" });
      loadRevenues();
    }
  };

  const totalMonth = revenues
    .filter((r) => {
      const now = new Date();
      const d = new Date(r.data);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, r) => sum + Number(r.valor), 0);

  const categories = ["Honorários", "Consultoria", "Declarações", "Folha de Pagamento", "Outros"];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-success/30 bg-success/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
          <DollarSign className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{formatCurrency(totalMonth)}</div>
          <p className="text-xs text-muted-foreground mt-1">Honorários e outras receitas</p>
        </CardContent>
      </Card>

      {/* Add button */}
      <div className="flex justify-end">
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Nova Receita
          </Button>
        )}
      </div>

      {/* Form */}
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
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Honorário mensal" />
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

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : revenues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma receita cadastrada</p>
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
                  {revenues.map((rev) => (
                    <TableRow key={rev.id}>
                      <TableCell>{new Date(rev.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{rev.categoria}</TableCell>
                      <TableCell>{rev.descricao || "-"}</TableCell>
                      <TableCell>{rev.client_name || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(Number(rev.valor))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(rev)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(rev.id)}>
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

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DollarSign, TrendingUp, AlertCircle, TrendingDown, Plus, Save, X, Pencil, Trash2, Calendar, Wallet, Loader2 } from "lucide-react";
import { TaxSimulation } from "@/components/tax/TaxSimulation";
import { MonthlyGrowthChart } from "@/components/charts/MonthlyGrowthChart";
import { useToast } from "@/hooks/use-toast";
import { ClientRegistrationForm } from "@/components/dashboard/ClientRegistrationForm";
import { AccountInfo } from "@/components/dashboard/AccountInfo";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { ContadorInviteManager } from "@/components/contador/ContadorInviteManager";
import { ReceivedInvitesManager } from "@/components/mei/ReceivedInvitesManager";
import { useForm } from "react-hook-form";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { Lock } from "lucide-react";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";

interface Revenue {
  id: string;
  valor: number;
  descricao: string;
  categoria: string;
  data: string;
}

interface Expense {
  id: string;
  valor: number;
  descricao: string;
  categoria: string;
  data: string;
}

function RevenuesList({ clientId }: { clientId: string }) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(revenues.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRevenues = revenues.slice(startIndex, endIndex);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      valor: "",
      descricao: "",
      categoria: "",
      data: "",
    }
  });

  useEffect(() => {
    loadRevenues();
  }, [clientId]);

  const loadRevenues = async () => {
    const { data, error } = await supabase
      .from("revenues")
      .select("id, valor, descricao, categoria, data")
      .eq("client_id", clientId)
      .order("data", { ascending: false });

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

  const onSubmit = async (formData: any) => {
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

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from("revenues")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast({
        title: "Erro ao deletar receita",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Receita deletada",
        description: "Receita deletada com sucesso!",
      });
      setDeletingId(null);
      loadRevenues();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Receitas Cadastradas</CardTitle>
            <CardDescription>Lista de todas as suas receitas</CardDescription>
          </div>
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(isAdding || editingId) && (
          <Card className="mb-4 border-primary">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      {...register("valor", { required: true })}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      {...register("data", { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      {...register("descricao", { required: true })}
                      placeholder="Ex: Venda de produto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Input
                      id="categoria"
                      {...register("categoria", { required: true })}
                      placeholder="Ex: Vendas"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="gradient-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? "Atualizar" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {revenues.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma receita cadastrada</p>
        ) : (
          <>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {currentRevenues.map((revenue) => (
              <Card key={revenue.id} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="text-lg font-semibold text-success">{formatCurrency(revenue.valor)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="text-lg font-medium">{new Date(revenue.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Descrição</p>
                        <p className="text-base">{revenue.descricao}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Categoria</p>
                        <p className="text-base">{revenue.categoria}</p>
                      </div>
                    </div>
                    {!isAdding && !editingId && (
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(revenue)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingId(revenue.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            </ScrollArea>
            
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ExpensesList({ clientId }: { clientId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentExpenses = expenses.slice(startIndex, endIndex);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      valor: "",
      descricao: "",
      categoria: "",
      data: "",
    }
  });

  useEffect(() => {
    loadExpenses();
  }, [clientId]);

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("id, valor, descricao, categoria, data")
      .eq("client_id", clientId)
      .order("data", { ascending: false });

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

  const onSubmit = async (formData: any) => {
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

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", deletingId);

    if (error) {
      toast({
        title: "Erro ao deletar despesa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Despesa deletada",
        description: "Despesa deletada com sucesso!",
      });
      setDeletingId(null);
      loadExpenses();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Despesas Cadastradas</CardTitle>
            <CardDescription>Lista de todas as suas despesas</CardDescription>
          </div>
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(isAdding || editingId) && (
          <Card className="mb-4 border-primary">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      {...register("valor", { required: true })}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      {...register("data", { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      {...register("descricao", { required: true })}
                      placeholder="Ex: Compra de material"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Input
                      id="categoria"
                      {...register("categoria", { required: true })}
                      placeholder="Ex: Material"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="gradient-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? "Atualizar" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma despesa cadastrada</p>
        ) : (
          <>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {currentExpenses.map((expense) => (
              <Card key={expense.id} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="text-lg font-semibold text-destructive">{formatCurrency(expense.valor)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="text-lg font-medium">{new Date(expense.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Descrição</p>
                        <p className="text-base">{expense.descricao}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Categoria</p>
                        <p className="text-base">{expense.categoria}</p>
                      </div>
                    </div>
                    {!isAdding && !editingId && (
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(expense)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingId(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            </ScrollArea>
            
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface Client {
  id: string;
  razao_social: string;
  cnpj: string;
  atividade: string | null;
  tipo_atividade: string | null;
  data_abertura: string | null;
  limite_faturamento_anual: number | null;
}

const DashboardMEI = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [annualRevenue, setAnnualRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [showClientForm, setShowClientForm] = useState(false);

  const currentTab = searchParams.get("tab") || "dashboard";

  const { isContador, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    // Redirect contador users to their dashboard
    if (!roleLoading && isContador) {
      navigate("/contador");
      return;
    }
  }, [roleLoading, isContador, navigate]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      const { data: clientData } = await supabase
        .from("clients")
        .select("id, razao_social, cnpj, atividade, tipo_atividade, data_abertura, limite_faturamento_anual")
        .eq("mei_user_id", session.user.id)
        .maybeSingle();

      if (clientData) {
        setClient(clientData);
        loadRevenues(clientData.id);
        loadExpenses(clientData.id);
      } else {
        setShowClientForm(true);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time subscription for revenues and expenses
  useEffect(() => {
    if (!client?.id) return;

    const channel = supabase
      .channel("dashboard-financial-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "revenues",
        },
        () => {
          loadRevenues(client.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        () => {
          loadExpenses(client.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client?.id]);

  const loadRevenues = async (clientId: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const { data: revenues, error } = await supabase
      .from("revenues")
      .select("valor, data")
      .eq("client_id", clientId)
      .gte("data", `${currentYear}-01-01`)
      .lte("data", `${currentYear}-12-31`);

    if (error) {
      console.error("Error loading revenues:", error);
      return;
    }

    if (revenues) {
      const annual = revenues.reduce((sum, rev) => sum + Number(rev.valor), 0);
      setAnnualRevenue(annual);

      const monthly = revenues
        .filter((rev) => {
          const revenueDate = new Date(rev.data);
          return revenueDate.getMonth() === currentMonth && 
                 revenueDate.getFullYear() === currentYear;
        })
        .reduce((sum, rev) => sum + Number(rev.valor), 0);
      setMonthlyRevenue(monthly);
    }
  };

  const loadExpenses = async (clientId: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("valor")
      .eq("client_id", clientId)
      .gte("data", `${currentYear}-01-01`)
      .lte("data", `${currentYear}-12-31`);

    if (error) {
      console.error("Error loading expenses:", error);
      return;
    }

    if (expenses) {
      const total = expenses.reduce((sum, exp) => sum + Number(exp.valor), 0);
      setTotalExpenses(total);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDASValue = (tipoAtividade: string | null): number => {
    switch (tipoAtividade) {
      case "comercio":
        return 82.05;
      case "servicos":
        return 86.05;
      case "comercio_servicos":
        return 87.05;
      default:
        return 82.05;
    }
  };

  const getDASDescription = (): string => {
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 20);
    return `Vencimento: ${dueDate.toLocaleDateString('pt-BR')}`;
  };

  const percentageUsed = ((annualRevenue / 81000) * 100).toFixed(1);

  if (!user) return null;

  const renderContent = () => {
    if (showClientForm) {
      return (
        <ClientRegistrationForm 
          userId={user.id} 
          onSuccess={(newClientId) => {
            // Reload client data after registration
            supabase
              .from("clients")
              .select("id, razao_social, cnpj, atividade, tipo_atividade, data_abertura, limite_faturamento_anual")
              .eq("id", newClientId)
              .single()
              .then(({ data }) => {
                if (data) {
                  setClient(data);
                  setShowClientForm(false);
                  loadRevenues(data.id);
                  loadExpenses(data.id);
                }
              });
          }} 
        />
      );
    }

    switch (currentTab) {
      case "receitas":
        return client && <RevenuesList clientId={client.id} />;
      case "despesas":
        return client && <ExpensesList clientId={client.id} />;
      case "impostos":
        return client && <TaxSimulation clientId={client.id} tipoAtividade={client.tipo_atividade} />;
      case "contador-gestao":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Meu Contador
              </h1>
              <p className="text-muted-foreground">
                Gerencie convites de contadores e controle quem tem acesso aos seus dados
              </p>
            </div>
            <ReceivedInvitesManager />
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Convidar um Contador</h2>
              <ContadorInviteManager />
            </div>
          </div>
        );
      case "conta":
        return <AccountInfo client={client} onClientUpdate={setClient} />;
      default:
        return (
          <div className="space-y-8">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-secondary to-primary p-5 sm:p-8 lg:p-10">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
              </div>
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/30">
                  <img src={logoMeiGestao} alt="MEI Gestão" className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 break-words">
                    Olá, {user?.user_metadata?.full_name || "MEI"}!
                  </h1>
                  <p className="text-white/80 text-sm sm:text-lg">
                    Bem-vindo ao seu painel de controle financeiro
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-3 text-white/80">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
              </div>
            </div>

            {/* DAS Alert */}
            {client && (
              <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent p-5 shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">DAS Mensal</h3>
                      <p className="text-sm text-muted-foreground">
                        {client.tipo_atividade === 'comercio' && 'Comércio ou Indústria'}
                        {client.tipo_atividade === 'servicos' && 'Prestação de Serviços'}
                        {client.tipo_atividade === 'comercio_servicos' && 'Comércio e Serviços'}
                        {!client.tipo_atividade && 'Tipo não definido'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-2xl font-bold text-warning">{formatCurrency(getDASValue(client.tipo_atividade))}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">Vencimento</p>
                      <p className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-warning" />
                        Dia 20
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Mensal</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Faturamento</p>
                  <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(monthlyRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                    <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">Anual</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Faturamento</p>
                  <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(annualRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingDown className="h-6 w-6 text-destructive" />
                    </div>
                    <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">Despesas</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total no Ano</p>
                  <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                    <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">DAS</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{getDASDescription()}</p>
                  <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(getDASValue(client?.tipo_atividade))}</p>
                </CardContent>
              </Card>
            </div>

            {/* Limit Progress */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
              <CardContent className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <Wallet className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Limite Anual MEI</h3>
                      <p className="text-muted-foreground">Acompanhe seu faturamento em relação ao limite</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{percentageUsed}%</p>
                    <p className="text-sm text-muted-foreground">utilizado</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        parseFloat(percentageUsed) > 90 
                          ? "bg-destructive" 
                          : parseFloat(percentageUsed) > 70 
                            ? "bg-warning" 
                            : "bg-gradient-to-r from-primary to-secondary"
                      }`}
                      style={{ width: `${Math.min(parseFloat(percentageUsed), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                    <span>{formatCurrency(annualRevenue)}</span>
                    <span>{formatCurrency(81000)}</span>
                  </div>
                </div>
                {parseFloat(percentageUsed) > 80 && (
                  <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                    <p className="text-sm text-warning">Atenção! Você está próximo do limite anual de faturamento do MEI.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Receitas do Ano</CardTitle>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-accent mb-2">{formatCurrency(annualRevenue)}</div>
                  <p className="text-muted-foreground">Acumulado em {new Date().getFullYear()}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Despesas do Ano</CardTitle>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center shadow-lg">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-destructive mb-2">{formatCurrency(totalExpenses)}</div>
                  <p className="text-muted-foreground">Acumulado em {new Date().getFullYear()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Growth Chart */}
            {client && <MonthlyGrowthChart clientId={client.id} />}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar userEmail={user?.email || ""} onLogout={handleLogout} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto lg:ml-0 pt-20 lg:pt-8 min-w-0">
        {renderContent()}
      </main>
    </div>
  );
};

export default DashboardMEI;

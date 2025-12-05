import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DollarSign, TrendingUp, AlertCircle, TrendingDown, Plus, Save, X, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientRegistrationForm } from "@/components/dashboard/ClientRegistrationForm";
import { AccountInfo } from "@/components/dashboard/AccountInfo";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useForm } from "react-hook-form";
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
        .select("id, razao_social, cnpj, atividade, data_abertura, limite_faturamento_anual")
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

  const getDASValue = (activity: string): number => {
    const activityLower = activity.toLowerCase();
    if (activityLower.includes("comércio") && activityLower.includes("serviço")) {
      return 81.90;
    }
    if (activityLower.includes("serviço")) {
      return 80.90;
    }
    return 76.90;
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
              .select("id, razao_social, cnpj, atividade, data_abertura, limite_faturamento_anual")
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
      case "conta":
        return <AccountInfo client={client} onClientUpdate={setClient} />;
      default:
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl gradient-hero p-8 text-primary-foreground">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
              </div>
              <div className="relative flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <img src={logoMeiGestao} alt="MEI Gestão" className="w-14 h-14 object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Olá, {user?.user_metadata?.full_name || "MEI"}!
                  </h1>
                  <p className="text-white/80 mt-1">
                    Bem-vindo ao seu painel de controle financeiro
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-hover border-0 shadow-md overflow-hidden">
                <div className="h-1 gradient-primary" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Faturamento Mensal
                  </CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{formatCurrency(monthlyRevenue)}</div>
                  <p className="text-sm text-muted-foreground mt-1">Mês atual</p>
                </CardContent>
              </Card>

              <Card className="card-hover border-0 shadow-md overflow-hidden">
                <div className={`h-1 ${annualRevenue > 81000 ? "bg-destructive" : "bg-accent"}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Faturamento Anual
                  </CardTitle>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${annualRevenue > 81000 ? "bg-destructive/10" : "bg-accent/10"}`}>
                    <TrendingUp className={`h-5 w-5 ${annualRevenue > 81000 ? "text-destructive" : "text-accent"}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{formatCurrency(annualRevenue)}</div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Limite utilizado</span>
                      <span className="font-semibold">{percentageUsed}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${annualRevenue > 81000 ? "bg-destructive" : "gradient-hero"}`}
                        style={{ width: `${Math.min(parseFloat(percentageUsed), 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-warning" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    DAS do Mês
                  </CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{formatCurrency(getDASValue(client?.atividade || ""))}</div>
                  <p className="text-sm text-muted-foreground mt-1">{getDASDescription()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="card-hover border-0 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Total de Receitas</CardTitle>
                  <div className="h-12 w-12 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
                    <TrendingUp className="h-6 w-6 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-accent">{formatCurrency(annualRevenue)}</div>
                  <p className="text-sm text-muted-foreground mt-2">Acumulado no ano</p>
                </CardContent>
              </Card>

              <Card className="card-hover border-0 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Total de Despesas</CardTitle>
                  <div className="h-12 w-12 rounded-2xl bg-destructive flex items-center justify-center shadow-md">
                    <TrendingDown className="h-6 w-6 text-destructive-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
                  <p className="text-sm text-muted-foreground mt-2">Acumulado no ano</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userEmail={user?.email || ""} onLogout={handleLogout} />
        <main className="flex-1 p-8 overflow-auto bg-background">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardMEI;

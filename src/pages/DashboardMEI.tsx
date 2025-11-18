import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { LogOut, DollarSign, TrendingUp, AlertCircle, TrendingDown, Plus, Save, X, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExpensesManager } from "@/components/dashboard/ExpensesManager";
import { RevenuesManager } from "@/components/dashboard/RevenuesManager";
import { ClientRegistrationForm } from "@/components/dashboard/ClientRegistrationForm";
import { useForm } from "react-hook-form";

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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(revenue)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
    </Card>
  );
}

function ExpensesList({ clientId }: { clientId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(expense)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
    </Card>
  );
}

const DashboardMEI = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientActivity, setClientActivity] = useState<string>("");
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [annualRevenue, setAnnualRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [showClientForm, setShowClientForm] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Load client data
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, atividade")
        .eq("mei_user_id", session.user.id)
        .maybeSingle();

      if (clientData) {
        setClientId(clientData.id);
        setClientActivity(clientData.atividade || "");
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

    // Get all revenues for the current year
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
      // Calculate annual revenue
      const annual = revenues.reduce((sum, rev) => sum + Number(rev.valor), 0);
      setAnnualRevenue(annual);

      // Calculate monthly revenue (current month)
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

    // Get all expenses for the current year
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
    
    // Comércio e Serviços (simultaneamente)
    if (activityLower.includes("comércio") && activityLower.includes("serviço")) {
      return 81.90;
    }
    // Prestação de Serviços
    if (activityLower.includes("serviço")) {
      return 80.90;
    }
    // Comércio ou Indústria (padrão)
    return 76.90;
  };

  const getDASDescription = (): string => {
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 20);
    
    return `Vencimento: ${dueDate.toLocaleDateString('pt-BR')}`;
  };

  const percentageUsed = ((annualRevenue / 81000) * 100).toFixed(1);

  const metrics = [
    {
      title: "Faturamento Mensal",
      value: formatCurrency(monthlyRevenue),
      description: "Mês atual",
      icon: DollarSign,
      color: "text-primary"
    },
    {
      title: "Faturamento Anual",
      value: formatCurrency(annualRevenue),
      description: `${percentageUsed}% do limite (R$ 81.000,00)`,
      icon: TrendingUp,
      color: annualRevenue > 81000 ? "text-destructive" : "text-success"
    },
    {
      title: "DAS do Mês",
      value: formatCurrency(getDASValue(clientActivity)),
      description: getDASDescription(),
      icon: AlertCircle,
      color: "text-warning"
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary" />
            <span className="text-xl font-bold text-foreground">MEI Gestão</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.email}
            </span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {showClientForm ? (
          <ClientRegistrationForm 
            userId={user.id} 
            onSuccess={(newClientId) => {
              setClientId(newClientId);
              setShowClientForm(false);
              loadRevenues(newClientId);
            }} 
          />
        ) : (
          <>
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="receitas">Receitas</TabsTrigger>
                <TabsTrigger value="despesas">Despesas</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Olá, {user?.user_metadata?.full_name || "MEI"}!
                  </h1>
                  <p className="text-muted-foreground">
                    Bem-vindo ao seu painel de controle
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {metrics.map((metric, index) => (
                    <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {metric.title}
                        </CardTitle>
                        <metric.icon className={`h-5 w-5 ${metric.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground mb-1">
                          {metric.value}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Summary Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base font-medium">Total de Receitas</CardTitle>
                      <TrendingUp className="h-5 w-5 text-success" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-success">
                        {formatCurrency(annualRevenue)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acumulado no ano
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base font-medium">Total de Despesas</CardTitle>
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-destructive">
                        {formatCurrency(totalExpenses)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acumulado no ano
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="receitas">
                {clientId && <RevenuesList clientId={clientId} />}
              </TabsContent>

              <TabsContent value="despesas">
                {clientId && <ExpensesList clientId={clientId} />}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardMEI;

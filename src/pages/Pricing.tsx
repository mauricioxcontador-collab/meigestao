import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calculator, TrendingUp, AlertTriangle, CheckCircle2, Save, Trash2, DollarSign, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, Legend } from "recharts";

interface PricingRow {
  id: string;
  nome: string;
  preco_venda: number;
  lucro_unitario: number;
  margem_real: number;
  created_at: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isFinite(v) ? v : 0);

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<PricingRow[]>([]);

  // Form
  const [nome, setNome] = useState("Meu Produto");
  const [tipo, setTipo] = useState("produto");
  const [custoProduto, setCustoProduto] = useState(0);
  const [transporte, setTransporte] = useState(0);
  const [gasolina, setGasolina] = useState(0);
  const [embalagem, setEmbalagem] = useState(0);
  const [taxas, setTaxas] = useState(0);
  const [despesasFixas, setDespesasFixas] = useState(0);
  const [quantidade, setQuantidade] = useState(10);
  const [margem, setMargem] = useState(30);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserEmail(session.user.email || "");
    const { data: clients } = await supabase
      .from("clients")
      .select("id")
      .eq("mei_user_id", session.user.id)
      .limit(1);
    if (clients && clients.length > 0) {
      const cid = clients[0].id;
      setClientId(cid);

      // Carregar despesas fixas reais do mês atual
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const { data: exp } = await supabase
        .from("expenses")
        .select("valor")
        .eq("client_id", cid)
        .gte("data", start)
        .lte("data", end);
      if (exp) {
        const total = exp.reduce((a, b) => a + Number(b.valor), 0);
        setDespesasFixas(total);
      }

      await loadSaved(cid);
    }
    setLoading(false);
  };

  const loadSaved = async (cid: string) => {
    const { data } = await supabase
      .from("pricing_calculations")
      .select("id, nome, preco_venda, lucro_unitario, margem_real, created_at")
      .eq("client_id", cid)
      .order("created_at", { ascending: false });
    if (data) setSavedList(data as PricingRow[]);
  };

  const calc = useMemo(() => {
    const custosExtras = transporte + gasolina + embalagem + taxas;
    const rateioFixo = quantidade > 0 ? despesasFixas / quantidade : 0;
    const custoTotalUnitario = custoProduto + custosExtras + rateioFixo;
    // Preço pelo markup sobre custo: margem sobre o preço de venda
    const m = Math.min(Math.max(margem, 0), 99);
    const precoVenda = custoTotalUnitario / (1 - m / 100);
    const lucroUnitario = precoVenda - custoTotalUnitario;
    const margemReal = precoVenda > 0 ? (lucroUnitario / precoVenda) * 100 : 0;
    const lucroTotal = lucroUnitario * quantidade;
    const receitaTotal = precoVenda * quantidade;
    return {
      custosExtras,
      rateioFixo,
      custoTotalUnitario,
      precoVenda,
      lucroUnitario,
      margemReal,
      lucroTotal,
      receitaTotal,
    };
  }, [custoProduto, transporte, gasolina, embalagem, taxas, despesasFixas, quantidade, margem]);

  const insights = useMemo(() => {
    const arr: { type: "warn" | "ok" | "info"; text: string }[] = [];
    if (calc.margemReal < 10) arr.push({ type: "warn", text: "Sua margem está muito baixa. Você corre o risco de vender no prejuízo." });
    else if (calc.margemReal < 20) arr.push({ type: "warn", text: "Sua margem está abaixo do recomendado para MEIs (mínimo 20–30%)." });
    else if (calc.margemReal >= 40) arr.push({ type: "ok", text: "Excelente margem de lucro. Preço bem posicionado." });
    else arr.push({ type: "ok", text: "Margem dentro da faixa saudável para o seu negócio." });

    if (calc.lucroUnitario <= 0) arr.push({ type: "warn", text: "Você está cobrando ABAIXO do custo. Aumente o preço imediatamente." });
    if (calc.rateioFixo > custoProduto && custoProduto > 0)
      arr.push({ type: "info", text: "Suas despesas fixas pesam mais que o custo do produto. Considere vender mais para diluir custos." });

    const desejado = 100;
    const precoParaLucro = calc.custoTotalUnitario + desejado;
    arr.push({ type: "info", text: `Para lucrar R$ ${desejado.toFixed(2)} por unidade, o preço deve ser ${formatCurrency(precoParaLucro)}.` });
    return arr;
  }, [calc, custoProduto]);

  const barData = [
    { name: "Custo Total", valor: calc.custoTotalUnitario },
    { name: "Preço de Venda", valor: calc.precoVenda },
    { name: "Lucro", valor: calc.lucroUnitario },
  ];

  const pieData = [
    { name: "Custo do Produto", value: custoProduto },
    { name: "Transporte", value: transporte },
    { name: "Gasolina", value: gasolina },
    { name: "Embalagem", value: embalagem },
    { name: "Taxas", value: taxas },
    { name: "Rateio Despesas Fixas", value: calc.rateioFixo },
  ].filter((d) => d.value > 0);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

  const handleSave = async () => {
    if (!clientId) {
      toast.error("Cadastre seus dados de MEI primeiro.");
      return;
    }
    if (!nome.trim()) {
      toast.error("Informe o nome do produto/serviço.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("pricing_calculations").insert({
      client_id: clientId,
      nome: nome.trim().slice(0, 200),
      tipo,
      custo_produto: custoProduto,
      custo_transporte: transporte,
      custo_gasolina: gasolina,
      custo_embalagem: embalagem,
      custo_taxas: taxas,
      despesas_fixas_mensais: despesasFixas,
      quantidade_vendas: quantidade,
      margem_desejada: margem,
      custo_total_unitario: calc.custoTotalUnitario,
      preco_venda: calc.precoVenda,
      lucro_unitario: calc.lucroUnitario,
      margem_real: calc.margemReal,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar precificação.");
      return;
    }
    toast.success("Precificação salva!");
    await loadSaved(clientId);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pricing_calculations").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir.");
      return;
    }
    toast.success("Excluído.");
    if (clientId) await loadSaved(clientId);
  };

  const handleAddRevenue = async () => {
    if (!clientId) return;
    const { error } = await supabase.from("revenues").insert({
      client_id: clientId,
      valor: calc.precoVenda,
      data: new Date().toISOString().split("T")[0],
      categoria: "Venda",
      descricao: `Venda - ${nome}`,
    });
    if (error) {
      toast.error("Erro ao vincular receita.");
      return;
    }
    toast.success("Receita adicionada!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar userEmail={userEmail} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Precificação</h1>
              <p className="text-muted-foreground">Calcule o preço ideal de produtos e serviços</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Formulário */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Dados de Custo</CardTitle>
                <CardDescription>Informe todos os custos envolvidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do produto/serviço</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produto">Produto</SelectItem>
                        <SelectItem value="servico">Serviço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <NumberField label="Custo do produto/serviço (R$)" value={custoProduto} onChange={setCustoProduto} />
                  <NumberField label="Transporte (R$)" value={transporte} onChange={setTransporte} />
                  <NumberField label="Gasolina (R$)" value={gasolina} onChange={setGasolina} />
                  <NumberField label="Embalagem (R$)" value={embalagem} onChange={setEmbalagem} />
                  <NumberField label="Taxas - cartão/plataforma (R$)" value={taxas} onChange={setTaxas} />
                  <NumberField label="Despesas fixas mensais (R$)" value={despesasFixas} onChange={setDespesasFixas} hint="Pré-preenchido com despesas reais do mês" />
                  <NumberField label="Quantidade de vendas no mês" value={quantidade} onChange={(v) => setQuantidade(Math.max(1, Math.floor(v)))} integer />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Label>Margem de lucro desejada</Label>
                    <span className="text-sm font-bold text-primary">{margem.toFixed(0)}%</span>
                  </div>
                  <Slider value={[margem]} onValueChange={(v) => setMargem(v[0])} min={0} max={90} step={1} />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Precificação
                  </Button>
                  <Button variant="outline" onClick={handleAddRevenue}>
                    <PlusCircle className="h-4 w-4" />
                    Lançar como Receita
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultado */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Resultado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResultRow label="Custo total unitário" value={formatCurrency(calc.custoTotalUnitario)} />
                <ResultRow label="Rateio de fixos / un." value={formatCurrency(calc.rateioFixo)} />
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Preço de venda ideal</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(calc.precoVenda)}</p>
                </div>
                <ResultRow label="Lucro por unidade" value={formatCurrency(calc.lucroUnitario)} highlight />
                <ResultRow label="Margem real" value={`${calc.margemReal.toFixed(2)}%`} />
                <div className="border-t border-border pt-4 space-y-1">
                  <ResultRow label="Receita total no mês" value={formatCurrency(calc.receitaTotal)} />
                  <ResultRow label="Lucro total no mês" value={formatCurrency(calc.lucroTotal)} highlight />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Análise Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights.map((i, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    i.type === "warn"
                      ? "bg-destructive/10 border-destructive/30"
                      : i.type === "ok"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-muted border-border"
                  }`}
                >
                  {i.type === "warn" ? (
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  ) : i.type === "ok" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                  <p className="text-sm">{i.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Custo x Preço x Lucro</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RTooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Distribuição de Custos</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }}>
                {pieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Informe seus custos para ver o gráfico
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label={(e: any) => `${e.name}`}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista salva */}
          <Card>
            <CardHeader>
              <CardTitle>Precificações Salvas</CardTitle>
              <CardDescription>Histórico das precificações deste cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {savedList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma precificação salva ainda.</p>
              ) : (
                <div className="space-y-2">
                  {savedList.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(Number(p.preco_venda))} • Lucro {formatCurrency(Number(p.lucro_unitario))} • Margem {Number(p.margem_real).toFixed(1)}%
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function NumberField({
  label, value, onChange, hint, integer,
}: { label: string; value: number; onChange: (v: number) => void; hint?: string; integer?: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step={integer ? 1 : 0.01}
        value={value === 0 ? "" : value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder="0,00"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-semibold ${highlight ? "text-green-500" : ""}`}>{value}</span>
    </div>
  );
}

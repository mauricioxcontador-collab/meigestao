import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Calculator, TrendingUp, Shield, AlertTriangle, Info, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TaxSimulationProps {
  clientId: string;
  tipoAtividade: string | null;
}

const MEI_LIMIT = 81000;
const SIMPLES_RATES = [
  { max: 180000, rate: 6.0, deduction: 0 },
  { max: 360000, rate: 11.2, deduction: 9360 },
  { max: 720000, rate: 13.5, deduction: 17640 },
  { max: 1800000, rate: 16.0, deduction: 35640 },
  { max: 3600000, rate: 21.0, deduction: 125640 },
  { max: 4800000, rate: 33.0, deduction: 648000 },
];

const IRPF_TABLE = [
  { max: 2259.20, rate: 0, deduction: 0 },
  { max: 2826.65, rate: 7.5, deduction: 169.44 },
  { max: 3751.05, rate: 15, deduction: 381.44 },
  { max: 4664.68, rate: 22.5, deduction: 662.77 },
  { max: Infinity, rate: 27.5, deduction: 896.00 },
];

function getDASMonthly(tipo: string | null): number {
  switch (tipo) {
    case "comercio": return 82.05;
    case "servicos": return 86.05;
    case "comercio_servicos": return 87.05;
    default: return 82.05;
  }
}

function getIsencaoIRPF(tipo: string | null): number {
  // Percentual de receita isenta para cálculo IRPF do titular
  switch (tipo) {
    case "comercio": return 0.08;
    case "servicos": return 0.32;
    case "comercio_servicos": return 0.16;
    default: return 0.08;
  }
}

function calcSimplesNacional(faturamento: number): number {
  for (const faixa of SIMPLES_RATES) {
    if (faturamento <= faixa.max) {
      return (faturamento * faixa.rate / 100) - faixa.deduction;
    }
  }
  return 0;
}

function calcIRPF(baseAnual: number): { imposto: number; aliquota: number } {
  const baseMensal = baseAnual / 12;
  for (const faixa of IRPF_TABLE) {
    if (baseMensal <= faixa.max) {
      const impostoMensal = (baseMensal * faixa.rate / 100) - faixa.deduction;
      return {
        imposto: Math.max(0, impostoMensal * 12),
        aliquota: faixa.rate,
      };
    }
  }
  return { imposto: 0, aliquota: 0 };
}

export function TaxSimulation({ clientId, tipoAtividade }: TaxSimulationProps) {
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [proLabore, setProLabore] = useState("");
  const [dependentes, setDependentes] = useState("0");

  useEffect(() => {
    const loadRevenue = async () => {
      const year = new Date().getFullYear();
      const { data } = await supabase
        .from("revenues")
        .select("valor")
        .eq("client_id", clientId)
        .gte("data", `${year}-01-01`)
        .lte("data", `${year}-12-31`);
      if (data) {
        setAnnualRevenue(data.reduce((s, r) => s + Number(r.valor), 0));
      }
    };
    loadRevenue();
  }, [clientId]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // IRPJ / MEI Calculations
  const pctUsed = (annualRevenue / MEI_LIMIT) * 100;
  const dasMonthly = getDASMonthly(tipoAtividade);
  const currentMonth = new Date().getMonth() + 1;
  const totalDAS = dasMonthly * currentMonth;
  const exceeded = annualRevenue > MEI_LIMIT;
  const simplesEstimate = exceeded ? calcSimplesNacional(annualRevenue) : 0;

  // IRPF Calculations
  const isencaoPct = getIsencaoIRPF(tipoAtividade);
  const parcelaIsenta = annualRevenue * isencaoPct;
  const proLaboreVal = parseFloat(proLabore.replace(",", ".")) || 0;
  const proLaboreAnual = proLaboreVal * 12;
  const deducaoDependentes = (parseInt(dependentes) || 0) * 189.59 * 12;
  const baseIRPF = Math.max(0, proLaboreAnual - deducaoDependentes);
  const irpfResult = calcIRPF(baseIRPF);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          Simulação de Impostos
        </h1>
        <p className="text-muted-foreground">
          Entenda sua situação tributária como MEI e pessoa física
        </p>
      </div>

      {/* ===== SEÇÃO IRPJ MEI ===== */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Simulação IRPJ – MEI</h2>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <CardDescription>
                O MEI não paga IRPJ separado — o imposto já está incluso no DAS. Esta simulação mostra seu risco tributário.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Faturamento Bruto Anual</p>
              <p className="text-2xl font-bold text-foreground">{fmt(annualRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Limite Anual do MEI</p>
              <p className="text-2xl font-bold text-foreground">{fmt(MEI_LIMIT)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Limite Utilizado</p>
              <p className={`text-2xl font-bold ${pctUsed > 90 ? "text-destructive" : pctUsed > 70 ? "text-warning" : "text-primary"}`}>
                {pctUsed.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total DAS pago ({currentMonth} meses)</p>
              <p className="text-2xl font-bold text-foreground">{fmt(totalDAS)}</p>
              <p className="text-xs text-muted-foreground mt-1">{fmt(dasMonthly)}/mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress bar do limite */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progresso do Limite</span>
              <span className="text-sm text-muted-foreground">{fmt(annualRevenue)} / {fmt(MEI_LIMIT)}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctUsed > 90 ? "bg-destructive" : pctUsed > 70 ? "bg-warning" : "bg-gradient-to-r from-primary to-secondary"
                }`}
                style={{ width: `${Math.min(pctUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>R$ 0</span>
              <span>{fmt(MEI_LIMIT)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {pctUsed > 80 && !exceeded && (
          <Card className="border border-warning/30 bg-warning/5">
            <CardContent className="p-5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning">Atenção: Próximo do limite!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você já utilizou {pctUsed.toFixed(1)}% do limite anual. Faltam {fmt(MEI_LIMIT - annualRevenue)} para atingir o teto.
                  Planeje-se para evitar o desenquadramento.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {exceeded && (
          <div className="space-y-4">
            <Card className="border border-destructive/30 bg-destructive/5">
              <CardContent className="p-5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Limite ultrapassado!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seu faturamento excedeu o limite do MEI em {fmt(annualRevenue - MEI_LIMIT)}.
                    É necessário solicitar o desenquadramento do MEI.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Simulação desenquadramento */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Simulação de Desenquadramento
                </CardTitle>
                <CardDescription>
                  Comparativo entre o que você paga como MEI e o que pagaria no Simples Nacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-5 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Custo atual (MEI/DAS)</p>
                      <p className="text-3xl font-bold text-primary">{fmt(dasMonthly * 12)}</p>
                      <p className="text-xs text-muted-foreground mt-1">12 meses × {fmt(dasMonthly)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="p-5 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Estimativa Simples Nacional</p>
                      <p className="text-3xl font-bold text-destructive">{fmt(simplesEstimate)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Alíquota efetiva: {((simplesEstimate / annualRevenue) * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    <strong>Diferença anual estimada:</strong> {fmt(simplesEstimate - dasMonthly * 12)} a mais no Simples Nacional.
                    Consulte seu contador para uma análise detalhada.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ===== SEÇÃO IRPF ===== */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Simulação IRPF – Pessoa Física do Titular</h2>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-secondary/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-secondary" />
              <CardDescription>
                O titular do MEI declara IRPF como pessoa física. Parte do faturamento é isenta e o pró-labore é tributável.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Parcela isenta */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Faturamento Anual</p>
                <p className="text-xl font-bold">{fmt(annualRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Parcela Isenta ({(isencaoPct * 100).toFixed(0)}%)</p>
                <p className="text-xl font-bold text-primary">{fmt(parcelaIsenta)}</p>
                <p className="text-xs text-muted-foreground">Não entra na base de cálculo do IRPF</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Parcela Tributável (Lucro)</p>
                <p className="text-xl font-bold text-warning">{fmt(annualRevenue - parcelaIsenta)}</p>
                <p className="text-xs text-muted-foreground">Somada aos demais rendimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs do IRPF */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Dados para Simulação</CardTitle>
            <CardDescription>Informe seu pró-labore mensal e dependentes para estimar o IRPF</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="prolabore">Pró-labore Mensal (R$)</Label>
                <Input
                  id="prolabore"
                  value={proLabore}
                  onChange={(e) => setProLabore(e.target.value)}
                  placeholder="Ex: 1412,00"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Geralmente igual ao salário mínimo (R$ 1.412,00 em 2024)
                </p>
              </div>
              <div>
                <Label htmlFor="dependentes">Número de Dependentes</Label>
                <Input
                  id="dependentes"
                  type="number"
                  min="0"
                  value={dependentes}
                  onChange={(e) => setDependentes(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cada dependente deduz R$ 189,59/mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado IRPF */}
        {proLaboreVal > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Resultado da Simulação IRPF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-muted/30 border-0">
                  <CardContent className="p-5 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Base de Cálculo Anual</p>
                    <p className="text-2xl font-bold">{fmt(baseIRPF)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pró-labore − deduções</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-5 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Alíquota Efetiva</p>
                    <p className="text-2xl font-bold text-primary">{irpfResult.aliquota}%</p>
                  </CardContent>
                </Card>
                <Card className={`border-0 ${irpfResult.imposto === 0 ? "bg-primary/5" : "bg-warning/5"}`}>
                  <CardContent className="p-5 text-center">
                    <p className="text-sm text-muted-foreground mb-2">IRPF Estimado Anual</p>
                    <p className={`text-2xl font-bold ${irpfResult.imposto === 0 ? "text-primary" : "text-warning"}`}>
                      {irpfResult.imposto === 0 ? "Isento" : fmt(irpfResult.imposto)}
                    </p>
                    {irpfResult.imposto > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{fmt(irpfResult.imposto / 12)}/mês</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Importante:</strong> Esta é uma simulação simplificada. O cálculo real do IRPF
                  considera todos os rendimentos do titular (aluguéis, investimentos, etc.), além de outras
                  deduções como saúde e educação. Consulte um contador para a declaração oficial.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

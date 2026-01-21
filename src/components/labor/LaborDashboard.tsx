import { Employee, PayrollRecord } from "@/hooks/useLaborData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, AlertCircle, Percent } from "lucide-react";
import { calculatePayroll, calculateProvisions, calculateAnnualCost, formatCurrency } from "@/lib/laborCalculations";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface LaborDashboardProps {
  employees: Employee[];
  payrolls: PayrollRecord[];
  totalRevenue?: number;
}

export function LaborDashboard({ employees, payrolls, totalRevenue = 0 }: LaborDashboardProps) {
  const activeEmployees = employees.filter((e) => e.ativo);

  // Calculate totals
  const totalMonthlyCost = activeEmployees.reduce((acc, emp) => {
    const payroll = calculatePayroll(emp.salario_bruto);
    const provisions = calculateProvisions(emp.salario_bruto);
    return acc + payroll.custoTotal + provisions.totalProvisao;
  }, 0);

  const totalAnnualCost = activeEmployees.reduce((acc, emp) => {
    return acc + calculateAnnualCost(emp.salario_bruto);
  }, 0);

  const revenuePercentage = totalRevenue > 0 ? (totalMonthlyCost / totalRevenue) * 100 : 0;

  // Chart data - Monthly cost evolution
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const chartData = months.map((month, idx) => ({
    name: month,
    custo: totalMonthlyCost * (0.95 + Math.random() * 0.1), // Simulated variation
  }));

  // Cost breakdown for pie chart
  const costBreakdown = activeEmployees.length > 0 ? [
    { name: "Salários", value: activeEmployees.reduce((acc, e) => acc + e.salario_bruto, 0), color: "#3b82f6" },
    { name: "INSS", value: activeEmployees.reduce((acc, e) => acc + e.salario_bruto * 0.03, 0), color: "#8b5cf6" },
    { name: "FGTS", value: activeEmployees.reduce((acc, e) => acc + e.salario_bruto * 0.112, 0), color: "#f59e0b" },
    { name: "Provisões", value: activeEmployees.reduce((acc, e) => acc + calculateProvisions(e.salario_bruto).totalProvisao, 0), color: "#10b981" },
  ] : [];

  // Alerts
  const alerts = [];
  if (revenuePercentage > 30) {
    alerts.push({
      type: "warning",
      message: `Custo trabalhista representa ${revenuePercentage.toFixed(1)}% do faturamento`,
    });
  }
  // Add FGTS/INSS due date alerts (5th of each month)
  const today = new Date();
  if (today.getDate() <= 7) {
    alerts.push({
      type: "info",
      message: "Lembre-se: FGTS e INSS vencem até o dia 7",
    });
  }
  if (today.getDate() >= 25) {
    alerts.push({
      type: "info",
      message: "Próximo vencimento de salário se aproxima",
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground">
              {employees.filter((e) => !e.ativo).length} desligados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Mensal Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Salários + encargos + provisões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Anual Estimado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totalAnnualCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projeção anual completa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% do Faturamento</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${revenuePercentage > 30 ? 'text-destructive' : 'text-success'}`}>
              {revenuePercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Comprometido com funcionários
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                alert.type === "warning"
                  ? "bg-warning/10 border border-warning/20 text-warning"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-500"
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {activeEmployees.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Annual Cost Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Custo Anual</CardTitle>
              <CardDescription>Custo mensal ao longo do ano</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="custo"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      name="Custo Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Composição dos Custos</CardTitle>
              <CardDescription>Distribuição dos custos trabalhistas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {costBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeEmployees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Cadastre funcionários para visualizar o dashboard trabalhista
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

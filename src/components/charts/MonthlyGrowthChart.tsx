import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, CalendarIcon } from "lucide-react";

interface MonthlyData {
  month: string;
  monthLabel: string;
  receita: number;
  despesa: number;
}

interface MonthlyGrowthChartProps {
  clientId: string;
}

type FilterPeriod = "12months" | "year" | "q1" | "q2" | "q3" | "q4" | "custom";

const MONTH_LABELS = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
];

const FILTER_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: "12months", label: "Últimos 12 meses" },
  { value: "year", label: "Ano atual" },
  { value: "q1", label: "1º Trimestre" },
  { value: "q2", label: "2º Trimestre" },
  { value: "q3", label: "3º Trimestre" },
  { value: "q4", label: "4º Trimestre" },
  { value: "custom", label: "Personalizado" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const getDateRange = (
  filter: FilterPeriod,
  selectedYear: number,
  customStart?: Date,
  customEnd?: Date
): { startDate: Date; endDate: Date; monthsToShow: number[] } => {
  const now = new Date();

  switch (filter) {
    case "12months": {
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return { startDate, endDate, monthsToShow: [] };
    }
    case "year": {
      return {
        startDate: new Date(selectedYear, 0, 1),
        endDate: new Date(selectedYear, 11, 31),
        monthsToShow: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };
    }
    case "q1": {
      return {
        startDate: new Date(selectedYear, 0, 1),
        endDate: new Date(selectedYear, 2, 31),
        monthsToShow: [0, 1, 2],
      };
    }
    case "q2": {
      return {
        startDate: new Date(selectedYear, 3, 1),
        endDate: new Date(selectedYear, 5, 30),
        monthsToShow: [3, 4, 5],
      };
    }
    case "q3": {
      return {
        startDate: new Date(selectedYear, 6, 1),
        endDate: new Date(selectedYear, 8, 30),
        monthsToShow: [6, 7, 8],
      };
    }
    case "q4": {
      return {
        startDate: new Date(selectedYear, 9, 1),
        endDate: new Date(selectedYear, 11, 31),
        monthsToShow: [9, 10, 11],
      };
    }
    case "custom": {
      if (customStart && customEnd) {
        return {
          startDate: customStart,
          endDate: customEnd,
          monthsToShow: [],
        };
      }
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        monthsToShow: [],
      };
    }
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        monthsToShow: [],
      };
  }
};

export function MonthlyGrowthChart({ clientId }: MonthlyGrowthChartProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("12months");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchData = useCallback(async () => {
    if (!clientId) return;

    setIsLoading(true);

    const { startDate, endDate, monthsToShow } = getDateRange(
      filterPeriod,
      selectedYear,
      customStartDate,
      customEndDate
    );

    const [revenuesResult, expensesResult] = await Promise.all([
      supabase
        .from("revenues")
        .select("valor, data")
        .eq("client_id", clientId)
        .gte("data", startDate.toISOString().split("T")[0])
        .lte("data", endDate.toISOString().split("T")[0]),
      supabase
        .from("expenses")
        .select("valor, data")
        .eq("client_id", clientId)
        .gte("data", startDate.toISOString().split("T")[0])
        .lte("data", endDate.toISOString().split("T")[0]),
    ]);

    const revenues = revenuesResult.data || [];
    const expenses = expensesResult.data || [];

    const monthlyData: MonthlyData[] = [];

    if (filterPeriod === "12months" || filterPeriod === "custom") {
      // Generate months dynamically based on date range
      const monthsDiff =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        endDate.getMonth() -
        startDate.getMonth() +
        1;

      for (let i = 0; i < monthsDiff; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        const monthRevenue = revenues
          .filter((r) => {
            const rDate = new Date(r.data);
            return rDate.getFullYear() === year && rDate.getMonth() === month;
          })
          .reduce((sum, r) => sum + Number(r.valor), 0);

        const monthExpense = expenses
          .filter((e) => {
            const eDate = new Date(e.data);
            return eDate.getFullYear() === year && eDate.getMonth() === month;
          })
          .reduce((sum, e) => sum + Number(e.valor), 0);

        monthlyData.push({
          month: `${year}-${String(month + 1).padStart(2, "0")}`,
          monthLabel: `${MONTH_LABELS[month]}/${String(year).slice(-2)}`,
          receita: monthRevenue,
          despesa: monthExpense,
        });
      }
    } else {
      // Generate months for year/quarter
      for (const month of monthsToShow) {
        const monthRevenue = revenues
          .filter((r) => {
            const rDate = new Date(r.data);
            return rDate.getFullYear() === selectedYear && rDate.getMonth() === month;
          })
          .reduce((sum, r) => sum + Number(r.valor), 0);

        const monthExpense = expenses
          .filter((e) => {
            const eDate = new Date(e.data);
            return eDate.getFullYear() === selectedYear && eDate.getMonth() === month;
          })
          .reduce((sum, e) => sum + Number(e.valor), 0);

        monthlyData.push({
          month: `${selectedYear}-${String(month + 1).padStart(2, "0")}`,
          monthLabel: MONTH_LABELS[month],
          receita: monthRevenue,
          despesa: monthExpense,
        });
      }
    }

    setData(monthlyData);
    setIsLoading(false);
  }, [clientId, filterPeriod, selectedYear, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel("monthly-growth-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "revenues",
        },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchData]);

  const handleFilterChange = (filter: FilterPeriod) => {
    setFilterPeriod(filter);
    if (filter !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const getFilterTitle = () => {
    switch (filterPeriod) {
      case "12months":
        return "Últimos 12 Meses";
      case "year":
        return `Ano ${selectedYear}`;
      case "q1":
        return `1º Trimestre ${selectedYear}`;
      case "q2":
        return `2º Trimestre ${selectedYear}`;
      case "q3":
        return `3º Trimestre ${selectedYear}`;
      case "q4":
        return `4º Trimestre ${selectedYear}`;
      case "custom":
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, "dd/MM/yy")} - ${format(customEndDate, "dd/MM/yy")}`;
        }
        return "Período Personalizado";
      default:
        return "Evolução Financeira";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px] rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold">
              Evolução Financeira - {getFilterTitle()}
            </CardTitle>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={filterPeriod === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(option.value)}
                className={cn(
                  "text-xs",
                  filterPeriod === option.value && "gradient-primary"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Year selector for year/quarter filters */}
        {(filterPeriod === "year" || filterPeriod.startsWith("q")) && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Ano:</span>
            <div className="flex gap-1">
              {years.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "text-xs",
                    selectedYear === year && "gradient-primary"
                  )}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom date pickers */}
        {filterPeriod === "custom" && (
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">De:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Até:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  compactDisplay: "short",
                  currency: "BRL",
                }).format(value)
              }
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span className="text-foreground text-sm">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="receita"
              name="Receita"
              stroke="hsl(165 70% 45%)"
              strokeWidth={3}
              dot={{ fill: "hsl(165 70% 45%)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="despesa"
              name="Despesa"
              stroke="hsl(0 84% 60%)"
              strokeWidth={3}
              dot={{ fill: "hsl(0 84% 60%)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

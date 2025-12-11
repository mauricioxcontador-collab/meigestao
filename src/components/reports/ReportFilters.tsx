import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { FilterPeriod } from '@/hooks/useReportData';

interface ReportFiltersProps {
  filterPeriod: FilterPeriod;
  onFilterChange: (period: FilterPeriod) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange: (start: Date | undefined, end: Date | undefined) => void;
}

export function ReportFilters({
  filterPeriod,
  onFilterChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: ReportFiltersProps) {
  const filters: { label: string; value: FilterPeriod }[] = [
    { label: 'Mês Atual', value: 'current_month' },
    { label: 'Últimos 3 Meses', value: 'last_3_months' },
    { label: 'Ano Atual', value: 'current_year' },
    { label: 'Personalizado', value: 'custom' },
  ];

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Período do Relatório</h3>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={filterPeriod === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className="transition-all"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {filterPeriod === 'custom' && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !customStartDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(date) => onCustomDateChange(date, customEndDate)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !customEndDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={(date) => onCustomDateChange(customStartDate, date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}

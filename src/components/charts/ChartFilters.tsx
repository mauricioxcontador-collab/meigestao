import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type FilterPeriod = 'current' | 'last' | 'custom';

interface ChartFiltersProps {
  filterPeriod: FilterPeriod;
  onFilterChange: (period: FilterPeriod) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange: (start: Date | undefined, end: Date | undefined) => void;
}

export const ChartFilters = ({
  filterPeriod,
  onFilterChange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}: ChartFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Período:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterPeriod === 'current' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('current')}
          className={cn(
            filterPeriod === 'current' && 'bg-primary text-primary-foreground'
          )}
        >
          Mês Atual
        </Button>
        
        <Button
          variant={filterPeriod === 'last' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('last')}
          className={cn(
            filterPeriod === 'last' && 'bg-primary text-primary-foreground'
          )}
        >
          Mês Anterior
        </Button>
        
        <Button
          variant={filterPeriod === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('custom')}
          className={cn(
            filterPeriod === 'custom' && 'bg-primary text-primary-foreground'
          )}
        >
          Personalizado
        </Button>
      </div>

      {filterPeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={(date) => onCustomDateChange(date, customEndDate)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={(date) => onCustomDateChange(customStartDate, date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { ReportCharts } from '@/components/reports/ReportCharts';
import { ReportTables } from '@/components/reports/ReportTables';
import { ReportActions } from '@/components/reports/ReportActions';
import { ReportHistory } from '@/components/reports/ReportHistory';
import { useReportData, type FilterPeriod } from '@/hooks/useReportData';
import { FileText } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('current_month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const { reportData, isLoading, companyName } = useReportData(
    clientId,
    filterPeriod,
    customStartDate,
    customEndDate
  );

  const { isContador, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && isContador) {
      navigate('/contador');
      return;
    }
  }, [roleLoading, isContador, navigate]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .or(`mei_user_id.eq.${user.id},contador_user_id.eq.${user.id}`)
        .maybeSingle();

      if (client) {
        setClientId(client.id);
      } else {
        toast.error('Nenhum cliente encontrado');
      }
    };

    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleFilterChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    if (period !== 'custom') {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const handleCustomDateChange = (start: Date | undefined, end: Date | undefined) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AppSidebar userEmail={user.email || ''} onLogout={handleLogout} />

      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pt-12 lg:pt-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Relatórios Avançados
                </h1>
                <p className="text-muted-foreground">
                  Gere relatórios completos com análises financeiras detalhadas
                </p>
              </div>
            </div>

            <ReportActions 
              data={reportData} 
              companyName={companyName} 
              clientId={clientId}
            />
          </div>

          {/* Filters */}
          <ReportFilters
            filterPeriod={filterPeriod}
            onFilterChange={handleFilterChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
          />

          {/* Summary Cards */}
          <ReportSummaryCards data={reportData} isLoading={isLoading} />

          {/* Charts */}
          <ReportCharts data={reportData} isLoading={isLoading} />

          {/* Tables */}
          <ReportTables data={reportData} isLoading={isLoading} />

          {/* History */}
          <ReportHistory clientId={clientId} />
        </div>
      </main>
    </div>
  );
};

export default Reports;

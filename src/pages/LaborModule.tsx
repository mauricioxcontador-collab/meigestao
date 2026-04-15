import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Calculator, FileText, PiggyBank, LayoutDashboard, UserMinus } from "lucide-react";
import { useLaborData, Employee } from "@/hooks/useLaborData";
import { EmployeeForm } from "@/components/labor/EmployeeForm";
import { EmployeeList } from "@/components/labor/EmployeeList";
import { PayrollCalculator } from "@/components/labor/PayrollCalculator";
import { TerminationCalculator } from "@/components/labor/TerminationCalculator";
import { ProvisionsPanel } from "@/components/labor/ProvisionsPanel";
import { LaborDashboard } from "@/components/labor/LaborDashboard";
import { LaborReports } from "@/components/labor/LaborReports";

export default function LaborModule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPayrollCalc, setShowPayrollCalc] = useState(false);
  const [showTerminationCalc, setShowTerminationCalc] = useState(false);

  const {
    employees,
    payrolls,
    provisions,
    loading: laborLoading,
    addEmployee,
    deleteEmployee,
    savePayroll,
    saveTermination,
    saveProvision,
  } = useLaborData(clientId);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
      setClientId(clients[0].id);

      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: revenues } = await supabase
        .from("revenues")
        .select("valor")
        .eq("client_id", clients[0].id)
        .gte("data", startOfMonth.toISOString().split("T")[0])
        .lte("data", endOfMonth.toISOString().split("T")[0]);

      if (revenues) {
        setTotalRevenue(revenues.reduce((acc, r) => acc + Number(r.valor), 0));
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleCalculatePayroll = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowPayrollCalc(true);
    setShowTerminationCalc(false);
  };

  const handleTerminate = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowTerminationCalc(true);
    setShowPayrollCalc(false);
  };

  const closeCalculators = () => {
    setSelectedEmployee(null);
    setShowPayrollCalc(false);
    setShowTerminationCalc(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar userEmail={userEmail} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Módulo Trabalhista</h1>
            <p className="text-muted-foreground">
              Gerencie funcionários, folha de pagamento e encargos trabalhistas
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="funcionarios" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Funcionários</span>
              </TabsTrigger>
              <TabsTrigger value="folha" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Folha</span>
              </TabsTrigger>
              <TabsTrigger value="provisoes" className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4" />
                <span className="hidden sm:inline">Provisões</span>
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <LaborDashboard employees={employees} payrolls={payrolls} totalRevenue={totalRevenue} />
            </TabsContent>

            <TabsContent value="funcionarios" className="space-y-6">
              {clientId && <EmployeeForm clientId={clientId} onSubmit={addEmployee} />}
              <EmployeeList
                employees={employees}
                onDelete={deleteEmployee}
                onCalculatePayroll={handleCalculatePayroll}
                onTerminate={handleTerminate}
              />
            </TabsContent>

            <TabsContent value="folha" className="space-y-6">
              {showPayrollCalc && selectedEmployee ? (
                <PayrollCalculator employee={selectedEmployee} onSave={savePayroll} onClose={closeCalculators} />
              ) : showTerminationCalc && selectedEmployee ? (
                <TerminationCalculator employee={selectedEmployee} onSave={saveTermination} onClose={closeCalculators} />
              ) : (
                <EmployeeList
                  employees={employees}
                  onDelete={deleteEmployee}
                  onCalculatePayroll={handleCalculatePayroll}
                  onTerminate={handleTerminate}
                />
              )}
            </TabsContent>

            <TabsContent value="provisoes">
              <ProvisionsPanel employees={employees} provisions={provisions} onSaveProvision={saveProvision} />
            </TabsContent>

            <TabsContent value="relatorios">
              <LaborReports employees={employees} payrolls={payrolls} provisions={provisions} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

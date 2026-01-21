import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Employee {
  id: string;
  client_id: string;
  nome_completo: string;
  cpf: string;
  cargo: string;
  salario_bruto: number;
  data_admissao: string;
  data_demissao: string | null;
  tipo_contrato: string;
  jornada: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  mes: number;
  ano: number;
  salario_bruto: number;
  inss_empregador: number;
  fgts: number;
  fgts_adicional: number;
  inss_empregado: number;
  salario_liquido: number;
  custo_total: number;
  created_at: string;
}

export interface TerminationRecord {
  id: string;
  employee_id: string;
  tipo_rescisao: string;
  data_desligamento: string;
  saldo_salario: number;
  aviso_previo: number;
  ferias_vencidas: number;
  ferias_proporcionais: number;
  terco_ferias: number;
  decimo_terceiro: number;
  multa_fgts: number;
  total_rescisao: number;
  created_at: string;
}

export interface ProvisionRecord {
  id: string;
  employee_id: string;
  mes: number;
  ano: number;
  provisao_ferias: number;
  provisao_decimo_terceiro: number;
  provisao_fgts: number;
  total_provisao: number;
  created_at: string;
}

export function useLaborData(clientId: string | null) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [terminations, setTerminations] = useState<TerminationRecord[]>([]);
  const [provisions, setProvisions] = useState<ProvisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      return;
    }
    setEmployees(data || []);
  };

  const fetchPayrolls = async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from("payroll_calculations")
      .select("*, employees!inner(client_id)")
      .eq("employees.client_id", clientId)
      .order("ano", { ascending: false })
      .order("mes", { ascending: false });

    if (error) {
      console.error("Error fetching payrolls:", error);
      return;
    }
    setPayrolls(data || []);
  };

  const fetchTerminations = async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from("terminations")
      .select("*, employees!inner(client_id)")
      .eq("employees.client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching terminations:", error);
      return;
    }
    setTerminations(data || []);
  };

  const fetchProvisions = async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from("labor_provisions")
      .select("*, employees!inner(client_id)")
      .eq("employees.client_id", clientId)
      .order("ano", { ascending: false })
      .order("mes", { ascending: false });

    if (error) {
      console.error("Error fetching provisions:", error);
      return;
    }
    setProvisions(data || []);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchEmployees(),
      fetchPayrolls(),
      fetchTerminations(),
      fetchProvisions(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (clientId) {
      fetchAll();
    }
  }, [clientId]);

  const addEmployee = async (employee: Omit<Employee, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("employees")
      .insert(employee)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao cadastrar funcionário",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Funcionário cadastrado",
      description: "O funcionário foi cadastrado com sucesso.",
    });
    
    await fetchEmployees();
    return data;
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const { error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar funcionário",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Funcionário atualizado",
      description: "Os dados foram atualizados com sucesso.",
    });
    
    await fetchEmployees();
    return true;
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir funcionário",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Funcionário excluído",
      description: "O funcionário foi removido com sucesso.",
    });
    
    await fetchEmployees();
    return true;
  };

  const savePayroll = async (payroll: Omit<PayrollRecord, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("payroll_calculations")
      .upsert(payroll, { onConflict: "employee_id,mes,ano" })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao salvar folha",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    await fetchPayrolls();
    return data;
  };

  const saveTermination = async (termination: Omit<TerminationRecord, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("terminations")
      .insert(termination)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao salvar rescisão",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    // Update employee as inactive
    await supabase
      .from("employees")
      .update({ ativo: false, data_demissao: termination.data_desligamento })
      .eq("id", termination.employee_id);

    toast({
      title: "Rescisão processada",
      description: "A rescisão foi calculada e salva com sucesso.",
    });

    await Promise.all([fetchEmployees(), fetchTerminations()]);
    return data;
  };

  const saveProvision = async (provision: Omit<ProvisionRecord, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("labor_provisions")
      .upsert(provision, { onConflict: "employee_id,mes,ano" })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao salvar provisão",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    await fetchProvisions();
    return data;
  };

  return {
    employees,
    payrolls,
    terminations,
    provisions,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    savePayroll,
    saveTermination,
    saveProvision,
    refetch: fetchAll,
  };
}

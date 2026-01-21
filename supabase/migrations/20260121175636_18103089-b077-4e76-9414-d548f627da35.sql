-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  cargo TEXT NOT NULL,
  salario_bruto NUMERIC NOT NULL,
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  tipo_contrato TEXT NOT NULL DEFAULT 'CLT',
  jornada TEXT NOT NULL DEFAULT 'mensalista',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll calculations table
CREATE TABLE public.payroll_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  salario_bruto NUMERIC NOT NULL,
  inss_empregador NUMERIC NOT NULL DEFAULT 0,
  fgts NUMERIC NOT NULL DEFAULT 0,
  fgts_adicional NUMERIC NOT NULL DEFAULT 0,
  inss_empregado NUMERIC NOT NULL DEFAULT 0,
  salario_liquido NUMERIC NOT NULL,
  custo_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, mes, ano)
);

-- Create terminations table
CREATE TABLE public.terminations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo_rescisao TEXT NOT NULL,
  data_desligamento DATE NOT NULL,
  saldo_salario NUMERIC NOT NULL DEFAULT 0,
  aviso_previo NUMERIC NOT NULL DEFAULT 0,
  ferias_vencidas NUMERIC NOT NULL DEFAULT 0,
  ferias_proporcionais NUMERIC NOT NULL DEFAULT 0,
  terco_ferias NUMERIC NOT NULL DEFAULT 0,
  decimo_terceiro NUMERIC NOT NULL DEFAULT 0,
  multa_fgts NUMERIC NOT NULL DEFAULT 0,
  total_rescisao NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create labor provisions table
CREATE TABLE public.labor_provisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  provisao_ferias NUMERIC NOT NULL DEFAULT 0,
  provisao_decimo_terceiro NUMERIC NOT NULL DEFAULT 0,
  provisao_fgts NUMERIC NOT NULL DEFAULT 0,
  total_provisao NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, mes, ano)
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_provisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Users can view employees of their clients"
ON public.employees FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = employees.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can insert employees for their clients"
ON public.employees FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = employees.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can update employees of their clients"
ON public.employees FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = employees.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can delete employees of their clients"
ON public.employees FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = employees.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- RLS Policies for payroll_calculations
CREATE POLICY "Users can view payroll of their employees"
ON public.payroll_calculations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = payroll_calculations.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can insert payroll for their employees"
ON public.payroll_calculations FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = payroll_calculations.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can update payroll of their employees"
ON public.payroll_calculations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = payroll_calculations.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can delete payroll of their employees"
ON public.payroll_calculations FOR DELETE
USING (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = payroll_calculations.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- RLS Policies for terminations
CREATE POLICY "Users can view terminations of their employees"
ON public.terminations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = terminations.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can insert terminations for their employees"
ON public.terminations FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = terminations.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can update terminations of their employees"
ON public.terminations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = terminations.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- RLS Policies for labor_provisions
CREATE POLICY "Users can view provisions of their employees"
ON public.labor_provisions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = labor_provisions.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can insert provisions for their employees"
ON public.labor_provisions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = labor_provisions.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can update provisions of their employees"
ON public.labor_provisions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM employees
  JOIN clients ON clients.id = employees.client_id
  WHERE employees.id = labor_provisions.employee_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- Create trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
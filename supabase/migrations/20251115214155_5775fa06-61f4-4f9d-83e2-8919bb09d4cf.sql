-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('mei', 'contador', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  cpf_cnpj TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create clients table (MEI clients managed by accountants)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mei_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contador_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  atividade TEXT,
  data_abertura DATE,
  limite_faturamento_anual DECIMAL(10,2) DEFAULT 81000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mei_user_id, contador_user_id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create revenues table
CREATE TABLE public.revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create obligations table (DAS, DASN-SIMEI, etc)
CREATE TABLE public.obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL, -- 'DAS', 'DASN-SIMEI', etc
  valor DECIMAL(10,2),
  mes_referencia INTEGER,
  ano_referencia INTEGER,
  vencimento DATE,
  pago BOOLEAN DEFAULT FALSE,
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'));
  
  -- By default, new users are MEI
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'mei');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers to tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenues_updated_at
  BEFORE UPDATE ON public.revenues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obligations_updated_at
  BEFORE UPDATE ON public.obligations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for clients
CREATE POLICY "MEI can view own client data"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = mei_user_id);

CREATE POLICY "Contador can view managed clients"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = contador_user_id);

CREATE POLICY "Contador can insert clients"
  ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = contador_user_id);

CREATE POLICY "Contador can update managed clients"
  ON public.clients
  FOR UPDATE
  USING (auth.uid() = contador_user_id);

-- RLS Policies for revenues
CREATE POLICY "Users can view revenues of their clients"
  ON public.revenues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = revenues.client_id
        AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert revenues for their clients"
  ON public.revenues
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = revenues.client_id
        AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update revenues for their clients"
  ON public.revenues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = revenues.client_id
        AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses of their clients"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = expenses.client_id
        AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert expenses for their clients"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = expenses.client_id
        AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update expenses for their clients"
  ON public.expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = expenses.client_id
        AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
    )
  );

-- RLS Policies for obligations
CREATE POLICY "Users can view obligations of their clients"
  ON public.obligations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = obligations.client_id
        AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
    )
  );

CREATE POLICY "Contador can insert obligations"
  ON public.obligations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = obligations.client_id
        AND clients.contador_user_id = auth.uid()
    )
  );

CREATE POLICY "Contador can update obligations"
  ON public.obligations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = obligations.client_id
        AND clients.contador_user_id = auth.uid()
    )
  );
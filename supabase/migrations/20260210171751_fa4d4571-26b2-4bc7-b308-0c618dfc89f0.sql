
-- Create contador_expenses table
CREATE TABLE public.contador_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contador_user_id UUID NOT NULL REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.clients(id),
  valor NUMERIC NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'Aluguel',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contador_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contador can view own expenses" ON public.contador_expenses FOR SELECT USING (contador_user_id = auth.uid());
CREATE POLICY "Contador can insert own expenses" ON public.contador_expenses FOR INSERT WITH CHECK (contador_user_id = auth.uid());
CREATE POLICY "Contador can update own expenses" ON public.contador_expenses FOR UPDATE USING (contador_user_id = auth.uid());
CREATE POLICY "Contador can delete own expenses" ON public.contador_expenses FOR DELETE USING (contador_user_id = auth.uid());

CREATE INDEX idx_contador_expenses_user ON public.contador_expenses(contador_user_id);
CREATE INDEX idx_contador_expenses_data ON public.contador_expenses(data);

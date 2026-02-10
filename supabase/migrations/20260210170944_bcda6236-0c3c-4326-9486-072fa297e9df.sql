
-- Create contador_revenues table for accountant's own revenue tracking (honorários, etc.)
CREATE TABLE public.contador_revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contador_user_id UUID NOT NULL REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.clients(id),
  valor NUMERIC NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'Honorários',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contador_revenues ENABLE ROW LEVEL SECURITY;

-- Contador can manage their own revenues
CREATE POLICY "Contador can view own revenues"
ON public.contador_revenues FOR SELECT
USING (contador_user_id = auth.uid());

CREATE POLICY "Contador can insert own revenues"
ON public.contador_revenues FOR INSERT
WITH CHECK (contador_user_id = auth.uid());

CREATE POLICY "Contador can update own revenues"
ON public.contador_revenues FOR UPDATE
USING (contador_user_id = auth.uid());

CREATE POLICY "Contador can delete own revenues"
ON public.contador_revenues FOR DELETE
USING (contador_user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_contador_revenues_updated_at
BEFORE UPDATE ON public.contador_revenues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_contador_revenues_user ON public.contador_revenues(contador_user_id);
CREATE INDEX idx_contador_revenues_data ON public.contador_revenues(data);

CREATE TABLE public.pricing_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'produto',
  custo_produto NUMERIC NOT NULL DEFAULT 0,
  custo_transporte NUMERIC NOT NULL DEFAULT 0,
  custo_gasolina NUMERIC NOT NULL DEFAULT 0,
  custo_embalagem NUMERIC NOT NULL DEFAULT 0,
  custo_taxas NUMERIC NOT NULL DEFAULT 0,
  despesas_fixas_mensais NUMERIC NOT NULL DEFAULT 0,
  quantidade_vendas INTEGER NOT NULL DEFAULT 1,
  margem_desejada NUMERIC NOT NULL DEFAULT 30,
  custo_total_unitario NUMERIC NOT NULL DEFAULT 0,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  lucro_unitario NUMERIC NOT NULL DEFAULT 0,
  margem_real NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pricing of their clients"
ON public.pricing_calculations FOR SELECT
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = pricing_calculations.client_id AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())));

CREATE POLICY "Users can insert pricing for their clients"
ON public.pricing_calculations FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = pricing_calculations.client_id AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())));

CREATE POLICY "Users can update pricing of their clients"
ON public.pricing_calculations FOR UPDATE
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = pricing_calculations.client_id AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())));

CREATE POLICY "Users can delete pricing of their clients"
ON public.pricing_calculations FOR DELETE
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = pricing_calculations.client_id AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())));

CREATE TRIGGER update_pricing_calculations_updated_at
BEFORE UPDATE ON public.pricing_calculations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Add tipo_atividade column to clients table for DAS calculation
ALTER TABLE public.clients 
ADD COLUMN tipo_atividade text DEFAULT 'comercio' 
CHECK (tipo_atividade IN ('comercio', 'servicos', 'comercio_servicos'));
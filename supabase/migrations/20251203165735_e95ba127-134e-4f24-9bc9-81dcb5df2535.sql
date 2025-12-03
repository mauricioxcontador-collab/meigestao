-- Fix 1: Add DELETE policy to revenues table
CREATE POLICY "Users can delete revenues for their clients"
ON public.revenues
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = revenues.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- Fix 2: Update the update_updated_at_column function with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
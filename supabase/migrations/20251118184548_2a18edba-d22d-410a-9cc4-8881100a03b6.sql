-- Add DELETE policy for expenses table to complete RLS protection
CREATE POLICY "Users can delete expenses for their clients"
ON expenses
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = expenses.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));
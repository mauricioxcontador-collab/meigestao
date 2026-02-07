-- Add policy to allow contador to update client when accepting invitation
-- This allows a contador who has an accepted invitation to update the client record
CREATE POLICY "Contador can update client via accepted invitation"
ON public.clients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM contador_invitations ci
    WHERE ci.mei_user_id = clients.mei_user_id
    AND ci.status = 'accepted'
    AND ci.contador_email = get_user_email(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contador_invitations ci
    WHERE ci.mei_user_id = clients.mei_user_id
    AND ci.status = 'accepted'
    AND ci.contador_email = get_user_email(auth.uid())
  )
);
-- Add contador_user_id column to contador_invitations table to track which contador created the invitation
ALTER TABLE public.contador_invitations
ADD COLUMN contador_user_id uuid REFERENCES public.profiles(id);

-- Create index for better query performance
CREATE INDEX idx_contador_invitations_contador_user_id ON public.contador_invitations(contador_user_id);

-- Add policy for contador to view invitations they created
CREATE POLICY "Contador can view invitations they created"
ON public.contador_invitations
FOR SELECT
USING (contador_user_id = auth.uid());
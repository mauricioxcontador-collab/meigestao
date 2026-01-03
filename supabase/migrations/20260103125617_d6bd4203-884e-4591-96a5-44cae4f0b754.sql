-- Create contador invitations table
CREATE TABLE public.contador_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mei_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contador_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
  invite_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  permissions TEXT NOT NULL DEFAULT 'readonly' CHECK (permissions IN ('readonly', 'full')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.contador_invitations ENABLE ROW LEVEL SECURITY;

-- MEI can view, create, and update their own invitations
CREATE POLICY "MEI can view own invitations" 
ON public.contador_invitations 
FOR SELECT 
USING (auth.uid() = mei_user_id);

CREATE POLICY "MEI can create invitations" 
ON public.contador_invitations 
FOR INSERT 
WITH CHECK (auth.uid() = mei_user_id);

CREATE POLICY "MEI can update own invitations" 
ON public.contador_invitations 
FOR UPDATE 
USING (auth.uid() = mei_user_id);

-- Contador can view invitations sent to their email
CREATE POLICY "Contador can view invitations by email"
ON public.contador_invitations
FOR SELECT
USING (
  contador_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Contador can accept/update invitations sent to them
CREATE POLICY "Contador can update invitations by email"
ON public.contador_invitations
FOR UPDATE
USING (
  contador_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Public access for viewing invitation by token (for accept flow)
CREATE POLICY "Anyone can view invitation by token"
ON public.contador_invitations
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_contador_invitations_token ON public.contador_invitations(invite_token);
CREATE INDEX idx_contador_invitations_mei ON public.contador_invitations(mei_user_id);
CREATE INDEX idx_contador_invitations_email ON public.contador_invitations(contador_email);
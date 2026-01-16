-- Allow contadores to search for MEI clients that they might want to invite
-- This allows searching in clients table for MEI users (to find potential clients)
CREATE POLICY "Contador can search all clients for invitation"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'contador'
  )
);

-- Allow contadores to view profiles of MEI users for invitation purposes
CREATE POLICY "Contador can view MEI profiles for invitation"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'contador'
  )
);

-- Allow contadores to view user_roles to identify MEI users
CREATE POLICY "Contador can view user roles for search"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'contador'
  )
);

-- Allow contadores to create invitations (contador-initiated invites)
CREATE POLICY "Contador can create invitations"
ON public.contador_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'contador'
  )
);
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Contador can search all clients for invitation" ON public.clients;
DROP POLICY IF EXISTS "Contador can view MEI profiles for invitation" ON public.profiles;
DROP POLICY IF EXISTS "Contador can view user roles for search" ON public.user_roles;
DROP POLICY IF EXISTS "Contador can create invitations" ON public.contador_invitations;

-- Recreate policies using the has_role function to avoid recursion
CREATE POLICY "Contador can search all clients for invitation"
ON public.clients
FOR SELECT
USING (public.has_role(auth.uid(), 'contador'));

CREATE POLICY "Contador can view MEI profiles for invitation"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'contador'));

CREATE POLICY "Contador can view user roles for search"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'contador'));

CREATE POLICY "Contador can create invitations"
ON public.contador_invitations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'contador'));
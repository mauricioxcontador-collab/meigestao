
-- 1. Fix PRIVILEGE ESCALATION: Remove self-service role INSERT/UPDATE policies
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;

-- 2. Fix EXPOSED_SENSITIVE_DATA on profiles: Replace broad contador access with scoped policy
DROP POLICY IF EXISTS "Contador can view MEI profiles for invitation" ON public.profiles;

CREATE POLICY "Contador can view linked MEI profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.mei_user_id = profiles.id
      AND clients.contador_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.contador_invitations ci
    WHERE ci.mei_user_id = profiles.id
      AND ci.contador_user_id = auth.uid()
  )
);

-- 3. Fix EXPOSED_SENSITIVE_DATA on clients: Replace broad contador access with scoped policy
DROP POLICY IF EXISTS "Contador can search all clients for invitation" ON public.clients;

CREATE POLICY "Contador can view clients via invitation"
ON public.clients
FOR SELECT
TO authenticated
USING (
  auth.uid() = mei_user_id
  OR auth.uid() = contador_user_id
  OR EXISTS (
    SELECT 1 FROM public.contador_invitations ci
    WHERE ci.mei_user_id = clients.mei_user_id
      AND ci.contador_user_id = auth.uid()
  )
);

-- 4. Fix broad user_roles access for contador - scope to linked users only
DROP POLICY IF EXISTS "Contador can view user roles for search" ON public.user_roles;

CREATE POLICY "Contador can view roles of linked users"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.clients
    WHERE (clients.mei_user_id = user_roles.user_id OR clients.contador_user_id = user_roles.user_id)
      AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
  )
);

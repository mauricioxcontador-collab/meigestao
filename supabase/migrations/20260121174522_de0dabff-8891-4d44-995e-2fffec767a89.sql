-- Create a security definer function to get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id
$$;

-- Drop problematic policies that access auth.users directly
DROP POLICY IF EXISTS "Contador can update invitations by email" ON public.contador_invitations;
DROP POLICY IF EXISTS "Contador can view invitations by email" ON public.contador_invitations;

-- Recreate policies using the security definer function
CREATE POLICY "Contador can update invitations by email"
ON public.contador_invitations
FOR UPDATE
USING (contador_email = public.get_user_email(auth.uid()));

CREATE POLICY "Contador can view invitations by email"
ON public.contador_invitations
FOR SELECT
USING (contador_email = public.get_user_email(auth.uid()));
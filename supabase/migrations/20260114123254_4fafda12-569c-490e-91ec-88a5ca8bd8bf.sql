-- Add UPDATE policy to allow upsert functionality
CREATE POLICY "Users can update own role"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
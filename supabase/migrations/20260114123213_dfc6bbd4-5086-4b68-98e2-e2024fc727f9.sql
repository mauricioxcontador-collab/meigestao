-- Add unique constraint to prevent duplicate roles per user
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
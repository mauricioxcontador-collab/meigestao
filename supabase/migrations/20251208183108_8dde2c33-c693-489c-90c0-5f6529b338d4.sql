-- Create monthly_goals table
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  revenue_goal NUMERIC NOT NULL DEFAULT 0,
  profit_goal NUMERIC NOT NULL DEFAULT 0,
  sales_count_goal INTEGER NOT NULL DEFAULT 0,
  expense_reduction_goal NUMERIC NOT NULL DEFAULT 0,
  expense_reduction_type TEXT NOT NULL DEFAULT 'percentage' CHECK (expense_reduction_type IN ('percentage', 'absolute')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view goals for their clients"
ON public.monthly_goals
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = monthly_goals.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can insert goals for their clients"
ON public.monthly_goals
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = monthly_goals.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can update goals for their clients"
ON public.monthly_goals
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = monthly_goals.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can delete goals for their clients"
ON public.monthly_goals
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = monthly_goals.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- Create achievements table for gamification
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bronze', 'silver', 'gold', 'platinum')),
  goal_type TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, goal_type, month, year)
);

-- Enable RLS for achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for achievements
CREATE POLICY "Users can view achievements for their clients"
ON public.achievements
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = achievements.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can insert achievements for their clients"
ON public.achievements
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = achievements.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view notifications for their clients"
ON public.notifications
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = notifications.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can insert notifications for their clients"
ON public.notifications
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = notifications.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

CREATE POLICY "Users can update notifications for their clients"
ON public.notifications
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = notifications.client_id
  AND (clients.mei_user_id = auth.uid() OR clients.contador_user_id = auth.uid())
));

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_goals_updated_at
BEFORE UPDATE ON public.monthly_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
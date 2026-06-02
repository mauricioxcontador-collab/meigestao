import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProRouteProps {
  children: React.ReactNode;
}

const ALLOWED_EMAILS = ["mauricioxcontador@gmail.com"];

const ProRoute = ({ children }: ProRouteProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscribed, planName, isLoading: subLoading } = useSubscription();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setIsAuthenticated(true);
        setUserEmail(session.user.email ?? null);
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  const isWhitelisted = userEmail ? ALLOWED_EMAILS.includes(userEmail) : false;
  const isPro = subscribed && planName === "Pro";
  const hasAccess = isWhitelisted || isPro;

  useEffect(() => {
    if (authChecked && isAuthenticated && !subLoading && !hasAccess) {
      toast({
        title: "Recurso exclusivo do Plano Pro",
        description: "Faça upgrade para acessar esta funcionalidade.",
      });
      navigate("/landing#pricing", { replace: true });
    }
  }, [authChecked, isAuthenticated, subLoading, hasAccess, navigate, toast]);

  if (!authChecked || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default ProRoute;
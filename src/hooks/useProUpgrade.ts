import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ALLOWED_EMAILS = ["mauricioxcontador@gmail.com"];

export function useProUpgrade() {
  const { subscribed, planName, isLoading } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const startProCheckout = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      toast({
        title: "Redirecionando para o checkout...",
        description: "Você será levado à página de pagamento do Plano Pro.",
      });
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PLANS.pro.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Erro ao iniciar checkout",
        description: err.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const isWhitelisted = (email?: string | null) =>
    !!email && ALLOWED_EMAILS.includes(email);

  const isPro = subscribed && planName === "Pro";

  return { isPro, isLoading, isWhitelisted, startProCheckout };
}
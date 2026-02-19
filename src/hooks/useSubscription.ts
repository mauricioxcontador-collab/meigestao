import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Stripe product/price mapping
export const PLANS = {
  basico: {
    product_id: "prod_U0c8N50wa5AkAW",
    price_id: "price_1T2auWD0D6krLdiakS8av0lx",
    name: "Básico",
    price_monthly: 39.90,
  },
  pro: {
    product_id: "prod_U0c9TREXN5qvmZ",
    price_id: "price_1T2av3D0D6krLdiabwa7tH8U",
    name: "Pro",
    price_monthly: 49.90,
  },
} as const;

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  planName: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    planName: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(s => ({ ...s, subscribed: false, isLoading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      let planName: string | null = null;
      if (data?.product_id) {
        if (data.product_id === PLANS.basico.product_id) planName = "Básico";
        else if (data.product_id === PLANS.pro.product_id) planName = "Pro";
      }

      setState({
        subscribed: data?.subscribed || false,
        productId: data?.product_id || null,
        planName,
        subscriptionEnd: data?.subscription_end || null,
        isLoading: false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    const interval = setInterval(checkSubscription, 60000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  const checkout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  const manageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  return {
    ...state,
    checkSubscription,
    checkout,
    manageSubscription,
  };
}

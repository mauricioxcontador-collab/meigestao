import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "mei" | "contador" | "admin";

interface UseUserRoleReturn {
  role: AppRole | null;
  isLoading: boolean;
  isMei: boolean;
  isContador: boolean;
  isAdmin: boolean;
  hasRole: (checkRole: AppRole) => boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching role:", error);
        // Default to MEI if no role found
        setRole("mei");
      } else {
        setRole(data?.role as AppRole || "mei");
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      setRole("mei");
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (checkRole: AppRole): boolean => role === checkRole;

  return {
    role,
    isLoading,
    isMei: role === "mei",
    isContador: role === "contador",
    isAdmin: role === "admin",
    hasRole,
  };
}

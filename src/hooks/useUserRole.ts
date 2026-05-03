import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "admin" | "nutritionist" | "patient" | null;

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        const roles = data.map(({ role }) => role);

        if (roles.includes("admin")) {
          setRole("admin");
        } else if (roles.includes("nutritionist")) {
          setRole("nutritionist");
        } else {
          setRole("patient");
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user, authLoading]);

  return { role, loading: authLoading || loading, user };
}

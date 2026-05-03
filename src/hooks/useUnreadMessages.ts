import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export function useUnreadMessages() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const channelNameRef = useRef(`global-unread-indicator-${Math.random().toString(36).slice(2)}`);

  const { data: count = 0 } = useQuery({
    queryKey: ["global-unread-messages", user?.id, role],
    queryFn: async () => {
      if (!user) return 0;

      if (role === "nutritionist") {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .neq("sender_user_id", user.id)
          .is("read_at", null);
        return count ?? 0;
      }

      if (role === "patient") {
        // Get patient record first
        const { data: patient } = await supabase
          .from("patients")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!patient) return 0;

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_patient_id", patient.id)
          .neq("sender_user_id", user.id)
          .is("read_at", null);
        return count ?? 0;
      }

      return 0;
    },
    enabled: !!user && !!role,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(channelNameRef.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["global-unread-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return count;
}

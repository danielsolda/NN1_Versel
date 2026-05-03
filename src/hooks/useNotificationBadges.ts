import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * For nutritionists: count of appointments with status 'pendente'
 */
export function usePendingAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelNameRef = useRef(`pending-appointments-indicator-${Math.random().toString(36).slice(2)}`);

  const { data: count = 0 } = useQuery({
    queryKey: ["pending-appointments", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("nutritionist_id", user.id)
        .eq("status", "pendente");
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(channelNameRef.current)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pending-appointments"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return count;
}

/**
 * For patients: count of diary entries with nutritionist_feedback that haven't been "seen"
 * We consider feedback "unread" if feedback_at is newer than the entry's updated_at
 * Simple approach: count entries with feedback_at set (patient can dismiss later)
 */
export function useUnreadFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelNameRef = useRef(`unread-feedback-indicator-${Math.random().toString(36).slice(2)}`);

  const { data: count = 0 } = useQuery({
    queryKey: ["unread-feedback", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!patient) return 0;

      const { count } = await supabase
        .from("food_diary_entries")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id)
        .not("nutritionist_feedback", "is", null)
        .not("feedback_at", "is", null)
        .is("feedback_read_at" as any, null);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(channelNameRef.current)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "food_diary_entries" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-feedback"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return count;
}

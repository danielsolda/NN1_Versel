import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CHECK_INTERVAL_MS = 60_000; // check every minute
const REMINDER_WINDOWS = [
  { label: "em 1 hora", minMs: 55 * 60_000, maxMs: 65 * 60_000 },
  { label: "amanhã", minMs: 23.5 * 3600_000, maxMs: 24.5 * 3600_000 },
];

function requestPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: `${title}-${body}`,
    });
  } catch {
    // Silent fail on unsupported environments
  }
}

export function useAppointmentReminders() {
  const { user } = useAuth();
  const notifiedRef = useRef<Set<string>>(new Set());

  const checkReminders = useCallback(async () => {
    if (!user) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();

    // Fetch appointments in the next ~25 hours
    const futureDate = new Date(now.getTime() + 25 * 3600_000);
    const todayStr = now.toISOString().slice(0, 10);
    const futureStr = futureDate.toISOString().slice(0, 10);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, date, time_start, time_end, patients(name)")
      .gte("date", todayStr)
      .lte("date", futureStr)
      .order("time_start");

    if (error || !appointments) return;

    for (const appt of appointments) {
      const apptDateTime = new Date(`${appt.date}T${appt.time_start}`);
      const diffMs = apptDateTime.getTime() - now.getTime();

      for (const window of REMINDER_WINDOWS) {
        const notifKey = `${appt.id}-${window.label}`;
        if (notifiedRef.current.has(notifKey)) continue;

        if (diffMs >= window.minMs && diffMs <= window.maxMs) {
          const patientName = (appt.patients as any)?.name || "Sem paciente";
          const timeStr = appt.time_start.slice(0, 5);

          sendNotification(
            `Consulta ${window.label}`,
            `${patientName} às ${timeStr}`
          );

          notifiedRef.current.add(notifKey);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    requestPermission();
    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkReminders]);
}

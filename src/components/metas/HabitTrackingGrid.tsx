import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Target, TrendingUp, Trophy, BarChart3 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { format, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface DailyCheck {
  id: string;
  goal_id: string;
  check_date: string;
  patient_id: string;
}

interface Props {
  patientId?: string;
  patients?: Patient[];
  canToggle?: boolean;
}

function getWeeksOfMonth(year: number, month: number) {
  const totalDays = getDaysInMonth(new Date(year, month));
  const weeks: { label: string; days: number[] }[] = [];

  for (let d = 1; d <= totalDays; d += 7) {
    const end = Math.min(d + 6, totalDays);
    const days = Array.from({ length: end - d + 1 }, (_, i) => d + i);
    weeks.push({ label: `Semana ${weeks.length + 1}`, days });
  }
  return weeks;
}

export default function HabitTrackingGrid({ patientId, patients, canToggle = false }: Props) {
  const queryClient = useQueryClient();
  const now = new Date();
  const [selectedPatient, setSelectedPatient] = useState(patientId || "");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const effectivePatientId = patientId || selectedPatient;
  const totalDays = getDaysInMonth(new Date(year, month));
  const weeks = useMemo(() => getWeeksOfMonth(year, month), [year, month]);

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["habit-grid-goals", effectivePatientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("patient_goals")
        .select("id, title, category, status")
        .eq("patient_id", effectivePatientId)
        .eq("status", "ativa")
        .order("created_at");
      return (data || []) as Goal[];
    },
    enabled: !!effectivePatientId,
  });

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(totalDays).padStart(2, "0")}`;

  const { data: checks = [] } = useQuery<DailyCheck[]>({
    queryKey: ["habit-grid-checks", effectivePatientId, year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from("goal_daily_checks")
        .select("*")
        .eq("patient_id", effectivePatientId)
        .gte("check_date", monthStart)
        .lte("check_date", monthEnd);
      return (data || []) as DailyCheck[];
    },
    enabled: !!effectivePatientId,
  });

  const checkMap = useMemo(() => {
    const map = new Map<string, Set<number>>();
    checks.forEach((c) => {
      const day = parseInt(c.check_date.split("-")[2], 10);
      if (!map.has(c.goal_id)) map.set(c.goal_id, new Set());
      map.get(c.goal_id)!.add(day);
    });
    return map;
  }, [checks]);

  const toggleMutation = useMutation({
    mutationFn: async ({ goalId, day, checked }: { goalId: string; day: number; checked: boolean }) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (checked) {
        const { error } = await supabase
          .from("goal_daily_checks")
          .delete()
          .eq("goal_id", goalId)
          .eq("patient_id", effectivePatientId)
          .eq("check_date", dateStr);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("goal_daily_checks")
          .insert({ goal_id: goalId, patient_id: effectivePatientId, check_date: dateStr });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-grid-checks", effectivePatientId, year, month] });
    },
  });

  const isChecked = useCallback((goalId: string, day: number) => checkMap.get(goalId)?.has(day) || false, [checkMap]);

  const goalStats = useMemo(() => {
    return goals.map((g) => {
      const completed = checkMap.get(g.id)?.size || 0;
      const pct = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0;
      return { ...g, completed, pct };
    });
  }, [goals, checkMap, totalDays]);

  const dailyStats = useMemo(() => {
    const stats: { completed: number; total: number; pct: number }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      let completed = 0;
      goals.forEach((g) => { if (isChecked(g.id, d)) completed++; });
      const total = goals.length;
      stats.push({ completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 });
    }
    return stats;
  }, [goals, isChecked, totalDays]);

  const weeklyStats = useMemo(() => {
    return weeks.map((w) => {
      let completed = 0;
      const total = w.days.length * goals.length;
      w.days.forEach((d) => {
        goals.forEach((g) => { if (isChecked(g.id, d)) completed++; });
      });
      return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
    });
  }, [weeks, goals, isChecked]);

  const monthlyStats = useMemo(() => {
    let completed = 0;
    const total = totalDays * goals.length;
    for (let d = 1; d <= totalDays; d++) {
      goals.forEach((g) => { if (isChecked(g.id, d)) completed++; });
    }
    return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [goals, isChecked, totalDays]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(2024, i), "MMMM", { locale: ptBR }),
  }));

  const pctColor = (pct: number) =>
    pct >= 80 ? "text-primary" : pct >= 50 ? "text-accent-foreground" : "text-destructive";

  const barColor = (pct: number) =>
    pct >= 80 ? "bg-primary" : pct >= 50 ? "bg-accent-foreground" : "bg-destructive";

  if (!effectivePatientId && !patientId) {
    return (
      <div className="space-y-4">
        {patients && patients.length > 0 && (
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-64 h-8 text-sm">
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
          <Target className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Selecione um paciente para ver o acompanhamento.</p>
        </div>
      </div>
    );
  }

  const patientName = patients?.find((p) => p.id === effectivePatientId)?.name;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {patients && !patientId && (
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="Paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-36 h-8 text-sm capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value} className="capitalize">{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-24 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[year - 1, year, year + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {goalsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Target className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma meta encontrada.</p>
        </div>
      ) : (
        <>
          {/* Week Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weeks.map((week, wi) => {
              const ws = weeklyStats[wi];
              return (
                <div key={wi} className="overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover">
                  {/* Week header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-primary/[0.04]">
                    <span className="text-xs font-semibold text-foreground">{week.label}</span>
                    <span className={cn("text-xs font-bold", ws.pct > 0 ? "text-primary" : "text-muted-foreground")}>
                      {ws.pct}%
                    </span>
                  </div>

                  {/* Day headers */}
                  <div className="grid px-3 pt-2 pb-1" style={{ gridTemplateColumns: `1fr repeat(${week.days.length}, 28px)` }}>
                    <div />
                    {week.days.map((d) => {
                      const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                      return (
                        <div key={d} className="flex justify-center">
                          <span className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
                            isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {d}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Goal rows */}
                  <div className="px-3 pb-3 space-y-0.5">
                    {goalStats.map((goal, gi) => (
                      <div
                        key={goal.id}
                        className={cn(
                          "grid items-center rounded-md py-1.5 transition-colors hover:bg-surface-hover",
                          gi % 2 === 1 && "bg-muted/[0.06]"
                        )}
                        style={{ gridTemplateColumns: `1fr repeat(${week.days.length}, 28px)` }}
                      >
                        <span className="text-[11px] font-medium text-foreground truncate pr-2 pl-1">
                          {goal.title}
                        </span>
                        {week.days.map((d) => {
                          const checked = isChecked(goal.id, d);
                          return (
                            <div key={d} className="flex justify-center">
                              <button
                                disabled={!canToggle || toggleMutation.isPending}
                                onClick={() => canToggle && toggleMutation.mutate({ goalId: goal.id, day: d, checked })}
                                className={cn(
                                  "inline-flex h-5 w-5 items-center justify-center rounded-md transition-all duration-150",
                                  checked
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border bg-background",
                                  canToggle && "cursor-pointer hover:border-surface-hover-border hover:bg-surface-hover",
                                  !canToggle && "cursor-default"
                                )}
                              >
                                {checked && (
                                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Week progress bar */}
                  <div className="px-3 pb-3">
                    <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${ws.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Daily */}
                   <div className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Evolução Diária</h3>
              </div>
              <div className="flex items-end gap-[2px] h-12">
                {dailyStats.map((s, i) => {
                  const isToday = (i + 1) === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end" title={`Dia ${i + 1}: ${s.pct}%`}>
                      <div
                        className={cn(
                          "rounded-t-sm transition-all min-h-[2px]",
                          s.pct > 0 ? "bg-primary" : "bg-border",
                          isToday && "ring-1 ring-primary ring-offset-1 ring-offset-card"
                        )}
                        style={{ height: `${Math.max(s.pct, 4)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>1</span>
                <span>{totalDays}</span>
              </div>
            </div>

            {/* Weekly */}
                   <div className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Evolução Semanal</h3>
              </div>
              <div className="space-y-2">
                {weeklyStats.map((ws, wi) => (
                  <div key={wi} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">S{wi + 1}</span>
                      <span className={cn("font-semibold", ws.pct > 0 ? "text-primary" : "text-muted-foreground")}>{ws.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ws.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly */}
                   <div className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">Evolução Mensal</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-2">
                <span className={cn("text-3xl font-bold tracking-tight", monthlyStats.pct > 0 ? "text-primary" : "text-muted-foreground")}>
                  {monthlyStats.pct}%
                </span>
                <div className="mt-2 w-full h-2 rounded-full bg-border/40 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${monthlyStats.pct}%` }} />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {monthlyStats.completed} de {monthlyStats.total} hábitos
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

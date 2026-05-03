import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  CalendarPlus,
  UtensilsCrossed,
  CalendarDays,
  ChefHat,
  BookOpen,
  Target,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface PatientGoal {
  id: string;
  title: string;
  category: string;
  status: string;
  target_value: string | null;
  current_value: string | null;
  unit: string | null;
  deadline: string | null;
}

interface GoalCheck {
  goal_id: string;
  check_date: string;
}

interface MealPlanPreview {
  id: string;
  title: string;
  created_at: string;
  meals: { name: string; type: string; time: string | null }[];
}

interface MealPlanRow {
  id: string;
  title: string;
  created_at: string;
  meals: { name: string; type: string; time: string | null; sort_order: number }[];
}

interface DashboardStats {
  diaryToday: number;
  diaryWeek: number;
  mealPlansCount: number;
  nextAppointment: { date: string; time_start: string; nutritionist_name?: string } | null;
  recentMealPlans: MealPlanPreview[];
  goals: PatientGoal[];
  weekDiaryDates: string[];
  goalChecks: GoalCheck[];
  patientId: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessages();
  const [patientName, setPatientName] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    diaryToday: 0,
    diaryWeek: 0,
    mealPlansCount: 0,
    nextAppointment: null,
    recentMealPlans: [],
    goals: [],
    weekDiaryDates: [],
    goalChecks: [],
    patientId: "",
  });
  const [loading, setLoading] = useState(true);
  const [togglingGoal, setTogglingGoal] = useState<string | null>(null);
  const fallbackName = user?.user_metadata?.full_name || user?.email || "Paciente";

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const { data: patient } = await supabase
          .from("patients")
          .select("id, name, nutritionist_id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!patient) {
          setPatientName(fallbackName);
          setLoading(false);
          return;
        }

        setPatientName(patient.name || fallbackName);

        const today = new Date();
        const startWeek = startOfWeek(today, { locale: ptBR });
        const endWeek = endOfWeek(today, { locale: ptBR });
        const todayStr = format(today, "yyyy-MM-dd");
        const startWeekStr = format(startWeek, "yyyy-MM-dd");
        const endWeekStr = format(endWeek, "yyyy-MM-dd");

        const [diaryEntriesResult, mealPlansResult, appointmentsResult, profileResult, goalsResult, goalChecksResult] =
          await Promise.all([
            supabase
              .from("food_diary_entries")
              .select("date, meal_type")
              .eq("patient_id", patient.id),
            supabase
              .from("meal_plans")
              .select("id, title, created_at, meals(name, type, time, sort_order)")
              .eq("patient_id", patient.id)
              .order("created_at", { ascending: false })
              .limit(3),
            supabase
              .from("appointments")
              .select("date, time_start")
              .eq("patient_id", patient.id)
              .gte("date", todayStr)
              .order("date", { ascending: true })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("nutritionists")
              .select("full_name")
              .eq("user_id", patient.nutritionist_id)
              .maybeSingle(),
            supabase
              .from("patient_goals")
              .select("id, title, category, status, target_value, current_value, unit, deadline")
              .eq("patient_id", patient.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("goal_daily_checks")
              .select("goal_id, check_date")
              .eq("patient_id", patient.id)
              .gte("check_date", startWeekStr)
              .lte("check_date", endWeekStr),
          ]);

        const diaryEntries = diaryEntriesResult.data || [];
        const diaryToday = diaryEntries.filter((e) => e.date === todayStr).length;
        const diaryWeek = diaryEntries.filter(
          (e) => e.date >= startWeekStr && e.date <= endWeekStr
        ).length;

        const mealPlans: MealPlanPreview[] = (mealPlansResult.data || []).map((p: MealPlanRow) => ({
          id: p.id,
          title: p.title,
          created_at: p.created_at,
          meals: (p.meals || []).sort((a, b) => a.sort_order - b.sort_order),
        }));

        const nextAppointment = appointmentsResult.data
          ? {
              ...appointmentsResult.data,
              nutritionist_name: profileResult.data?.full_name || "Nutricionista",
            }
          : null;

        const weekDiaryDates = [...new Set(
          diaryEntries
            .filter((e) => e.date >= startWeekStr && e.date <= endWeekStr)
            .map((e) => e.date)
        )];

        setStats({
          diaryToday,
          diaryWeek,
          mealPlansCount: mealPlans.length,
          nextAppointment,
          recentMealPlans: mealPlans,
          goals: (goalsResult.data || []) as PatientGoal[],
          weekDiaryDates,
          goalChecks: (goalChecksResult.data || []) as GoalCheck[],
          patientId: patient.id,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, fallbackName]);

  const toggleGoalToday = useCallback(async (goalId: string) => {
    if (!stats.patientId) return;
    setTogglingGoal(goalId);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const existing = stats.goalChecks.find(
      (c) => c.goal_id === goalId && c.check_date === todayStr
    );

    try {
      if (existing) {
        await supabase
          .from("goal_daily_checks")
          .delete()
          .eq("goal_id", goalId)
          .eq("check_date", todayStr);

        setStats((prev) => ({
          ...prev,
          goalChecks: prev.goalChecks.filter(
            (check) => !(check.goal_id === goalId && check.check_date === todayStr)
          ),
        }));
        toast.success("Meta desmarcada com sucesso!");
      } else {
        await supabase.from("goal_daily_checks").insert({
          goal_id: goalId,
          check_date: todayStr,
        });

        setStats((prev) => ({
          ...prev,
          goalChecks: [...prev.goalChecks, { goal_id: goalId, check_date: todayStr }],
        }));
        toast.success("Meta marcada como feita hoje!");
      }
    } catch {
      toast.error("Erro ao atualizar meta");
    } finally {
      setTogglingGoal(null);
    }
  }, [stats.patientId, stats.goalChecks]);

  if (loading) {
    return (
      <div className="page-shell mx-auto max-w-7xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const firstName = (patientName || fallbackName).split(" ")[0] || "Paciente";

  const shortcuts = [
    { label: "Nova Refeição", icon: ChefHat, to: "/p/diario", badge: 0 },
    { label: "Planos", icon: UtensilsCrossed, to: "/p/planos", badge: 0 },
    { label: "Agendar", icon: CalendarPlus, to: "/p/agendamento", badge: 0 },
    { label: "Chat", icon: MessageCircle, to: "/p/chat", badge: unreadCount },
  ];

  const quickAccess = [
    { label: "Diário Alimentar", icon: BookOpen, to: "/p/diario", description: `${stats.diaryToday} refeições hoje · ${stats.diaryWeek} esta semana` },
    { label: "Planos Alimentares", icon: UtensilsCrossed, to: "/p/planos", description: `${stats.mealPlansCount} plano${stats.mealPlansCount !== 1 ? "s" : ""} ativo${stats.mealPlansCount !== 1 ? "s" : ""}` },
    { label: "Mensagens", icon: MessageCircle, to: "/p/chat", description: unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Falar com nutricionista" },
    { label: "Agendamento", icon: CalendarPlus, to: "/p/agendamento", description: "Marcar consulta" },
  ];

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = startOfWeek(today, { locale: ptBR });
  const weekEnd = endOfWeek(today, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const activeGoals = stats.goals.filter((g) => g.status === "ativa");
  const totalActiveGoals = activeGoals.length;

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="page-header">
        <h1 className="page-title">Olá, {firstName}</h1>
        <p className="page-lead">Acompanhe seu progresso nutricional.</p>
      </div>

      {/* Shortcuts */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shortcuts.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.to)}
              className="group relative flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
            >
              <s.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="text-xs font-medium text-foreground transition-colors group-hover:text-primary">{s.label}</span>
            {s.badge > 0 && (
              <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {s.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Metas + Planos side by side */}
      <div className="page-section grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Metas card */}
        {stats.goals.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Metas</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {totalActiveGoals} ativa{totalActiveGoals !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-0.5">
                  {weekDays.map((day, i) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const checksThisDay = totalActiveGoals > 0
                      ? stats.goalChecks.filter((c) => c.check_date === dayStr && activeGoals.some((g) => g.id === c.goal_id)).length
                      : 0;
                    const pct = totalActiveGoals > 0 ? Math.round((checksThisDay / totalActiveGoals) * 100) : 0;
                    const isCurrentDay = isSameDay(day, today);

                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex h-10 w-full items-end justify-center">
                          <div className="relative w-full max-w-[20px] h-full rounded-sm border border-border bg-muted/30 overflow-hidden">
                            <div
                              className={`absolute bottom-0 w-full transition-all duration-300 ${
                                pct === 100 ? "bg-primary" : pct > 0 ? "bg-primary/60" : ""
                              }`}
                              style={{ height: pct > 0 ? `${pct}%` : "0%" }}
                            />
                          </div>
                        </div>
                        <span className={`text-[9px] font-medium ${
                          isCurrentDay ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {dayLabels[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border" />

              <div className="px-3 py-2 flex flex-wrap items-center gap-1.5">
                {stats.goals.map((goal) => {
                  const isCompleted = goal.status === "concluida";
                  const isCancelled = goal.status === "cancelada";
                  const isActive = goal.status === "ativa";
                  const checkedToday = stats.goalChecks.some(
                    (c) => c.goal_id === goal.id && c.check_date === todayStr
                  );

                  return (
                    <button
                      key={goal.id}
                      onClick={() => isActive && toggleGoalToday(goal.id)}
                      disabled={!isActive || togglingGoal === goal.id}
                      title={isActive ? (checkedToday ? "Desmarcar hoje" : "Marcar como feito hoje") : goal.title}
                      className={`group inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all duration-200 disabled:cursor-default ${
                        isCancelled
                          ? "border-border/60 bg-muted/30 text-muted-foreground opacity-60"
                          : checkedToday
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : isCompleted
                              ? "border-primary/20 bg-primary/5 text-primary"
                              : "border-border bg-background text-foreground hover:border-surface-hover-border hover:bg-surface-hover hover:text-primary"
                      }`}
                    >
                      {isActive ? (
                        checkedToday ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5 text-muted-foreground transition-colors group-hover:text-primary" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : (
                        <Target className="h-2.5 w-2.5" />
                      )}
                      <span className={`transition-colors ${isCompleted ? "line-through" : ""}`}>{goal.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="flex items-center justify-between p-3 pb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Metas</span>
              </div>
            </div>

            <div className="px-3 pb-3">
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma meta atribuída.</p>
            </div>
          </div>
        )}

        {/* Meus Planos card */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-3 pb-2">
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Meus Planos</span>
            </div>
            {stats.recentMealPlans.length > 0 && (
              <button
                onClick={() => navigate("/p/planos")}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todos
              </button>
            )}
          </div>

          {stats.recentMealPlans.length > 0 ? (
            <div className="px-3 pb-3 space-y-2">
              {stats.recentMealPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => navigate("/p/planos")}
                  className="group w-full rounded-xl border border-border/60 bg-background p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground truncate transition-colors group-hover:text-primary">{plan.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {format(new Date(plan.created_at), "dd/MM")}
                    </span>
                  </div>
                  {plan.meals.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.meals.map((meal, idx) => {
                        const abbrev = meal.name.length > 12 ? meal.name.slice(0, 11) + "…" : meal.name;
                        const timeFormatted = meal.time
                          ? meal.time.replace(/^0/, "").replace(/:00$/, "h").replace(/:/, "h")
                          : null;
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded border border-border/60 bg-primary/5 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {timeFormatted && <span className="text-primary font-medium">{timeFormatted}</span>}
                            {abbrev}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 pb-3">
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum plano atribuído.</p>
            </div>
          )}
        </div>
      </div>

      {/* Próxima consulta */}
      <section className="page-section">
        <h2 className="page-section-title">Próxima consulta</h2>
        {stats.nextAppointment ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/60 bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(stats.nextAppointment.date + "T00:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.nextAppointment.time_start.slice(0, 5)} · {stats.nextAppointment.nutritionist_name}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 rounded-xl border border-border/60 bg-card p-4 text-center text-sm text-muted-foreground">
            Nenhuma consulta agendada.
          </div>
        )}
      </section>

      {/* Acesso rápido */}
      <section className="page-section">
        <h2 className="page-section-title">Acesso rápido</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickAccess.map((q) => (
            <button
              key={q.label}
              onClick={() => navigate(q.to)}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
            >
              <q.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{q.label}</p>
                <p className="text-xs text-muted-foreground">{q.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

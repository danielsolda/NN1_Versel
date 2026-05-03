import { useEffect, useState, useRef } from "react";
import { Calendar, BarChart3, BookOpen, MessageCircle, Bell, CheckSquare, Clock, LayoutGrid, ChevronLeft, ChevronRight, CalendarDays, Zap, CircleDollarSign, TrendingUp, TrendingDown, Users, FileScan } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NutritionistProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface JournalEntryFeedItem {
  id: string;
  date: string;
  meal_type: string;
  description: string;
  photo_url: string | null;
  nutritionist_feedback: string | null;
  created_at: string;
  patients: {
    id: string;
    name: string;
  };
}

interface OverviewStats {
  totalPatients: number;
  totalPatientsPrev: number;
  faturamento: number;
  faturamentoPrev: number;
  patientPosts: number;
  patientPostsPrev: number;
}

interface RecentConversation {
  patientId: string;
  patientName: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface PendingAppointmentNotification {
  id: string;
  patientName: string;
  date: string;
  timeStart: string;
}

interface DashboardNotification {
  id: string;
  type: "message" | "appointment";
  title: string;
  subtitle: string;
  href: string;
  timestamp: string;
  badge?: number;
}

const quickAccess = [
  { label: "Agenda", icon: Calendar, to: "/agenda", description: "Consultas do dia" },
  { label: "Indicadores", icon: BarChart3, to: "/indicadores", description: "Painel de métricas" },
  { label: "Chat", icon: MessageCircle, to: "/chat", description: "Mensagens" },
  { label: "Jornal Alimentar", icon: BookOpen, to: "/diario", description: "Registros recentes" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getMealGradient(mealType: string) {
  const meal = mealType.toLowerCase();

  if (meal.includes("café") || meal.includes("cafe")) return "from-amber-400 via-orange-400 to-amber-700";
  if (meal.includes("lanche")) return "from-sky-400 via-cyan-400 to-blue-700";
  if (meal.includes("almoço") || meal.includes("almoco")) return "from-emerald-400 via-teal-400 to-emerald-700";
  if (meal.includes("jantar")) return "from-indigo-400 via-violet-400 to-indigo-800";
  if (meal.includes("ceia")) return "from-fuchsia-400 via-pink-400 to-violet-700";

  return "from-slate-400 via-slate-300 to-slate-700";
}

function getJournalTileClass(index: number) {
  const layoutClasses = [
    "col-span-2 row-span-2 rounded-[20px] sm:rounded-[24px]",
    "col-span-1 row-span-1 rounded-[14px] sm:rounded-[18px]",
    "col-span-1 row-span-1 rounded-[14px] sm:rounded-[18px]",
    "col-span-2 row-span-2 rounded-[20px] sm:rounded-[24px]",
    "col-span-1 row-span-1 rounded-[14px] sm:rounded-[18px]",
    "col-span-1 row-span-1 rounded-[14px] sm:rounded-[18px]",
  ];

  return layoutClasses[index % layoutClasses.length];
}

function formatDashboardDate(date: Date) {
  const raw = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const [weekdayPart, rest] = raw.split(", ");
  const capitalizedWeekday = weekdayPart.charAt(0).toUpperCase() + weekdayPart.slice(1);

  const formattedRest = rest.replace(/ de ([^ ]+)/, (_match, month: string) => {
    return ` de ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  });

  return `${capitalizedWeekday}, ${formattedRest}`;
}

function formatPatientName(name: string | undefined | null) {
  if (!name) return "Paciente";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function getUnreadAvatarSize(index: number, total: number) {
  if (total <= 1) return 48;

  const minSize = 44;
  const maxSize = 56;
  const progress = index / (total - 1);

  return Math.round(minSize + (maxSize - minSize) * progress);
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<NutritionistProfile>({
    full_name: null,
    avatar_url: null,
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntryFeedItem[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewStats>({
    totalPatients: 0,
    totalPatientsPrev: 0,
    faturamento: 0,
    faturamentoPrev: 0,
    patientPosts: 0,
    patientPostsPrev: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [pendingAppointmentNotifications, setPendingAppointmentNotifications] = useState<PendingAppointmentNotification[]>([]);
  const journalScrollRef = useRef<HTMLDivElement>(null);

  const scrollJournal = (direction: "left" | "right") => {
    if (journalScrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      journalScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!user) return;

    let active = true;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("nutritionists")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      const nutritionistProfile = data as NutritionistProfile | null;
      setProfile({
        full_name: nutritionistProfile?.full_name || user.user_metadata?.full_name || null,
        avatar_url: nutritionistProfile?.avatar_url || null,
      });
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setAppointmentsLoading(true);
      return;
    }

    if (!user) {
      setAppointments([]);
      setAppointmentsLoading(false);
      return;
    }

    let active = true;

    const loadAppointments = async () => {
      setAppointmentsLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");

      const { data } = await supabase
        .from("appointments")
        .select("id, date, time_start, status, patients!inner(name)")
        .eq("nutritionist_id", user.id)
        .gte("date", today)
        .order("date", { ascending: true })
        .order("time_start", { ascending: true })
        .limit(15);

      if (!active) return;

      setAppointments((data ?? []) as any[]);
      setAppointmentsLoading(false);
    };

    loadAppointments();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRecentConversations([]);
      return;
    }

    let active = true;

    const loadRecentConversations = async () => {
      const { data } = await supabase
        .from("messages")
        .select("conversation_patient_id, created_at, sender_user_id, read_at, patients!inner(id, name, nutritionist_id)")
        .eq("patients.nutritionist_id", user.id)
        .order("created_at", { ascending: false })
        .limit(150);

      if (!active) return;

      const rows = (data ?? []) as any[];
      const latestByPatient = new Map<string, { patientName: string; lastMessageAt: string }>();
      const unreadByPatient = new Map<string, number>();

      rows.forEach((row) => {
        const patientId = row.conversation_patient_id as string;
        const patientData = Array.isArray(row.patients) ? row.patients[0] : row.patients;
        const patientName = patientData?.name || "Paciente";

        if (!latestByPatient.has(patientId)) {
          latestByPatient.set(patientId, {
            patientName,
            lastMessageAt: row.created_at,
          });
        }

        if (row.sender_user_id !== user.id && !row.read_at) {
          unreadByPatient.set(patientId, (unreadByPatient.get(patientId) ?? 0) + 1);
        }
      });

      const conversations = Array.from(latestByPatient.entries())
        .map(([patientId, info]) => ({
          patientId,
          patientName: info.patientName,
          lastMessageAt: info.lastMessageAt,
          unreadCount: unreadByPatient.get(patientId) ?? 0,
        }))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

      setRecentConversations(conversations);
    };

    loadRecentConversations();

    const channel = supabase
      .channel(`dashboard-recent-messages-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadRecentConversations();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPendingAppointmentNotifications([]);
      return;
    }

    let active = true;

    const loadPendingAppointments = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, date, time_start, patients!inner(name)")
        .eq("nutritionist_id", user.id)
        .eq("status", "pendente")
        .order("date", { ascending: true })
        .order("time_start", { ascending: true })
        .limit(10);

      if (!active) return;

      setPendingAppointmentNotifications(
        (data ?? []).map((appt: any) => ({
          id: appt.id,
          patientName: Array.isArray(appt.patients) ? appt.patients[0]?.name : appt.patients?.name || "Paciente",
          date: appt.date,
          timeStart: appt.time_start,
        }))
      );
    };

    loadPendingAppointments();

    const channel = supabase
      .channel(`dashboard-pending-appointments-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        loadPendingAppointments();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) {
      setJournalLoading(true);
      return;
    }

    if (!user) {
      setJournalEntries([]);
      setJournalLoading(false);
      return;
    }

    let active = true;

    const loadJournalEntries = async () => {
      setJournalLoading(true);

      const { data } = await supabase
        .from("food_diary_entries")
        .select("id, date, meal_type, description, photo_url, nutritionist_feedback, created_at, patients!inner(id, name, nutritionist_id)")
        .eq("patients.nutritionist_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);

      if (!active) return;

      setJournalEntries((data ?? []) as JournalEntryFeedItem[]);
      setJournalLoading(false);
    };

    loadJournalEntries();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) {
      setOverviewLoading(true);
      return;
    }

    if (!user) {
      setOverview({ totalPatients: 0, totalPatientsPrev: 0, faturamento: 0, faturamentoPrev: 0, patientPosts: 0, patientPostsPrev: 0 });
      setOverviewLoading(false);
      return;
    }

    let active = true;

    const loadOverview = async () => {
      setOverviewLoading(true);

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentDateStr = currentMonthStart.toISOString().split('T')[0];
      const prevStartDateStr = prevMonthStart.toISOString().split('T')[0];
      const prevEndDateStr = prevMonthEnd.toISOString().split('T')[0];

      const [patientsCurrentResult, patientsPrevResult, postsCurrentResult, postsPrevResult] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("nutritionist_id", user.id).gte("created_at", currentDateStr),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("nutritionist_id", user.id).gte("created_at", prevStartDateStr).lte("created_at", prevEndDateStr),
        supabase
          .from("food_diary_entries")
          .select("id, patients!inner(id, nutritionist_id)", { count: "exact", head: true })
          .eq("patients.nutritionist_id", user.id)
          .gte("created_at", currentDateStr),
        supabase
          .from("food_diary_entries")
          .select("id, patients!inner(id, nutritionist_id)", { count: "exact", head: true })
          .eq("patients.nutritionist_id", user.id)
          .gte("created_at", prevStartDateStr)
          .lte("created_at", prevEndDateStr),
      ]);

      if (!active) return;

      setOverview({
        totalPatients: patientsCurrentResult.count ?? 0,
        totalPatientsPrev: patientsPrevResult.count ?? 0,
        faturamento: 0,
        faturamentoPrev: 0,
        patientPosts: postsCurrentResult.count ?? 0,
        patientPostsPrev: postsPrevResult.count ?? 0,
      });
      setOverviewLoading(false);
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const displayName = profile.full_name || user?.user_metadata?.full_name || "Nutricionista";
  const initials = getInitials(displayName) || "N";
  const todayLabel = formatDashboardDate(new Date());
  const recentMessageSlots = recentConversations.slice(0, 9);
  const readConversations = recentMessageSlots.filter((conversation) => conversation.unreadCount === 0);
  const unreadConversations = recentMessageSlots.filter((conversation) => conversation.unreadCount > 0);
  const hasMessageConversations = recentMessageSlots.length > 0;
  const unreadMessageCount = unreadConversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const notificationCount = unreadMessageCount + pendingAppointmentNotifications.length;

  const notifications: DashboardNotification[] = [
    ...unreadConversations.map((conversation) => ({
      id: `message-${conversation.patientId}`,
      type: "message" as const,
      title: `${conversation.unreadCount} mensagem${conversation.unreadCount > 1 ? "ens" : ""} nova${conversation.unreadCount > 1 ? "s" : ""}`,
      subtitle: conversation.patientName,
      href: "/chat",
      timestamp: conversation.lastMessageAt,
      badge: conversation.unreadCount,
    })),
    ...pendingAppointmentNotifications.map((appt) => ({
      id: `appointment-${appt.id}`,
      type: "appointment" as const,
      title: "Consulta pendente",
      subtitle: `${appt.patientName} • ${format(new Date(`${appt.date}T${appt.timeStart}`), "dd/MM 'às' HH:mm")}`,
      href: "/agenda",
      timestamp: `${appt.date}T${appt.timeStart}`,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
  const endOfWeekStr = format(endOfWeek, "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const groupedAppointments = appointments.reduce(
    (acc, appt) => {
      if (appt.date === todayStr) acc.today.push(appt);
      else if (appt.date <= endOfWeekStr) acc.thisWeek.push(appt);
      else acc.upcoming.push(appt);
      return acc;
    },
    { today: [] as any[], thisWeek: [] as any[], upcoming: [] as any[] }
  );

  const appointmentGroups = [
    { id: "today", label: "Hoje", icon: Clock, data: groupedAppointments.today },
    { id: "thisWeek", label: "Esta semana", icon: Calendar, data: groupedAppointments.thisWeek },
    { id: "upcoming", label: "Próximas", icon: CalendarDays, data: groupedAppointments.upcoming },
  ].filter((g) => g.data.length > 0);

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 border border-border/60 shadow-sm shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-muted text-sm sm:text-base font-semibold text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Bem-vindo</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl truncate">{displayName}</h1>
            <p className="page-lead truncate">{todayLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
          <button className="group flex h-10 flex-1 sm:flex-none items-center justify-center gap-2 rounded-full border border-border/60 bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover hover:text-primary" title="Tarefas">
            <CheckSquare className="h-4 w-4" />
            <span>Tarefas</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90" title="Notificações">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-[calc(100vw-32px)] sm:w-[340px] max-w-full">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Notificações</span>
                  <span className="text-xs text-muted-foreground">{notificationCount} novas</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">Nenhuma notificação no momento.</div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto p-1">
                  {notifications.slice(0, 8).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => navigate(notification.href)}
                      className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 focus:bg-surface-hover focus:text-surface-hover-foreground"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {notification.type === "message" ? <MessageCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{notification.title}</p>
                          {notification.badge && (
                            <span className="shrink-0 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                              {notification.badge > 9 ? "9+" : notification.badge}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{notification.subtitle}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/chat")}>Ver chats</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/agenda")}>Ver agenda</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col gap-6 sm:gap-8">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,2.3fr)_minmax(280px,1fr)] lg:auto-rows-max">
          <div className="flex flex-col gap-6 sm:gap-8 lg:row-span-2">
            <div className="grid gap-6 sm:gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
              <div className="flex h-full flex-col gap-3">
                <h2 className="page-section-title flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Últimas Mensagens</h2>
                <section className="flex-1 flex flex-col justify-center rounded-[26px] border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center overflow-x-auto overflow-y-visible py-1 scrollbar-hide">
                    {hasMessageConversations ? (
                      <>
                        <div className="flex items-center gap-2.5 pr-3">
                          {unreadConversations.map((conversation, index) => {
                            const size = getUnreadAvatarSize(index, unreadConversations.length);

                            return (
                            <Link
                              key={conversation.patientId}
                              to="/chat"
                              className="relative flex shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:scale-105"
                              style={{ width: size, height: size, zIndex: 10 + index }}
                              title={conversation.patientName}
                            >
                              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                              </span>
                              {getInitials(conversation.patientName)}
                            </Link>
                            );
                          })}
                        </div>

                        <div className="mx-2 h-12 w-px shrink-0 rounded-full bg-border" />

                        <div className="flex items-center gap-2.5 pl-3">
                          {readConversations.map((conversation) => (
                            <Link
                              key={conversation.patientId}
                              to="/chat"
                              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/60 bg-primary/10 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/20 hover:scale-105"
                              title={conversation.patientName}
                            >
                              {getInitials(conversation.patientName)}
                            </Link>
                          ))}
                        </div>

                      </>
                    ) : (
                      <Link
                        to="/chat"
                        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:scale-105"
                        title="Nova conversa"
                      >
                        NC
                      </Link>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex h-full flex-col gap-3">
                <h2 className="page-section-title flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary" /> Acessar painel</h2>
                <Link
                  to="/painel"
                  className="group flex flex-1 min-h-[100px] items-center justify-between rounded-[26px] border border-primary/20 bg-primary p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  <div className="min-w-0 pr-3">
                    <h3 className="text-lg font-semibold text-primary-foreground truncate">Sua Página</h3>
                    <p className="mt-1 text-sm text-primary-foreground/80 truncate">Visão geral do seu perfil e suas publicações</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-all duration-200 group-hover:bg-primary-foreground/20 group-hover:scale-105">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="page-section-title flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Feed de Hoje</h2>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 mr-2">
                    <button
                      onClick={() => scrollJournal("left")}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => scrollJournal("right")}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <Link to="/diario" className="text-xs font-medium text-primary hover:underline">Ver mais</Link>
                </div>
              </div>

              <section className="flex flex-col rounded-[26px] border border-border/80 bg-card p-3 sm:p-4 shadow-sm min-h-0 max-h-[380px] sm:max-h-[420px]">
                {journalLoading ? (
                  <div className="overflow-hidden py-1">
                    <div className="grid grid-flow-col grid-rows-2 gap-2 sm:gap-3 auto-cols-[140px] sm:auto-cols-[160px] h-[288px] sm:h-[332px]">
                      <div className="col-span-2 row-span-2 rounded-[20px] sm:rounded-[24px] bg-muted animate-pulse" />
                      <div className="col-span-1 row-span-1 rounded-[14px] sm:rounded-[18px] bg-muted animate-pulse" />
                      <div className="col-span-1 row-span-1 rounded-[14px] sm:rounded-[18px] bg-muted animate-pulse" />
                      <div className="col-span-2 row-span-2 rounded-[20px] sm:rounded-[24px] bg-muted animate-pulse" />
                    </div>
                  </div>
                ) : journalEntries.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate("/diario")}
                    className="flex min-h-[250px] w-full items-center justify-center rounded-[20px] border border-dashed border-border/90 bg-muted p-5 text-center text-sm text-muted-foreground transition-colors hover:bg-accent"
                  >
                    Os pacientes ainda não enviaram registros hoje.
                  </button>
                ) : (
                  <div className="relative min-h-0">
                    <div ref={journalScrollRef} className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide py-1 -mb-1 pb-2 scroll-smooth max-h-[360px] sm:max-h-[400px]">
                      <div className="grid grid-flow-col grid-rows-2 gap-2 sm:gap-3 auto-cols-[140px] sm:auto-cols-[160px] h-[288px] sm:h-[332px]">
                      {journalEntries.slice(0, 8).map((entry, index) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => navigate("/diario")}
                          className={`group relative appearance-none overflow-hidden border border-border/80 bg-muted text-left outline-none ring-0 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${getJournalTileClass(index)}`}
                        >
                        {entry.photo_url ? (
                          <img src={entry.photo_url} alt={entry.meal_type} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full bg-gradient-to-br ${getMealGradient(entry.meal_type)}`} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                        <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-2 sm:p-3 text-white">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-white/90 backdrop-blur-sm">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {format(new Date(entry.created_at), "HH:mm")}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] flex items-center gap-2 sm:gap-2.5">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-white/20 shadow-sm shrink-0">
                            <AvatarFallback className="bg-black/40 text-[10px] sm:text-[11px] font-medium text-white/90 backdrop-blur-md">
                              {getInitials(entry.patients?.name || "P")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-semibold leading-tight sm:text-[13px] md:text-sm">{formatPatientName(entry.patients?.name)}</p>
                            <p className="mt-0.5 sm:mt-1 truncate text-[10px] font-medium text-white/95 leading-tight sm:text-xs md:text-sm">{entry.meal_type}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="lg:col-start-2 lg:row-start-1 lg:row-end-3 flex flex-col min-h-0">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="page-section-title flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Próximas Consultas</h2>
                <Link to="/agenda" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>
              </div>

              <section className="rounded-[26px] border border-border/80 bg-card p-1.5 sm:p-1.5 shadow-sm flex flex-col min-h-0 overflow-hidden max-h-[500px] sm:max-h-[550px]">
                <div className="flex flex-col gap-2 py-1 pl-1.5 pr-1.5 flex-1 overflow-hidden">
                {appointmentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl border border-border/60 bg-muted animate-pulse" />
                  ))
                ) : appointments.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
                    Nenhuma consulta marcada.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto pl-1.5 pr-1.5 flex-1 max-h-[480px] sm:max-h-[530px]">
                    {appointmentGroups.map((group, index) => (
                      <div key={group.id} className="flex flex-col space-y-2">
                        {index > 0 && <div className="h-px bg-border/60 my-2" />}
                        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1 mb-1">
                          <group.icon className="h-3.5 w-3.5" />
                          {group.label}
                        </h3>
                        {group.data.map((appt) => (
                          <Link
                            key={appt.id}
                            to="/agenda"
                            className="group flex items-center justify-between h-16 rounded-xl border border-border/60 bg-card px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover shadow-sm"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <Avatar className="h-8 w-8 shrink-0 border border-border/60">
                                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                  {getInitials(appt.patients?.name || "P")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                  {formatPatientName(appt.patients?.name)}
                                </p>
                                <div className="mt-0.5 flex items-center text-xs text-muted-foreground gap-1">
                                  {group.id === "today" ? (
                                    <Clock className="mr-1 h-3 w-3 shrink-0" />
                                  ) : (
                                    <Calendar className="mr-1 h-3 w-3 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {group.id === "today" 
                                      ? `Hoje às ${appt.time_start.slice(0, 5)}`
                                      : `${format(new Date(appt.date + "T00:00:00"), "dd/MM")} às ${appt.time_start.slice(0, 5)}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <div>
          <h2 className="page-section-title mb-3 flex items-center gap-2"><CircleDollarSign className="h-5 w-5 text-primary" /> Financeiro</h2>
          <section className="rounded-[26px] border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
            <div>
              {overviewLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                  <div className="px-2 sm:px-4 pt-2 sm:pt-0 pb-3 sm:pb-0 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-foreground" />
                      <p className="truncate text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de pacientes</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl sm:text-xl font-bold tabular-nums text-foreground lg:text-2xl">{overview.totalPatients}</p>
                      {(overview.totalPatientsPrev > 0 || overview.totalPatients > 0) && (
                        <div className="flex items-center gap-1">
                          {overview.totalPatientsPrev === 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">+{overview.totalPatients}</span>
                            </>
                          ) : overview.totalPatients >= overview.totalPatientsPrev ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">+{overview.totalPatients - overview.totalPatientsPrev}</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-semibold text-red-600">{overview.totalPatients - overview.totalPatientsPrev}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-2 sm:px-4 pt-4 sm:pt-0 pb-3 sm:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDollarSign className="h-4 w-4 text-foreground" />
                      <p className="truncate text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faturamento</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-2xl sm:text-xl font-bold tabular-nums text-foreground lg:text-2xl">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(overview.faturamento)}
                      </p>
                      {(overview.faturamentoPrev > 0 || overview.faturamento > 0) && (
                        <div className="flex items-center gap-1">
                          {overview.faturamentoPrev === 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">+100%</span>
                            </>
                          ) : overview.faturamento >= overview.faturamentoPrev ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">+{((((overview.faturamento - overview.faturamentoPrev) / overview.faturamentoPrev) * 100).toFixed(1))}</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-semibold text-red-600">{(((overview.faturamento - overview.faturamentoPrev) / overview.faturamentoPrev) * 100).toFixed(1)}</span>
                            </>
                          )}
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-2 sm:px-4 pt-4 sm:pt-0 pb-2 sm:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileScan className="h-4 w-4 text-foreground" />
                      <p className="truncate text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts dos pacientes</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl sm:text-xl font-bold tabular-nums text-foreground lg:text-2xl">{overview.patientPosts}</p>
                      {(overview.patientPostsPrev > 0 || overview.patientPosts > 0) && (
                        <div className="flex items-center gap-1">
                          {overview.patientPostsPrev === 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">+{overview.patientPosts}</span>
                            </>
                          ) : overview.patientPosts >= overview.patientPostsPrev ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">+{overview.patientPosts - overview.patientPostsPrev}</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-semibold text-red-600">{overview.patientPosts - overview.patientPostsPrev}</span>
                            </>
                          )}
                        </div>
                      )}  
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="mt-8 sm:mt-10">
        <h2 className="page-section-title mb-3 flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickAccess.map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className="group flex min-h-[100px] items-center justify-between rounded-[26px] border border-border/80 bg-card p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
            >
              <div className="min-w-0 pr-3">
                <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary truncate">{q.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground truncate">{q.description}</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 group-hover:bg-primary/90 group-hover:scale-105">
                <q.icon className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

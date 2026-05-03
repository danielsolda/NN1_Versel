import { useState, useEffect } from "react";
import { format, isToday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookOpen, Calendar, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import DiaryEntryDetail from "@/components/shared/DiaryEntryDetail";

interface DiaryEntry {
  id: string;
  date: string;
  meal_type: string;
  description: string;
  notes: string | null;
  created_at: string;
  photo_url: string | null;
  nutritionist_feedback: string | null;
  feedback_at: string | null;
  patients: {
    id: string;
    name: string;
  };
}

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
    "col-span-2 row-span-2 rounded-3xl",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-2 row-span-2 rounded-3xl",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
  ];

  return layoutClasses[index % layoutClasses.length];
}

function formatPatientName(name: string | undefined | null) {
  if (!name) return "Paciente";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export default function Diario() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => {
    fetchDiaryEntries();
  }, []);

  const fetchDiaryEntries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("food_diary_entries")
        .select(`*, patients!inner(id, name, nutritionist_id)`)
        .eq("patients.nutritionist_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries((data as any) || []);
    } catch (error) {
      console.error("Erro ao buscar diários:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.patients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const [year, month, day] = entry.date.split("-").map(Number);
    const entryDate = new Date(year, month - 1, day);

    if (activeTab === "hoje") return isToday(entryDate);
    if (activeTab === "semana") return isThisWeek(entryDate, { weekStartsOn: 1 });
    return true;
  });

  const groupedByDate = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const visibleEntries = filteredEntries;
  const selectedIndex = selectedEntry ? visibleEntries.findIndex((entry) => entry.id === selectedEntry.id) : -1;

  const goToAdjacentEntry = (direction: -1 | 1) => {
    if (!visibleEntries.length) return;
    if (selectedIndex === -1) {
      setSelectedEntryId(visibleEntries[0].id);
      return;
    }

    const nextIndex = (selectedIndex + direction + visibleEntries.length) % visibleEntries.length;
    setSelectedEntryId(visibleEntries[nextIndex].id);
  };

  const todayCount = entries.filter((e) => {
    const [y, m, d] = e.date.split("-").map(Number);
    return isToday(new Date(y, m - 1, d));
  }).length;

  const weekCount = entries.filter((e) => {
    const [y, m, d] = e.date.split("-").map(Number);
    return isThisWeek(new Date(y, m - 1, d), { weekStartsOn: 1 });
  }).length;

  if (loading) {
    return (
      <div className="page-shell mx-auto max-w-7xl">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl break-inside-avoid" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl">
      {/* Header with inline stats */}
      <div className="page-header mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-primary" /><h1 className="page-title">Diário Alimentar</h1></div>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{todayCount}</span>
                hoje
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-palette-slate px-1.5 text-[11px] font-semibold text-white">{weekCount}</span>
                semana
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-card px-1.5 text-[11px] font-semibold text-foreground">{entries.length}</span>
                total
              </span>
            </div>
          </div>
        </div>

        {/* Filters row */}
        <div className="mt-4 flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="todos" className="h-7 px-3 text-xs">Todos</TabsTrigger>
              <TabsTrigger value="hoje" className="h-7 px-3 text-xs">Hoje</TabsTrigger>
              <TabsTrigger value="semana" className="h-7 px-3 text-xs">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar paciente ou refeição..."
              className="h-8 pl-8 text-xs bg-background rounded-[26px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredEntries.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="rounded-full bg-primary p-6 mb-6">
              <BookOpen className="h-10 w-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery
                ? "Não encontramos nenhum registro que corresponda à sua busca."
                : "Os pacientes ainda não registraram refeições neste período."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dateEntries], dateIndex) => {
            const [year, month, day] = date.split("-").map(Number);
            const dateObj = new Date(year, month - 1, day);
            const isDateToday = isToday(dateObj);
            const formattedDate = isDateToday
              ? "Hoje"
              : format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
            const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

            return (
              <div key={date}>
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className={`h-4 w-4 ${isDateToday ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="text-sm font-semibold text-foreground">{capitalizedDate}</h3>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${isDateToday ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
                  >
                    {dateEntries.length} refeições
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:auto-rows-[120px]">
                  {dateEntries.map((entry, index) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedEntryId(entry.id)}
                      className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-muted text-left transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:outline-none ${getJournalTileClass(index)}`}
                    >
                      {entry.photo_url ? (
                        <img src={entry.photo_url} alt={entry.meal_type} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${getMealGradient(entry.meal_type)} transition-transform duration-500 group-hover:scale-105`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-3 text-white">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                          <Clock className="h-3 w-3" />
                          {format(new Date(entry.created_at), "HH:mm")}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                        <p className="truncate text-[12px] font-semibold leading-tight sm:text-sm">{formatPatientName(entry.patients?.name)}</p>
                        <p className="mt-1 truncate text-xs font-medium text-white/95 leading-tight sm:text-sm">{entry.meal_type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedEntry} onOpenChange={(open) => { if (!open) setSelectedEntryId(null); }}>
        <DialogContent className="h-[90vh] max-w-5xl border-border/60 p-0 gap-0 overflow-hidden">
          {selectedEntry && (
            <div className="relative h-full overflow-hidden">
              <div className="absolute left-3 top-3 z-20 flex gap-2">
                <button
                  type="button"
                  onClick={() => goToAdjacentEntry(-1)}
                  className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  aria-label="Refeição anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToAdjacentEntry(1)}
                  className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  aria-label="Próxima refeição"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="h-full overflow-y-auto">
                <DiaryEntryDetail
                  entry={selectedEntry}
                  allEntries={entries.filter(
                    (e) =>
                      e.meal_type === selectedEntry.meal_type &&
                      e.date === selectedEntry.date &&
                      e.patients?.id === selectedEntry.patients?.id
                  )}
                  patientInfo={{ name: selectedEntry.patients?.name }}
                  canFeedback
                  onFeedbackSaved={(entryId, feedback) => {
                    setEntries((prev) =>
                      prev.map((e) =>
                        e.id === entryId
                          ? { ...e, nutritionist_feedback: feedback || null, feedback_at: feedback ? new Date().toISOString() : null }
                          : e
                      )
                    );
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

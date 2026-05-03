import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, isToday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpen, Plus, Calendar,
  Camera, Search, Loader2, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import PinterestSlideLayout from "@/components/shared/PinterestSlideLayout";
import DiaryEntryDetail from "@/components/shared/DiaryEntryDetail";
import MealPinterestCard from "@/components/shared/MealPinterestCard";

const MEAL_TYPES = [
  "Café da manhã",
  "Lanche da manhã",
  "Almoço",
  "Lanche da tarde",
  "Jantar",
  "Ceia",
];

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
}

interface MealOptionChoice {
  id: string;
  name: string;
  image_url: string | null;
  foods: string;
}

export default function PatientDiario() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Mark feedback as read when patient views an entry with feedback
  const markFeedbackAsRead = useCallback(async (entryId: string | null) => {
    if (!entryId) return;
    const entry = entries.find(e => e.id === entryId);
    if (!entry?.nutritionist_feedback) return;
    await supabase
      .from("food_diary_entries")
      .update({ feedback_read_at: new Date().toISOString() } as any)
      .eq("id", entryId)
      .is("feedback_read_at" as any, null);
    queryClient.invalidateQueries({ queryKey: ["unread-feedback"] });
  }, [entries, queryClient]);

  useEffect(() => {
    markFeedbackAsRead(selectedEntryId);
  }, [selectedEntryId, markFeedbackAsRead]);

  // New entry modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    meal_type: "",
    description: "",
    notes: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Meal options from plan
  const [mealOptions, setMealOptions] = useState<MealOptionChoice[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    fetchDiaryEntries();
  }, []);

  const fetchDiaryEntries = async () => {
    try {
      setLoading(true);
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (patient) {
        setPatientId(patient.id);
        const { data: diaryData } = await supabase
          .from("food_diary_entries")
          .select("*")
          .eq("patient_id", patient.id)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });

        setEntries(diaryData || []);
      }
    } catch (error) {
      console.error("Erro ao buscar entradas do diário:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setForm({ meal_type: "", description: "", notes: "", date: format(new Date(), "yyyy-MM-dd") });
    clearPhoto();
    setMealOptions([]);
    setSelectedOptionId(null);
  };

  // Fetch meal options from patient's plans when meal_type changes
  const fetchMealOptions = async (mealType: string) => {
    if (!patientId || !mealType) {
      setMealOptions([]);
      return;
    }
    setLoadingOptions(true);
    try {
      // Get meals matching this type from patient's plans
      const { data: meals } = await supabase
        .from("meals")
        .select(`
          id, type, name,
          meal_plans!inner(patient_id),
          meal_options(id, name, image_url, sort_order,
            meal_food_items(food_name, quantity, unit, sort_order)
          )
        `)
        .eq("meal_plans.patient_id", patientId)
        .ilike("name", `%${mealType}%`);

      if (meals) {
        const options: MealOptionChoice[] = [];
        for (const meal of meals) {
          for (const opt of (meal.meal_options || [])) {
            const items = (opt.meal_food_items || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((f: any) => [f.quantity, f.unit, f.food_name].filter(Boolean).join(" "))
              .join(", ");
            options.push({
              id: opt.id,
              name: opt.name || `Opção`,
              image_url: opt.image_url,
              foods: items,
            });
          }
        }
        setMealOptions(options);
      }
    } catch (err) {
      console.error("Erro ao buscar opções:", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSelectOption = (opt: MealOptionChoice) => {
    if (selectedOptionId === opt.id) {
      setSelectedOptionId(null);
      setForm((f) => ({ ...f, description: "" }));
    } else {
      setSelectedOptionId(opt.id);
      setForm((f) => ({ ...f, description: opt.foods }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !form.meal_type || !form.description) return;

    setSaving(true);
    try {
      let photo_url: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `diary/${patientId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("food-diary-photos")
          .upload(path, photoFile);
        if (uploadError) {
          // Try creating bucket if it doesn't exist
          await supabase.storage.createBucket("food-diary-photos", { public: true });
          const { error: retryError } = await supabase.storage
            .from("food-diary-photos")
            .upload(path, photoFile);
          if (retryError) throw retryError;
        }
        const { data: urlData } = supabase.storage
          .from("food-diary-photos")
          .getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("food_diary_entries").insert({
        patient_id: patientId,
        meal_type: form.meal_type,
        description: form.description,
        notes: form.notes || null,
        date: form.date,
        photo_url,
      });

      if (error) throw error;

      toast.success("Refeição registrada com sucesso!");
      setModalOpen(false);
      resetForm();
      fetchDiaryEntries();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const [year, month, day] = entry.date.split("-").map(Number);
    const entryDate = new Date(year, month - 1, day);

    if (activeTab === "hoje") return isToday(entryDate);
    if (activeTab === "semana") return isThisWeek(entryDate, { weekStartsOn: 1 });
    return true;
  });

  const groupedByDate = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = {};
    if (!acc[entry.date][entry.meal_type]) acc[entry.date][entry.meal_type] = [];
    acc[entry.date][entry.meal_type].push(entry);
    return acc;
  }, {} as Record<string, Record<string, DiaryEntry[]>>);

  const todayCount = entries.filter((e) => {
    const [y, m, d] = e.date.split("-").map(Number);
    return isToday(new Date(y, m - 1, d));
  }).length;

  const weekCount = entries.filter((e) => {
    const [y, m, d] = e.date.split("-").map(Number);
    return isThisWeek(new Date(y, m - 1, d), { weekStartsOn: 1 });
  }).length;

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

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
            <h1 className="page-title">Meu Diário Alimentar</h1>
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
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Refeição</span>
            <span className="sm:hidden">Nova</span>
          </Button>
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
              placeholder="Buscar..."
              className="h-8 pl-8 text-xs bg-background"
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
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "Nenhuma refeição encontrada" : "Comece seu diário hoje!"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {searchQuery
                ? "Não encontramos refeições que correspondam à sua busca."
                : "Registre suas refeições para acompanhar seus hábitos alimentares."}
            </p>
            {!searchQuery && (
              <Button className="gap-2" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Registrar Primeira Refeição
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <PinterestSlideLayout
          selectedId={selectedEntryId}
          onBack={() => setSelectedEntryId(null)}
          gridContent={
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, mealGroups]) => {
                const [year, month, day] = date.split("-").map(Number);
                const dateObj = new Date(year, month - 1, day);
                const isDateToday = isToday(dateObj);
                const formattedDate = isDateToday
                  ? "Hoje"
                  : format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
                const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className={`h-4 w-4 ${isDateToday ? "text-primary" : "text-muted-foreground"}`} />
                      <h3 className="text-sm font-semibold text-foreground">{capitalizedDate}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${isDateToday ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
                      >
                        {Object.values(mealGroups).flat().length} refeições
                      </Badge>
                    </div>

                    <div className="columns-2 md:columns-3 gap-4 space-y-4">
                      {Object.entries(mealGroups).map(([mealType, mealEntries]) => {
                        const latestEntry = mealEntries[0];
                        return (
                          <div key={`${date}-${mealType}`} className="break-inside-avoid">
                            <MealPinterestCard
                              imageUrl={latestEntry.photo_url}
                              title={mealType}
                              subtitle={latestEntry.description.length > 60
                                ? latestEntry.description.substring(0, 60) + "..."
                                : latestEntry.description}
                              time={format(new Date(latestEntry.created_at), "HH:mm")}
                              badgeText={mealEntries.length > 1 ? `${mealEntries.length} registros` : undefined}
                              hasFeedback={mealEntries.some(e => !!e.nutritionist_feedback)}
                              onClick={() => setSelectedEntryId(latestEntry.id)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          }
          detailContent={
            selectedEntry ? <DiaryEntryDetail entry={selectedEntry} allEntries={entries.filter(e => e.meal_type === selectedEntry.meal_type && e.date === selectedEntry.date)} /> : null
          }
        />
      )}

      {/* New Entry Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) resetForm(); setModalOpen(o); }}>
        <DialogContent className="sm:max-w-xl border-border/60 p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-1">
            <DialogTitle className="text-base font-semibold text-foreground">Nova Refeição</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">Registre o que você comeu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-6 pb-5 pt-3 space-y-3.5">
            {/* Photo upload */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Foto do prato</Label>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden aspect-video">
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-muted-foreground transition-colors hover:border-surface-hover-border hover:bg-surface-hover hover:text-primary"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Toque para adicionar foto</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Tipo de refeição *</Label>
                <Select value={form.meal_type} onValueChange={(v) => { setForm({ ...form, meal_type: v, description: "" }); setSelectedOptionId(null); fetchMealOptions(v); }}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Meal options from plan */}
            {form.meal_type && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Opção do plano</Label>
                {loadingOptions ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : mealOptions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {mealOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`group rounded-lg border text-left p-2 transition-colors ${
                          selectedOptionId === opt.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-surface-hover-border hover:bg-surface-hover hover:text-primary"
                        }`}
                      >
                        {opt.image_url && (
                          <div className="aspect-video w-full overflow-hidden rounded-md mb-1.5">
                            <img src={opt.image_url} alt={opt.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <p className="text-xs font-medium text-foreground truncate transition-colors group-hover:text-primary">{opt.name}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{opt.foods}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic py-1">Nenhuma opção encontrada no plano para esta refeição.</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Descrição *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="O que você comeu? Ex: Arroz integral, frango grelhado, salada..."
                rows={3}
                className="text-sm resize-none"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Como se sentiu? Alguma reação?"
                className="h-8 text-sm"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40">
              <Button type="submit" disabled={saving || !form.meal_type || !form.description} size="sm" className="h-8 text-xs font-medium px-4 gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Registrar</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


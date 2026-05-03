import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  ChevronRight,
  FileText,
  HeartPulse,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Save,
  Scale,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birthdate: string | null;
  notes: string | null;
  created_at: string;
  auth_user_id: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  address: string | null;
}

interface AnamnesisRow {
  previous_diseases: string | null;
  surgeries: string | null;
  family_history: string | null;
  current_medications: string | null;
  sleep_quality: string | null;
  exercise_routine: string | null;
  smoking: string | null;
  alcohol: string | null;
  daily_routine: string | null;
  bowel_function: string | null;
  digestive_symptoms: string | null;
  food_intolerances: string | null;
  food_preferences: string | null;
  food_aversions: string | null;
  previous_diets: string | null;
  dietary_recall: string | null;
  general_notes: string | null;
}

interface MealPlan {
  id: string;
  title: string;
  created_at: string;
  notes: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  target_value: string | null;
  current_value: string | null;
  unit: string | null;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
}

interface FichaFormState {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthdate: string;
  address: string;
  weight: string;
  height: string;
  goal: string;
  allergies: string;
  medical_conditions: string;
  notes: string;
}

const emptyFichaForm: FichaFormState = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  birthdate: "",
  address: "",
  weight: "",
  height: "",
  goal: "",
  allergies: "",
  medical_conditions: "",
  notes: "",
};

const emptyAnamnesis: Record<string, string> = {
  previous_diseases: "",
  surgeries: "",
  family_history: "",
  current_medications: "",
  sleep_quality: "",
  exercise_routine: "",
  smoking: "",
  alcohol: "",
  daily_routine: "",
  bowel_function: "",
  digestive_symptoms: "",
  food_intolerances: "",
  food_preferences: "",
  food_aversions: "",
  previous_diets: "",
  dietary_recall: "",
  general_notes: "",
};

const goalCategoryLabels: Record<string, string> = {
  peso: "Peso",
  medida: "Medida",
  habito: "Hábito",
  nutricional: "Nutricional",
  outro: "Outro",
};

const goalCategoryColors: Record<string, string> = {
  peso: "border-transparent bg-palette-blue text-white dark:bg-palette-blue dark:text-white",
  medida: "border-transparent bg-palette-green text-white dark:bg-palette-green dark:text-white",
  habito: "border-transparent bg-palette-blue text-white dark:bg-palette-blue dark:text-white",
  nutricional: "border-transparent bg-palette-orange text-white dark:bg-palette-orange dark:text-white",
  outro: "border-transparent bg-palette-slate text-white dark:bg-palette-slate dark:text-white",
};

const goalStatusLabels: Record<string, string> = {
  ativa: "Ativa",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function buildFichaForm(patient?: Patient | null): FichaFormState {
  return {
    name: patient?.name || "",
    email: patient?.email || "",
    phone: patient?.phone || "",
    cpf: patient?.cpf || "",
    birthdate: patient?.birthdate || "",
    address: patient?.address || "",
    weight: patient?.weight !== null && patient?.weight !== undefined ? String(patient.weight) : "",
    height: patient?.height !== null && patient?.height !== undefined ? String(patient.height) : "",
    goal: patient?.goal || "",
    allergies: patient?.allergies || "",
    medical_conditions: patient?.medical_conditions || "",
    notes: patient?.notes || "",
  };
}

function AnamnesisField({
  label,
  field,
  value,
  onChange,
  rows = 2,
  editable = true,
}: {
  label: string;
  field: string;
  value: Record<string, string>;
  onChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  rows?: number;
  editable?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      {editable ? (
        <Textarea
          value={value[field] || ""}
          onChange={(e) => onChange((prev) => ({ ...prev, [field]: e.target.value }))}
          rows={rows}
          className="resize-none border-border/60 text-sm shadow-none focus-visible:ring-1"
          placeholder={`${label}...`}
        />
      ) : (
        <p className="min-h-[36px] whitespace-pre-wrap rounded-md bg-transparent text-sm text-foreground">
          {value[field] || <span className="italic text-muted-foreground">Não informado</span>}
        </p>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number | null | undefined }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="break-words text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
}

function formatPreciseNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function calculateAge(birthdate: string | null | undefined) {
  if (!birthdate) return null;

  const born = new Date(`${birthdate}T12:00:00`);
  if (Number.isNaN(born.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDifference = today.getMonth() - born.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }

  return age;
}

function calculateBmi(weight: number | null | undefined, height: number | null | undefined) {
  if (!weight || !height) return null;

  const heightInMeters = height / 100;
  if (!heightInMeters) return null;

  return weight / (heightInMeters * heightInMeters);
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

function MetricTile({
  label,
  value,
  hint,
  className = "",
  showHint = true,
  compact = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  showHint?: boolean;
  compact?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${emphasis ? "border-primary/20 bg-primary/5" : "border-border/60 bg-card"} ${compact ? "p-3" : "p-4"} ${className}`.trim()}>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`${compact ? "mt-2" : "mt-3"} truncate text-base font-semibold text-foreground sm:text-lg`}>{value}</p>
      {showHint && hint && <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function PacienteDetalhe() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailTab, setDetailTab] = useState("ficha");
  const [planningTab, setPlanningTab] = useState("planos");
  const [anamnesis, setAnamnesis] = useState<Record<string, string>>(emptyAnamnesis);
  const [anamnesisLoading, setAnamnesisLoading] = useState(true);
  const [anamnesisEditing, setAnamnesisEditing] = useState(false);
  const [anamnesisSaving, setAnamnesisSaving] = useState(false);
  const [fichaForm, setFichaForm] = useState<FichaFormState>(emptyFichaForm);
  const [fichaEditing, setFichaEditing] = useState(false);
  const [fichaSaving, setFichaSaving] = useState(false);
  const [credDialog, setCredDialog] = useState<{ open: boolean; patient: Patient | null; password: string | null; loading: boolean; copied: boolean }>({
    open: false,
    patient: null,
    password: null,
    loading: false,
    copied: false,
  });
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; patient: Patient | null; loading: boolean }>({
    open: false,
    patient: null,
    loading: false,
  });

  const { data: patient, isLoading: patientLoading } = useQuery<Patient | null>({
    queryKey: ["patient-detail", patientId, user?.id],
    queryFn: async () => {
      if (!patientId || !user) return null;
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .eq("nutritionist_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Patient | null) ?? null;
    },
    enabled: !!user && !!patientId,
  });

  const { data: mealPlans = [], isLoading: mealPlansLoading } = useQuery<MealPlan[]>({
    queryKey: ["patient-meal-plans", patientId, user?.id],
    queryFn: async () => {
      if (!patientId || !user) return [];
      const { data, error } = await supabase
        .from("meal_plans")
        .select("id, title, created_at, notes")
        .eq("patient_id", patientId)
        .eq("nutritionist_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MealPlan[];
    },
    enabled: !!user && !!patient,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["patient-goals-detail", patientId, user?.id],
    queryFn: async () => {
      if (!patientId || !user) return [];
      const { data, error } = await supabase
        .from("patient_goals")
        .select("*")
        .eq("patient_id", patientId)
        .eq("nutritionist_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Goal[];
    },
    enabled: !!user && !!patient,
  });

  useEffect(() => {
    if (!patientId) return;
    setDetailTab("ficha");
  }, [patientId]);

  const loadAnamnesis = async () => {
    if (!patient || !user) return;
    setAnamnesisLoading(true);
    const { data } = await supabase
      .from("patient_anamnesis")
      .select("*")
      .eq("patient_id", patient.id)
      .maybeSingle();

    if (data) {
      setAnamnesis({
        previous_diseases: data.previous_diseases || "",
        surgeries: data.surgeries || "",
        family_history: data.family_history || "",
        current_medications: data.current_medications || "",
        sleep_quality: data.sleep_quality || "",
        exercise_routine: data.exercise_routine || "",
        smoking: data.smoking || "",
        alcohol: data.alcohol || "",
        daily_routine: data.daily_routine || "",
        bowel_function: data.bowel_function || "",
        digestive_symptoms: data.digestive_symptoms || "",
        food_intolerances: data.food_intolerances || "",
        food_preferences: data.food_preferences || "",
        food_aversions: data.food_aversions || "",
        previous_diets: data.previous_diets || "",
        dietary_recall: data.dietary_recall || "",
        general_notes: data.general_notes || "",
      });
    } else {
      setAnamnesis(emptyAnamnesis);
    }

    setAnamnesisLoading(false);
  };

  useEffect(() => {
    if (!patient || !user) {
      setAnamnesis(emptyAnamnesis);
      setAnamnesisLoading(false);
      return;
    }
    loadAnamnesis();
  }, [patient, user]);

  useEffect(() => {
    setFichaForm(buildFichaForm(patient));
    setFichaEditing(false);
  }, [patient]);

  const saveAnamnesis = async () => {
    if (!patient || !user) return;
    setAnamnesisSaving(true);

    const payload = {
      patient_id: patient.id,
      nutritionist_id: user.id,
      ...anamnesis,
    };

    const { error } = await supabase.from("patient_anamnesis").upsert(payload, { onConflict: "patient_id" });

    if (error) {
      toast.error("Erro ao salvar anamnese");
    } else {
      toast.success("Anamnese salva!");
      setAnamnesisEditing(false);
    }

    setAnamnesisSaving(false);
  };

  const handleCancelAnamnesisEdit = () => {
    setAnamnesisEditing(false);
    loadAnamnesis();
  };

  const handleCancelFichaEdit = () => {
    setFichaForm(buildFichaForm(patient));
    setFichaEditing(false);
  };

  const handleSaveFicha = async () => {
    if (!patient || !user) return;

    if (!fichaForm.name.trim()) {
      toast.error("Informe o nome do paciente.");
      return;
    }

    const parseOptionalNumber = (value: string) => {
      const normalized = value.replace(",", ".").trim();
      if (!normalized) return null;
      const parsed = Number.parseFloat(normalized);
      return Number.isNaN(parsed) ? null : parsed;
    };

    setFichaSaving(true);

    const { error } = await supabase
      .from("patients")
      .update({
        name: fichaForm.name.trim(),
        email: fichaForm.email.trim() || null,
        phone: fichaForm.phone.trim() || null,
        cpf: fichaForm.cpf.trim() || null,
        birthdate: fichaForm.birthdate || null,
        address: fichaForm.address.trim() || null,
        weight: parseOptionalNumber(fichaForm.weight),
        height: parseOptionalNumber(fichaForm.height),
        goal: fichaForm.goal.trim() || null,
        allergies: fichaForm.allergies.trim() || null,
        medical_conditions: fichaForm.medical_conditions.trim() || null,
        notes: fichaForm.notes.trim() || null,
      })
      .eq("id", patient.id)
      .eq("nutritionist_id", user.id);

    if (error) {
      toast.error("Erro ao salvar ficha");
    } else {
      toast.success("Ficha atualizada!");
      setFichaEditing(false);
      queryClient.invalidateQueries({ queryKey: ["patient-detail", patientId, user.id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    }

    setFichaSaving(false);
  };

  const handleGenerateAccess = async (currentPatient: Patient) => {
    if (!currentPatient.email) {
      toast.error("Paciente precisa ter um email cadastrado.");
      return;
    }
    if (currentPatient.auth_user_id) {
      toast.error("Este paciente já possui acesso ao sistema.");
      return;
    }

    setCredDialog({ open: true, patient: currentPatient, password: null, loading: true, copied: false });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-patient-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          patient_id: currentPatient.id,
          email: currentPatient.email,
          name: currentPatient.name,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setCredDialog((prev) => ({ ...prev, password: result.password, loading: false }));
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-detail"] });
      toast.success("Acesso criado com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar acesso";
      toast.error(message);
      setCredDialog((prev) => ({ ...prev, open: false, loading: false }));
    }
  };

  const handleCopyCredentials = () => {
    if (!credDialog.patient || !credDialog.password) return;
    const text = `Email: ${credDialog.patient.email}\nSenha: ${credDialog.password}`;
    navigator.clipboard.writeText(text);
    setCredDialog((prev) => ({ ...prev, copied: true }));
    setTimeout(() => setCredDialog((prev) => ({ ...prev, copied: false })), 2000);
  };

  const handleRemoveAccess = async () => {
    const currentPatient = removeDialog.patient;
    if (!currentPatient) return;
    setRemoveDialog((prev) => ({ ...prev, loading: true }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remove-patient-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ patient_id: currentPatient.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-detail"] });
      toast.success("Acesso removido com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao remover acesso";
      toast.error(message);
    } finally {
      setRemoveDialog({ open: false, patient: null, loading: false });
    }
  };

  const renderEmptyState = (title: string, description: string) => (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );

  const detailSummaryDate = patient ? format(new Date(patient.created_at), "dd 'de' MMMM yyyy", { locale: ptBR }) : "";
  const patientInitials = patient ? getInitials(patient.name) : "";
  const patientAge = calculateAge(patient?.birthdate);
  const patientBmi = calculateBmi(patient?.weight, patient?.height);
  const latestMealPlan = mealPlans[0] ?? null;
  const hasAnamnesisData = Object.values(anamnesis).some((value) => value.trim().length > 0);
  const patientPhoneDigits = patient?.phone ? patient.phone.replace(/\D/g, "") : "";
  const whatsappHref = patientPhoneDigits ? `https://wa.me/${patientPhoneDigits}` : null;
  const summaryMetrics = patient
    ? [
        {
          label: "Idade",
          value: patientAge !== null ? `${patientAge} anos` : "—",
          hint: patient.birthdate ? format(new Date(`${patient.birthdate}T12:00:00`), "dd/MM/yyyy", { locale: ptBR }) : "Data não informada",
        },
        {
          label: "Peso",
          value: patient.weight !== null && patient.weight !== undefined ? `${formatCompactNumber(patient.weight)} kg` : "—",
          hint: patient.weight !== null && patient.weight !== undefined ? "Peso atual" : "Sem dado cadastrado",
        },
        {
          label: "Altura",
          value: patient.height !== null && patient.height !== undefined ? `${formatPreciseNumber(patient.height / 100)} m` : "—",
          hint: patient.height !== null && patient.height !== undefined ? "Estatura atual" : "Sem dado cadastrado",
        },
        {
          label: "IMC",
          value: patientBmi !== null ? formatCompactNumber(patientBmi) : "—",
          hint: patientBmi !== null ? "Índice corporal estimado" : "Peso e altura necessários",
        },
        {
          label: "Objetivo",
          value: patient.goal ? truncateText(patient.goal, 24) : "—",
          hint: patient.goal ? "Meta principal da ficha" : "Objetivo não informado",
        },
        {
          label: "Cadastro",
          value: detailSummaryDate || "—",
          hint: patient.auth_user_id ? "Paciente com acesso" : "Paciente sem acesso",
        },
      ]
    : [];

  return (
    <div className="page-shell mx-auto max-w-7xl space-y-6">
      {patientLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !patient ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">Paciente não encontrado ou você não tem acesso a este registro.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="relative space-y-6 p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-5">
                    <Avatar className="h-24 w-24 shrink-0 border border-border/60 shadow-sm sm:h-28 sm:w-28">
                      <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary sm:text-3xl">{patientInitials}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-3 pt-1">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="truncate text-3xl font-semibold tracking-tight text-foreground">{patient.name}</h1>
                          {patient.auth_user_id ? (
                            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                              Conectado ao app
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-full border-border/60 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              Sem acesso ao app
                            </Badge>
                          )}
                          {patient.goal && (
                            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                              {truncateText(patient.goal, 28)}
                            </Badge>
                          )}
                        </div>
                        <p className="max-w-2xl text-sm text-muted-foreground">{`Cadastrado em ${detailSummaryDate}`}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-full text-xs"
                          onClick={() => {
                            setDetailTab("ficha");
                            setFichaEditing(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar paciente
                        </Button>

                        {patient.auth_user_id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-full border-destructive/20 bg-background text-xs text-destructive hover:!border-destructive/25 hover:!bg-background hover:!text-destructive"
                            onClick={() => setRemoveDialog({ open: true, patient, loading: false })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover acesso
                          </Button>
                        ) : patient.email ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-full text-xs text-primary"
                            onClick={() => handleGenerateAccess(patient)}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Gerar acesso
                          </Button>
                        ) : null}

                        {patient.email && (
                          <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                            <a href={`mailto:${patient.email}`}>
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </a>
                          </Button>
                        )}

                        {whatsappHref && (
                          <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                            <a href={whatsappHref} target="_blank" rel="noreferrer">
                              <Phone className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  {summaryMetrics.map((metric) => (
                    <MetricTile key={metric.label} label={metric.label} value={metric.value} compact showHint={false} emphasis />
                  ))}
                </div>
              </div>
            </section>

            <Tabs value={detailTab} onValueChange={setDetailTab} className="space-y-5">
              <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-2xl border border-border/60 bg-card p-1.5 shadow-none">
                <TabsTrigger value="ficha" className="h-9 rounded-full px-3.5 text-xs">
                  Ficha
                </TabsTrigger>
                <TabsTrigger value="anamnese" className="h-9 rounded-full px-3.5 text-xs">
                  Anamnese
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ficha" className="mt-0 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados da ficha</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {fichaEditing ? "Edite os dados cadastrais e clínicos deste paciente." : "Visualize ou altere os dados cadastrais e clínicos do paciente."}
                    </p>
                  </div>
                  {!fichaEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full text-xs"
                      onClick={() => setFichaEditing(true)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Alterar dados
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={handleCancelFichaEdit}
                        disabled={fichaSaving}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-full text-xs"
                        onClick={handleSaveFicha}
                        disabled={fichaSaving}
                      >
                        {fichaSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Salvar alterações
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="card-surface p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato</h3>
                    {fichaEditing ? (
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <FormField label="Nome" className="sm:col-span-2">
                          <Input value={fichaForm.name} onChange={(e) => setFichaForm((prev) => ({ ...prev, name: e.target.value }))} className="editable-field h-8" />
                        </FormField>
                        <FormField label="Email">
                          <Input type="email" value={fichaForm.email} onChange={(e) => setFichaForm((prev) => ({ ...prev, email: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                        <FormField label="Telefone">
                          <Input type="tel" value={fichaForm.phone} onChange={(e) => setFichaForm((prev) => ({ ...prev, phone: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                        <FormField label="CPF">
                          <Input value={fichaForm.cpf} onChange={(e) => setFichaForm((prev) => ({ ...prev, cpf: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                        <FormField label="Data de Nascimento">
                          <Input type="date" value={fichaForm.birthdate} onChange={(e) => setFichaForm((prev) => ({ ...prev, birthdate: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                        <FormField label="Endereço" className="sm:col-span-2">
                          <Input value={fichaForm.address} onChange={(e) => setFichaForm((prev) => ({ ...prev, address: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-0.5">
                        <InfoRow icon={Mail} label="Email" value={patient.email} />
                        <InfoRow icon={Phone} label="Telefone" value={patient.phone} />
                        <InfoRow icon={MapPin} label="Endereço" value={patient.address} />
                        <InfoRow icon={Calendar} label="Data de Nascimento" value={patient.birthdate ? new Date(`${patient.birthdate}T12:00:00`).toLocaleDateString("pt-BR") : null} />
                        <InfoRow icon={FileText} label="CPF" value={patient.cpf} />
                      </div>
                    )}
                    {!fichaEditing && !patient.email && !patient.phone && !patient.address && !patient.birthdate && !patient.cpf && (
                      <p className="py-1 text-xs italic text-muted-foreground">Nenhuma informação de contato.</p>
                    )}
                  </div>

                  <div className="card-surface p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saúde</h3>
                    {fichaEditing ? (
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <FormField label="Peso (kg)">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={fichaForm.weight}
                            onChange={(e) => setFichaForm((prev) => ({ ...prev, weight: e.target.value }))}
                            className="h-8 border-border/60 shadow-none focus-visible:ring-1"
                          />
                        </FormField>
                        <FormField label="Altura (cm)">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={fichaForm.height}
                            onChange={(e) => setFichaForm((prev) => ({ ...prev, height: e.target.value }))}
                            className="h-8 border-border/60 shadow-none focus-visible:ring-1"
                          />
                        </FormField>
                        <FormField label="Objetivo" className="sm:col-span-2">
                          <Input value={fichaForm.goal} onChange={(e) => setFichaForm((prev) => ({ ...prev, goal: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                        <FormField label="Alergias / Intolerâncias" className="sm:col-span-2">
                          <Input value={fichaForm.allergies} onChange={(e) => setFichaForm((prev) => ({ ...prev, allergies: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                        <FormField label="Condições Médicas" className="sm:col-span-2">
                          <Input value={fichaForm.medical_conditions} onChange={(e) => setFichaForm((prev) => ({ ...prev, medical_conditions: e.target.value }))} className="h-8 border-border/60 shadow-none focus-visible:ring-1" />
                        </FormField>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-0.5">
                        <InfoRow icon={Scale} label="Peso" value={patient.weight ? `${patient.weight} kg` : null} />
                        <InfoRow icon={Ruler} label="Altura" value={patient.height ? `${patient.height} cm` : null} />
                        <InfoRow icon={Target} label="Objetivo" value={patient.goal} />
                        <InfoRow icon={AlertTriangle} label="Alergias / Intolerâncias" value={patient.allergies} />
                        <InfoRow icon={HeartPulse} label="Condições Médicas" value={patient.medical_conditions} />
                      </div>
                    )}
                    {!fichaEditing && !patient.weight && !patient.height && !patient.goal && !patient.allergies && !patient.medical_conditions && (
                      <p className="py-1 text-xs italic text-muted-foreground">Nenhuma informação de saúde.</p>
                    )}
                  </div>
                </div>

                {(fichaEditing || patient.notes) && (
                  <div className="card-surface p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</h3>
                    {fichaEditing ? (
                      <Textarea
                        value={fichaForm.notes}
                        onChange={(e) => setFichaForm((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={4}
                        className="mt-2 min-h-[110px] resize-none border-border/60 shadow-none focus-visible:ring-1"
                        placeholder="Observações do paciente..."
                      />
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{patient.notes}</p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="anamnese" className="mt-0 space-y-5">
                {anamnesisLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anamnese</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {anamnesisEditing ? "Preencha ou edite o histórico clínico do paciente." : "Visualize o histórico clínico e hábitos do paciente."}
                        </p>
                      </div>
                      {!anamnesisEditing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 rounded-full text-xs"
                          onClick={() => setAnamnesisEditing(true)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Alterar dados
                        </Button>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={handleCancelAnamnesisEdit}
                            disabled={anamnesisSaving}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1.5 rounded-full text-xs"
                            onClick={saveAnamnesis}
                            disabled={anamnesisSaving}
                          >
                            {anamnesisSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Salvar alterações
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-border/60 bg-card p-5">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico Clínico e Familiar</h3>
                        <div className="space-y-2.5">
                          <AnamnesisField editable={anamnesisEditing} label="Doenças prévias" field="previous_diseases" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Cirurgias" field="surgeries" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Histórico familiar" field="family_history" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Medicamentos em uso" field="current_medications" value={anamnesis} onChange={setAnamnesis} />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-card p-5">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hábitos de Vida</h3>
                        <div className="space-y-2.5">
                          <AnamnesisField editable={anamnesisEditing} label="Qualidade do sono" field="sleep_quality" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Exercício físico" field="exercise_routine" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Tabagismo" field="smoking" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Etilismo" field="alcohol" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Rotina diária" field="daily_routine" value={anamnesis} onChange={setAnamnesis} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-border/60 bg-card p-5">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avaliação Gastrointestinal</h3>
                        <div className="space-y-2.5">
                          <AnamnesisField editable={anamnesisEditing} label="Funcionamento intestinal" field="bowel_function" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Sintomas digestivos" field="digestive_symptoms" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Intolerâncias alimentares" field="food_intolerances" value={anamnesis} onChange={setAnamnesis} />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-card p-5">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico Alimentar</h3>
                        <div className="space-y-2.5">
                          <AnamnesisField editable={anamnesisEditing} label="Preferências alimentares" field="food_preferences" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Aversões alimentares" field="food_aversions" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Dietas anteriores" field="previous_diets" value={anamnesis} onChange={setAnamnesis} />
                          <AnamnesisField editable={anamnesisEditing} label="Recordatório alimentar" field="dietary_recall" value={anamnesis} onChange={setAnamnesis} rows={3} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card p-5">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações Gerais</h3>
                      <AnamnesisField editable={anamnesisEditing} label="Anotações da consulta" field="general_notes" value={anamnesis} onChange={setAnamnesis} rows={4} />
                    </div>
                  </>
                )}
              </TabsContent>

            </Tabs>

            <Tabs value={planningTab} onValueChange={setPlanningTab} className="space-y-5">
              <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-2xl border border-border/60 bg-card p-1.5 shadow-none">
                <TabsTrigger value="planos" className="h-9 rounded-full px-3.5 text-xs">
                  Planos
                </TabsTrigger>
                <TabsTrigger value="metas" className="h-9 rounded-full px-3.5 text-xs">
                  Metas do paciente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="planos" className="mt-0 space-y-4">
                {mealPlansLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : mealPlans.length === 0 ? (
                  renderEmptyState("Nenhum plano encontrado", "Este paciente ainda não possui planos alimentares vinculados.")
                ) : (
                  <div className="space-y-3">
                    {mealPlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => navigate(`/planos?planId=${plan.id}`)}
                        className="group surface-lift-hover w-full rounded-xl border border-border/60 bg-card p-4 text-left"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">{plan.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Criado em {format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                          </div>
                          <div className="flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                            <span>Plano alimentar</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                        {plan.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{plan.notes}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="metas" className="mt-0 space-y-4">
                {goalsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : goals.length === 0 ? (
                  renderEmptyState("Nenhuma meta encontrada", "Este paciente ainda não possui metas cadastradas.")
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => navigate(`/metas?patientId=${patient.id}&goalId=${goal.id}`)}
                        className="group surface-lift-hover w-full rounded-xl border border-border/60 bg-card p-4 text-left"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary">{goal.title}</p>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${goalCategoryColors[goal.category]}`}>
                                {goalCategoryLabels[goal.category] || goal.category}
                              </span>
                            </div>
                            {goal.description && <p className="mt-1 text-xs text-muted-foreground">{goal.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                            <span>{goalStatusLabels[goal.status] || goal.status}</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                          <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide">Atual</p>
                            <p className="mt-1 font-medium text-foreground">
                              {goal.current_value || "—"}
                              {goal.unit ? ` ${goal.unit}` : ""}
                            </p>
                          </div>
                          <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide">Meta</p>
                            <p className="mt-1 font-medium text-foreground">
                              {goal.target_value || "—"}
                              {goal.unit ? ` ${goal.unit}` : ""}
                            </p>
                          </div>
                          <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide">Prazo</p>
                            <p className="mt-1 font-medium text-foreground">
                              {goal.deadline ? format(new Date(`${goal.deadline}T12:00:00`), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                            </p>
                          </div>
                          <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide">Criada em</p>
                            <p className="mt-1 font-medium text-foreground">{format(new Date(goal.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Card className="card-surface-lg overflow-hidden">
              <CardHeader className="space-y-1.5 pb-4">
                <CardTitle className="text-base">Resumo rápido</CardTitle>
                <p className="text-sm text-muted-foreground">Contato, status e indicadores essenciais do paciente.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="card-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                    {patient.auth_user_id ? (
                      <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-border/60 bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Pendente
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-0.5">
                    <InfoRow icon={Mail} label="Email" value={patient.email} />
                    <InfoRow icon={Phone} label="Telefone" value={patient.phone} />
                    <InfoRow icon={MapPin} label="Endereço" value={patient.address} />
                    <InfoRow icon={Calendar} label="Nascimento" value={patient.birthdate ? new Date(`${patient.birthdate}T12:00:00`).toLocaleDateString("pt-BR") : null} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <MetricTile
                    label="Planos alimentares"
                    value={`${mealPlans.length}`}
                    hint={latestMealPlan ? latestMealPlan.title : "Nenhum plano criado ainda"}
                  />
                  <MetricTile
                    label="Metas e anamnese"
                    value={`${goals.length} metas`}
                    hint={hasAnamnesisData ? "Anamnese preenchida" : "Anamnese pendente"}
                  />
                </div>

                {patient.notes && (
                  <div className="card-surface p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Observações</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{truncateText(patient.notes, 180)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-surface-lg overflow-hidden">
              <CardHeader className="space-y-1.5 pb-4">
                <CardTitle className="text-base">Plano em destaque</CardTitle>
                <p className="text-sm text-muted-foreground">Resumo do plano alimentar mais recente vinculado ao paciente.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="space-y-3">
                    <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                      Último plano
                    </Badge>

                    {latestMealPlan ? (
                      <>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{latestMealPlan.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Criado em {format(new Date(latestMealPlan.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>

                        {latestMealPlan.notes ? (
                          <p className="text-sm leading-6 text-foreground/80">{truncateText(latestMealPlan.notes, 180)}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Este plano não possui observações adicionais.</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Ainda não há planos alimentares vinculados a este paciente.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <MetricTile
                    label="IMC estimado"
                    value={patientBmi !== null ? formatCompactNumber(patientBmi) : "—"}
                    hint={patientBmi !== null ? "A partir de peso e altura cadastrados" : "Preencha peso e altura"}
                  />
                  <MetricTile
                    label="Cadastro"
                    value={detailSummaryDate || "—"}
                    hint={patient.auth_user_id ? "Paciente com acesso ao app" : "Paciente sem acesso ao app"}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}

      <Dialog open={credDialog.open} onOpenChange={(o) => !o && setCredDialog((prev) => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Credenciais do Paciente</DialogTitle>
            <DialogDescription className="text-xs">Envie estas credenciais para {credDialog.patient?.name}.</DialogDescription>
          </DialogHeader>
          {credDialog.loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted/50 p-3 font-mono text-sm">
                <p>
                  <span className="text-muted-foreground">Email:</span> {credDialog.patient?.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Senha:</span> {credDialog.password}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 rounded-full text-xs text-primary" onClick={handleCopyCredentials}>
                  {credDialog.copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {credDialog.copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialog.open} onOpenChange={(o) => !o && setRemoveDialog({ open: false, patient: null, loading: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso do paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o acesso de <strong>{removeDialog.patient?.name}</strong>? A conta de login será deletada permanentemente e o paciente não poderá mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeDialog.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAccess} disabled={removeDialog.loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {removeDialog.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
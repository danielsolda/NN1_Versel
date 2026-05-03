import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Loader2, KeyRound, Copy, Check, Trash2, Scale, Ruler, Target, AlertTriangle, HeartPulse, MapPin, Phone, Mail, Calendar, FileText, User, Users, X, Save } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

function AnamnesisField({ label, field, value, onChange, rows = 2 }: {
  label: string; field: string; value: Record<string, string>;
  onChange: React.Dispatch<React.SetStateAction<Record<string, string>>>; rows?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Textarea
        value={value[field] || ""}
        onChange={(e) => onChange((prev) => ({ ...prev, [field]: e.target.value }))}
        rows={rows}
        className="text-sm border-border/60 shadow-none focus-visible:ring-1 resize-none"
        placeholder={label + "..."}
      />
    </div>
  );
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

function getAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function Pacientes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "", birthdate: "", notes: "" });
  const [credDialog, setCredDialog] = useState<{ open: boolean; patient: Patient | null; password: string | null; loading: boolean; copied: boolean }>({
    open: false, patient: null, password: null, loading: false, copied: false,
  });
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; patient: Patient | null; loading: boolean }>({
    open: false, patient: null, loading: false,
  });
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab] = useState("dados");
  const [anamnesis, setAnamnesis] = useState<Record<string, string>>({});
  const [anamnesisLoading, setAnamnesisLoading] = useState(false);
  const [anamnesisSaving, setAnamnesisSaving] = useState(false);

  // Load anamnesis when patient detail opens
  useEffect(() => {
    if (!detailPatient || !user) {
      setAnamnesis({});
      setDetailTab("dados");
      return;
    }
    const loadAnamnesis = async () => {
      setAnamnesisLoading(true);
      const { data } = await supabase
        .from("patient_anamnesis")
        .select("*")
        .eq("patient_id", detailPatient.id)
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
        setAnamnesis({});
      }
      setAnamnesisLoading(false);
    };
    loadAnamnesis();
  }, [detailPatient, user]);

  const saveAnamnesis = async () => {
    if (!detailPatient || !user) return;
    setAnamnesisSaving(true);
    const payload = {
      patient_id: detailPatient.id,
      nutritionist_id: user.id,
      ...anamnesis,
    };
    const { error } = await supabase
      .from("patient_anamnesis")
      .upsert(payload, { onConflict: "patient_id" });
    if (error) {
      toast.error("Erro ao salvar anamnese");
    } else {
      toast.success("Anamnese salva!");
    }
    setAnamnesisSaving(false);
  };

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("name");
      if (error) throw error;
      return (data as any[]).map((p) => ({ ...p, address: p.address ?? null }));
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("patients").insert({
        nutritionist_id: user!.id,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        cpf: form.cpf || null,
        birthdate: form.birthdate || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente cadastrado!");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", cpf: "", birthdate: "", notes: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q);
  });

  const handleGenerateAccess = async (patient: Patient) => {
    if (!patient.email) {
      toast.error("Paciente precisa ter um email cadastrado.");
      return;
    }
    if (patient.auth_user_id) {
      toast.error("Este paciente já possui acesso ao sistema.");
      return;
    }
    setCredDialog({ open: true, patient, password: null, loading: true, copied: false });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-patient-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            patient_id: patient.id,
            email: patient.email,
            name: patient.name,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setCredDialog((prev) => ({ ...prev, password: result.password, loading: false }));
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Acesso criado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar acesso");
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
    const patient = removeDialog.patient;
    if (!patient) return;
    setRemoveDialog((prev) => ({ ...prev, loading: true }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remove-patient-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ patient_id: patient.id }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Acesso removido com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover acesso");
    } finally {
      setRemoveDialog({ open: false, patient: null, loading: false });
    }
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2.5 py-1.5">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground break-words">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="page-title">Pacientes</h1>
          </div>
          <p className="page-lead">Gerencie seus pacientes e fichas clínicas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-[26px]">
              <Plus className="h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl border-border/60 shadow-none p-0 gap-0">
            <DialogHeader className="px-6 pt-5 pb-1">
              <DialogTitle className="text-base font-semibold text-foreground">Novo Paciente</DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground">Preencha os dados do paciente.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              className="px-6 pb-5 pt-3 space-y-3.5"
            >
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="editable-field h-8 text-sm" placeholder="Nome do paciente" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1" placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Data de Nascimento</Label>
                  <Input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="text-sm border-border/60 shadow-none focus-visible:ring-1 resize-none" placeholder="Notas adicionais..." />
              </div>
              <div className="flex justify-end pt-2 border-t border-border/40">
                <Button type="submit" disabled={createMutation.isPending} size="sm" className="h-8 text-xs font-medium px-4">
                  {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 h-px w-full bg-border/60" />

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou telefone..."
          className="pl-10 pr-4 text-sm rounded-[26px]"
        />
      </div>

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-[26px] border border-border/60 bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado ainda."}
          </p>
          {!search && <p className="mt-1 text-xs text-muted-foreground">Clique em "Novo Paciente" para começar.</p>}
        </div>
      ) : (
        <div className="mt-6 border border-border/60 rounded-[26px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-primary">
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-foreground uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-foreground uppercase tracking-wider">Idade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-foreground uppercase tracking-wider">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-foreground uppercase tracking-wider">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-border/60 bg-card hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => navigate(`/pacientes/${p.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0 border border-border/60 bg-background rounded-[14px]">
                        <AvatarFallback className="bg-surface-hover text-[10px] font-semibold text-surface-hover-foreground">
                          {getInitials(p.name) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{getAge(p.birthdate) ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {[p.email, p.phone].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Credentials Dialog */}
      <Dialog open={credDialog.open} onOpenChange={(o) => !o && setCredDialog((prev) => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Credenciais do Paciente</DialogTitle>
            <DialogDescription className="text-xs">
              Envie estas credenciais para {credDialog.patient?.name}.
            </DialogDescription>
          </DialogHeader>
          {credDialog.loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted/50 p-3 font-mono text-sm">
                <p><span className="text-muted-foreground">Email:</span> {credDialog.patient?.email}</p>
                <p><span className="text-muted-foreground">Senha:</span> {credDialog.password}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={handleCopyCredentials}>
                  {credDialog.copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {credDialog.copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Access Confirmation */}
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
            <AlertDialogAction
              onClick={handleRemoveAccess}
              disabled={removeDialog.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeDialog.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

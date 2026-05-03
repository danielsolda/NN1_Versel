import { useEffect, useState } from "react";
import { Plus, Target, CheckCircle2, Loader2, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import HabitTrackingGrid from "@/components/metas/HabitTrackingGrid";
import { useLocation, useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  patient_id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  target_value: string | null;
  current_value: string | null;
  unit: string | null;
  deadline: string | null;
  created_at: string;
  completed_at: string | null;
  patient_name?: string;
}

const categoryLabels: Record<string, string> = {
  peso: "Peso",
  medida: "Medida",
  habito: "Hábito",
  nutricional: "Nutricional",
  outro: "Outro",
};

const categoryColors: Record<string, string> = {
  peso: "border-transparent bg-palette-blue text-white dark:bg-palette-blue dark:text-white",
  medida: "border-transparent bg-palette-purple text-white dark:bg-palette-purple dark:text-white",
  habito: "border-transparent bg-palette-green text-white dark:bg-palette-green dark:text-white",
  nutricional: "border-transparent bg-palette-orange text-white dark:bg-palette-orange dark:text-white",
  outro: "border-transparent bg-palette-slate text-white dark:bg-palette-slate dark:text-white",
};

const statusLabels: Record<string, string> = {
  ativa: "Ativa",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const emptyForm = {
  patient_id: "",
  title: "",
  description: "",
  category: "outro" as string,
  target_value: "",
  current_value: "",
  unit: "",
  deadline: "",
};

export default function Metas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const urlParams = new URLSearchParams(location.search);
  const patientIdFromUrl = urlParams.get("patientId");
  const goalIdFromUrl = urlParams.get("goalId");
  const [filterPatient, setFilterPatient] = useState(patientIdFromUrl || "all");
  const [filterStatus, setFilterStatus] = useState("ativa");

  useEffect(() => {
    if (patientIdFromUrl) {
      setFilterPatient(patientIdFromUrl);
    }
  }, [patientIdFromUrl]);

  // Fetch patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients-for-goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, name")
        .eq("nutritionist_id", user!.id)
        .order("name");
      return (data || []) as Patient[];
    },
    enabled: !!user,
  });

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["patient-goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("patient_goals")
        .select("*")
        .eq("nutritionist_id", user!.id)
        .order("created_at", { ascending: false });

      const goalsData = (data || []) as any[];
      // Map patient names
      const patientsMap = new Map(patients.map((p) => [p.id, p.name]));
      return goalsData.map((g) => ({ ...g, patient_name: patientsMap.get(g.patient_id) || "Paciente" }));
    },
    enabled: !!user && patients.length > 0,
  });

  // Create/update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        patient_id: form.patient_id,
        nutritionist_id: user!.id,
        title: form.title,
        description: form.description || null,
        category: form.category,
        target_value: form.target_value || null,
        current_value: form.current_value || null,
        unit: form.unit || null,
        deadline: form.deadline || null,
      };
      if (editingGoal) {
        const { error } = await supabase
          .from("patient_goals")
          .update(payload as any)
          .eq("id", editingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("patient_goals")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-goals"] });
      toast.success(editingGoal ? "Meta atualizada!" : "Meta criada!");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao salvar meta."),
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "concluida") update.completed_at = new Date().toISOString();
      else update.completed_at = null;
      const { error } = await supabase.from("patient_goals").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-goals"] });
      toast.success("Status atualizado!");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patient_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-goals"] });
      toast.success("Meta removida.");
      setDeleteId(null);
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
    setForm(emptyForm);
    if (goalIdFromUrl || patientIdFromUrl) {
      const nextParams = new URLSearchParams();
      if (patientIdFromUrl) nextParams.set("patientId", patientIdFromUrl);
      navigate({ pathname: "/metas", search: nextParams.toString() ? `?${nextParams.toString()}` : "" }, { replace: true });
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      patient_id: goal.patient_id,
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      target_value: goal.target_value || "",
      current_value: goal.current_value || "",
      unit: goal.unit || "",
      deadline: goal.deadline || "",
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!goalIdFromUrl || goals.length === 0) return;
    const goalToOpen = goals.find((goal) => goal.id === goalIdFromUrl);
    if (goalToOpen) {
      handleEdit(goalToOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalIdFromUrl, goals]);

  const filtered = goals.filter((g) => {
    if (filterPatient !== "all" && g.patient_id !== filterPatient) return false;
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3"><Target className="h-6 w-6 text-primary" /><h1 className="page-title">Metas</h1></div>
          <p className="page-lead">Defina e acompanhe metas dos seus pacientes.</p>
        </div>
        <Button size="sm" className="gap-1.5 rounded-[26px]" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nova Meta
        </Button>
      </div>

      <div className="mt-4 h-px w-full bg-border/60" />

      <Tabs defaultValue="gerenciar" className="mt-5">
        <TabsList className="h-9">
          <TabsTrigger value="gerenciar" className="text-xs">Gerenciar</TabsTrigger>
          <TabsTrigger value="acompanhamento" className="text-xs">Acompanhamento</TabsTrigger>
        </TabsList>

        <TabsContent value="gerenciar" className="mt-4">

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Select value={filterPatient} onValueChange={setFilterPatient}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="Paciente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pacientes</SelectItem>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="concluida">Concluídas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border bg-card p-12 text-center">
          <Target className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma meta encontrada.</p>
          <p className="mt-1 text-xs text-muted-foreground">Crie metas para acompanhar o progresso dos seus pacientes.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((goal) => (
            <div
              key={goal.id}
              className={`group rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-surface-hover-border hover:bg-surface-hover ${
                goal.status === "concluida" ? "border-palette-green/20 dark:border-palette-green/30" :
                goal.status === "cancelada" ? "border-border opacity-60" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-semibold text-foreground transition-colors group-hover:text-primary ${goal.status === "concluida" ? "line-through" : ""}`}>
                      {goal.title}
                    </h3>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColors[goal.category]}`}>
                      {categoryLabels[goal.category]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{goal.patient_name}</p>
                  {goal.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{goal.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {goal.target_value && (
                      <span>Meta: <strong className="text-foreground">{goal.target_value}{goal.unit ? ` ${goal.unit}` : ""}</strong></span>
                    )}
                    {goal.current_value && (
                      <span>Atual: <strong className="text-foreground">{goal.current_value}{goal.unit ? ` ${goal.unit}` : ""}</strong></span>
                    )}
                    {goal.deadline && (
                      <span>Prazo: {format(new Date(goal.deadline + "T00:00:00"), "dd/MM/yyyy")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {goal.status === "ativa" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-palette-green transition-colors hover:text-palette-green hover:bg-surface-hover"
                      title="Concluir"
                      onClick={() => statusMutation.mutate({ id: goal.id, status: "concluida" })}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  {goal.status === "concluida" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground transition-colors hover:text-primary hover:bg-surface-hover"
                      title="Reativar"
                      onClick={() => statusMutation.mutate({ id: goal.id, status: "ativa" })}
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground transition-colors hover:text-primary hover:bg-surface-hover"
                    onClick={() => handleEdit(goal)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(goal.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="acompanhamento" className="mt-4">
          <HabitTrackingGrid patients={patients} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Paciente</Label>
              <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Atingir 70kg"
                className="editable-field h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peso">Peso</SelectItem>
                  <SelectItem value="medida">Medida</SelectItem>
                  <SelectItem value="habito">Hábito</SelectItem>
                  <SelectItem value="nutricional">Nutricional</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valor meta</Label>
                <Input
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                  placeholder="70"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valor atual</Label>
                <Input
                  value={form.current_value}
                  onChange={(e) => setForm({ ...form, current_value: e.target.value })}
                  placeholder="75"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Unidade</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prazo</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes adicionais da meta..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={!form.patient_id || !form.title || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingGoal ? "Salvar" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover meta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

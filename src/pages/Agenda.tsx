import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Loader2, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PatientSearch from "@/components/agenda/PatientSearch";
import ColorPicker from "@/components/agenda/ColorPicker";
import WeeklyCalendarGrid from "@/components/agenda/WeeklyCalendarGrid";
import MobileDayView from "@/components/agenda/MobileDayView";

interface Appointment {
  id: string;
  patient_id: string | null;
  date: string;
  time_start: string;
  time_end: string;
  status: string;
  color: string;
  notes: string | null;
  patients?: { name: string } | null;
}

interface Patient {
  id: string;
  name: string;
}

const emptyForm = { patient_id: "", date: "", time_start: "08:00", time_end: "09:00", notes: "", color: "blue" };


export default function Agenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["appointments", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const start = format(weekStart, "yyyy-MM-dd");
      const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(name)")
        .gte("date", start)
        .lte("date", end)
        .order("time_start");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Global pending appointments query (all dates)
  const { data: allPendingAppts = [] } = useQuery<Appointment[]>({
    queryKey: ["all-pending-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(name)")
        .eq("status", "pendente")
        .order("date")
        .order("time_start");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingAppointment) {
        const { error } = await supabase.from("appointments").update({
          patient_id: form.patient_id || null,
          date: form.date,
          time_start: form.time_start,
          time_end: form.time_end,
          notes: form.notes || null,
          color: form.color,
        }).eq("id", editingAppointment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointments").insert({
          nutritionist_id: user!.id,
          patient_id: form.patient_id || null,
          date: form.date,
          time_start: form.time_start,
          time_end: form.time_end,
          notes: form.notes || null,
          color: form.color,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["all-pending-appointments"] });
      toast.success(editingAppointment ? "Consulta atualizada!" : "Consulta agendada!");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["all-pending-appointments"] });
      toast.success("Consulta removida!");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, date, time_start, time_end }: { id: string; date: string; time_start: string; time_end: string }) => {
      const { error } = await supabase.from("appointments").update({ date, time_start, time_end }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Consulta movida!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handlePendingAction = async (id: string, newStatus: string) => {
    await supabase.from("appointments").update({ status: newStatus }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["all-pending-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["pending-appointments"] });
    toast.success(newStatus === "agendada" ? "Consulta confirmada!" : "Solicitação recusada.");
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingAppointment(null);
    setForm(emptyForm);
  };

  const openNewFromSlot = (day: Date, hour: number) => {
    setEditingAppointment(null);
    setForm({
      ...emptyForm,
      date: format(day, "yyyy-MM-dd"),
      time_start: `${String(hour).padStart(2, "0")}:00`,
      time_end: `${String(hour + 1).padStart(2, "0")}:00`,
    });
    setOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    setEditingAppointment(appt);
    setForm({
      patient_id: appt.patient_id || "",
      date: appt.date,
      time_start: appt.time_start.slice(0, 5),
      time_end: appt.time_end.slice(0, 5),
      notes: appt.notes || "",
      color: appt.color || "blue",
    });
    setOpen(true);
  };

  const handleAppointmentDrop = (id: string, date: string, time_start: string, time_end: string) => {
    moveMutation.mutate({ id, date, time_start, time_end });
  };

  const pendingPanel = (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <AlertCircle className="h-4 w-4 text-palette-amber" />
        <h3 className="text-sm font-semibold text-foreground">
          Solicitações Pendentes
        </h3>
        {allPendingAppts.length > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-palette-amber px-1.5 text-[11px] font-bold text-background">
            {allPendingAppts.length}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {allPendingAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {allPendingAppts.map(appt => (
              <div key={appt.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{appt.patients?.name || "Paciente"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{format(new Date(appt.date + "T12:00:00"), "dd/MM", { locale: ptBR })} • {appt.time_start.slice(0, 5)} - {appt.time_end.slice(0, 5)}</span>
                    </div>
                    {appt.notes && (
                      <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2 italic">"{appt.notes}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 flex-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handlePendingAction(appt.id, "cancelada")}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => handlePendingAction(appt.id, "agendada")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Confirmar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-shell mx-auto max-w-7xl flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3"><Calendar className="h-6 w-6 text-primary" /><h1 className="page-title">Agenda</h1></div>
          <p className="page-lead">Visualize e gerencie suas consultas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 rounded-[26px]" onClick={() => { setEditingAppointment(null); setForm(emptyForm); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Consulta</span>
          </Button>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-border/60" />

      {/* Main layout: calendar + pending panel side by side */}
      <div className="mt-5 flex flex-1 gap-4 min-h-0">
        {/* Calendar area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Week navigation */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="group rounded-lg p-1 transition-colors hover:bg-surface-hover hover:text-primary">
              <ChevronLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {format(weekStart, "dd MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="group rounded-lg p-1 transition-colors hover:bg-surface-hover hover:text-primary">
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
          </div>

          {isMobile ? (
            <>
              {/* On mobile, show pending above calendar */}
              {allPendingAppts.length > 0 && <div className="mb-4">{pendingPanel}</div>}
              <MobileDayView
                days={days}
                selectedDayIndex={selectedDayIndex}
                onDayChange={setSelectedDayIndex}
                appointments={appointments}
                onSlotClick={openNewFromSlot}
                onAppointmentClick={openEdit}
              />
            </>
          ) : (
            <WeeklyCalendarGrid
              days={days}
              appointments={appointments}
              onSlotClick={openNewFromSlot}
              onAppointmentClick={openEdit}
              onAppointmentDrop={handleAppointmentDrop}
            />
          )}
        </div>

        {/* Pending panel - desktop only, fixed width */}
        {!isMobile && (
          <div className="w-72 shrink-0 hidden lg:block lg:mt-4">
            {pendingPanel}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-xl border-border/60 shadow-none p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-1">
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingAppointment ? "Editar Consulta" : "Nova Consulta"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              {editingAppointment ? "Altere os dados da consulta." : "Agende uma consulta para um paciente."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="px-6 pb-5 pt-3 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Paciente</Label>
              <PatientSearch patients={patients} value={form.patient_id} onChange={(v) => setForm({ ...form, patient_id: v })} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Data *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Cor</Label>
                <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Início *</Label>
                <Input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} required className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">Fim *</Label>
                <Input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} required className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="text-sm border-border/60 shadow-none focus-visible:ring-1 resize-none" placeholder="Notas adicionais..." />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              {editingAppointment ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive gap-1">
                      <Trash2 className="h-3.5 w-3.5" />
                      Apagar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar consulta?</AlertDialogTitle>
                      <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(editingAppointment.id)}>Apagar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : <span />}
              <Button type="submit" disabled={saveMutation.isPending} size="sm" className="h-8 text-xs font-medium px-4">
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingAppointment ? "Salvar" : "Agendar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
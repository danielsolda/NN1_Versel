import { useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function PatientAgendamento() {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !time) return;

    setSaving(true);
    try {
      // Get patient record to find nutritionist_id
      const { data: patient } = await supabase
        .from("patients")
        .select("id, nutritionist_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!patient) {
        toast.error("Perfil de paciente não encontrado.");
        return;
      }

      const [h, m] = time.split(":").map(Number);
      const endH = Math.min(h + 1, 18);
      const timeEnd = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      const { error } = await supabase.from("appointments").insert({
        nutritionist_id: patient.nutritionist_id,
        patient_id: patient.id,
        date,
        time_start: time,
        time_end: timeEnd,
        status: "pendente",
        notes: notes || null,
        color: "blue",
      });

      if (error) throw error;

      toast.success("Solicitação de agendamento enviada!");
      setSubmitted(true);
    } catch (err: any) {
      toast.error("Erro ao enviar solicitação: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-shell mx-auto max-w-7xl">
        <div className="mx-auto max-w-lg">
          <div className="page-header">
            <h1 className="page-title">Solicitar Agendamento</h1>
          </div>
          <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center">
            <CalendarPlus className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Solicitação enviada!</p>
            <p className="mt-1 text-xs text-muted-foreground">Sua nutricionista será notificada e confirmará o agendamento.</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setDate(""); setTime(""); setNotes(""); }}>
              Nova solicitação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="mx-auto max-w-lg">
        <div className="page-header">
          <h1 className="page-title">Solicitar Agendamento</h1>
          <p className="page-lead">Envie uma solicitação de consulta.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Data desejada</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Horário preferido</Label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Selecione um horário</option>
                {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma observação para a nutricionista..." className="text-sm" rows={3} />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Enviar Solicitação
          </Button>
        </form>
      </div>
    </div>
  );
}

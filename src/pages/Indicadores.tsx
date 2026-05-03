import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, HelpCircle, AlertTriangle, CheckCircle2, Bell, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfWeek, endOfWeek, addWeeks, isWithinInterval, differenceInYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthdate: string | null;
  created_at: string;
}

interface Appointment {
  id: string;
  date: string;
  time_start: string;
  time_end: string;
  status: string;
  patient_id: string | null;
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function StatCard({ label, value, tooltip }: { label: string; value: string | number; tooltip: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <InfoTip text={tooltip} />
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function Indicadores() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Period filter
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Agenda distribution week nav
  const [agendaWeekOffset, setAgendaWeekOffset] = useState(0);

  // Birthday period
  const [birthdayPeriod, setBirthdayPeriod] = useState<"semanal" | "mensal">("semanal");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [pRes, aRes] = await Promise.all([
      supabase.from("patients").select("*").eq("nutritionist_id", user!.id),
      supabase.from("appointments").select("*").eq("nutritionist_id", user!.id),
    ]);
    if (pRes.data) setPatients(pRes.data);
    if (aRes.data) setAppointments(aRes.data as any);
    setLoading(false);
  };

  // Filtered appointments by period
  const filteredAppts = useMemo(() => {
    return appointments.filter((a) => a.date >= dateFrom && a.date <= dateTo);
  }, [appointments, dateFrom, dateTo]);

  // Global indicators
  const activePatients = patients.length;
  const completedAppts = appointments.filter((a) => a.status === "realizada").length;
  const totalAppts = appointments.length;
  const attendanceRate = totalAppts > 0 ? ((completedAppts / totalAppts) * 100).toFixed(1) : "0";
  
  // Patients with more than 1 appointment
  const returningPatients = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((a) => {
      if (a.patient_id) counts[a.patient_id] = (counts[a.patient_id] || 0) + 1;
    });
    return Object.values(counts).filter((c) => c > 1).length;
  }, [appointments]);
  const fidelizationRate = activePatients > 0 ? ((returningPatients / activePatients) * 100).toFixed(2) : "0";

  // Period indicators
  const periodCompleted = filteredAppts.filter((a) => a.status === "realizada").length;
  const periodCancelled = filteredAppts.filter((a) => a.status === "cancelada").length;
  const periodRescheduled = filteredAppts.filter((a) => a.status === "remarcada").length;
  const periodTotal = filteredAppts.length;
  const periodPresenceRate = periodTotal > 0 ? ((periodCompleted / periodTotal) * 100).toFixed(0) : "0";
  const periodCancelRate = periodTotal > 0 ? ((periodCancelled / periodTotal) * 100).toFixed(0) : "0";
  const periodRescheduleRate = periodTotal > 0 ? ((periodRescheduled / periodTotal) * 100).toFixed(0) : "0";

  // Unique patients attended in period
  const periodPatientsAttended = new Set(filteredAppts.filter((a) => a.patient_id).map((a) => a.patient_id)).size;

  // New patients in period
  const newPatientsInPeriod = patients.filter((p) => p.created_at >= dateFrom && p.created_at <= dateTo + "T23:59:59").length;

  // Agenda distribution (weekly chart)
  const agendaWeekStart = startOfWeek(addWeeks(new Date(), agendaWeekOffset), { weekStartsOn: 1 });
  const agendaWeekEnd = endOfWeek(addWeeks(new Date(), agendaWeekOffset), { weekStartsOn: 1 });

  const agendaChartData = useMemo(() => {
    const days: { name: string; date: string; confirmado: number; aConfirmar: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(agendaWeekStart);
      d.setDate(d.getDate() + i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayAppts = appointments.filter((a) => a.date === dateStr);
      days.push({
        name: format(d, "EEE dd/MM", { locale: ptBR }),
        date: dateStr,
        confirmado: dayAppts.filter((a) => a.status === "confirmada" || a.status === "realizada").length,
        aConfirmar: dayAppts.filter((a) => a.status === "agendada").length,
      });
    }
    return days;
  }, [appointments, agendaWeekOffset]);

  // Birthdays
  const birthdayList = useMemo(() => {
    const now = new Date();
    const start = birthdayPeriod === "semanal" ? startOfWeek(now, { weekStartsOn: 1 }) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = birthdayPeriod === "semanal" ? endOfWeek(now, { weekStartsOn: 1 }) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return patients.filter((p) => {
      if (!p.birthdate) return false;
      const bd = parseISO(p.birthdate);
      const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      return isWithinInterval(thisYearBd, { start, end });
    }).map((p) => {
      const bd = parseISO(p.birthdate!);
      const age = differenceInYears(now, bd);
      return { ...p, age, birthdateFormatted: format(bd, "dd/MM/yyyy") };
    });
  }, [patients, birthdayPeriod]);

  // Patient movement chart (last 30 days)
  const movementData = useMemo(() => {
    const data: { name: string; novos: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, "yyyy-MM-dd");
      const count = patients.filter((p) => p.created_at.startsWith(dateStr)).length;
      data.push({ name: format(d, "dd/MM"), novos: count });
    }
    return data;
  }, [patients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="page-header">
        <div className="flex items-center gap-3"><BarChart3 className="h-6 w-6 text-primary" /><h1 className="page-title">Indicadores</h1></div>
        <p className="page-lead">Métricas e desempenho do consultório.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Engajamento de pacientes */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Engajamento de pacientes</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Bell className="h-4 w-4 text-destructive" />
                  <InfoTip text="Pacientes sem consulta há mais de 30 dias" />
                </div>
                <p className="text-2xl font-bold text-destructive">
                  {patients.filter((p) => {
                    const lastAppt = appointments.filter((a) => a.patient_id === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
                    return !lastAppt || lastAppt.date < format(subDays(new Date(), 30), "yyyy-MM-dd");
                  }).length}
                </p>
                <p className="text-[10px] text-destructive/80 mt-1">Surpreenda! Ligue para o paciente</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertTriangle className="h-4 w-4 text-palette-amber" />
                  <InfoTip text="Pacientes sem consulta há 15-30 dias" />
                </div>
                <p className="text-2xl font-bold text-palette-amber">
                  {patients.filter((p) => {
                    const lastAppt = appointments.filter((a) => a.patient_id === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
                    if (!lastAppt) return false;
                    const d30 = format(subDays(new Date(), 30), "yyyy-MM-dd");
                    const d15 = format(subDays(new Date(), 15), "yyyy-MM-dd");
                    return lastAppt.date >= d30 && lastAppt.date < d15;
                  }).length}
                </p>
                <p className="mt-1 text-[10px] text-palette-amber">Confira! Veja se está tudo bem</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-palette-green" />
                  <InfoTip text="Pacientes com consulta nos últimos 15 dias" />
                </div>
                <p className="text-2xl font-bold text-palette-green">
                  {patients.filter((p) => {
                    const lastAppt = appointments.filter((a) => a.patient_id === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
                    if (!lastAppt) return false;
                    return lastAppt.date >= format(subDays(new Date(), 15), "yyyy-MM-dd");
                  }).length}
                </p>
                <p className="mt-1 text-[10px] text-palette-green">Engajamento de milhões!</p>
              </div>
            </div>
          </div>

          {/* Indicadores por Período */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Indicadores por Período</h2>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">De:</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm w-40" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Até:</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm w-40" />
              </div>
              <Button size="sm" className="h-8 text-xs">Filtrar</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Taxa de Desmarcação" value={`${periodCancelRate} %`} tooltip="Percentual de consultas canceladas no período" />
              <StatCard label="Taxa de Remarcação" value={`${periodRescheduleRate} %`} tooltip="Percentual de consultas remarcadas no período" />
              <StatCard label="Taxa de Presença" value={`${periodPresenceRate} %`} tooltip="Percentual de consultas realizadas no período" />
              <StatCard label="Taxa de Ocupação da Agenda" value={`${periodTotal > 0 ? ((periodTotal / (7 * 8)) * 100).toFixed(0) : 0} %`} tooltip="Ocupação com base em 8h/dia nos 7 dias" />
              <StatCard label="Consultas Realizadas" value={periodCompleted} tooltip="Total de consultas com status 'realizada'" />
              <StatCard label="Pacientes Atendidos" value={periodPatientsAttended} tooltip="Pacientes únicos atendidos no período" />
              <StatCard label="Novos Pacientes" value={newPatientsInPeriod} tooltip="Pacientes cadastrados no período" />
            </div>
          </div>

          {/* Movimentação de pacientes */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Movimentação de pacientes</h2>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Line type="monotone" dataKey="novos" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Indicadores Globais */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Indicadores Globais</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Pacientes Ativos" value={activePatients} tooltip="Total de pacientes cadastrados" />
              <StatCard label="Taxa de Alta Nutricional" value="0 %" tooltip="Pacientes que receberam alta" />
              <div className="col-span-2">
                <StatCard label="Taxa de Fidelização" value={`${fidelizationRate} %`} tooltip="Pacientes com mais de uma consulta" />
              </div>
            </div>
          </div>

          {/* Distribuição da agenda */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Distribuição da agenda</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agendaChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} label={{ value: "Horas", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="aConfirmar" name="A confirmar" fill="hsl(var(--palette-amber))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="confirmado" name="Confirmado" fill="hsl(var(--palette-green))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-end gap-1 mt-3">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setAgendaWeekOffset((o) => o - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setAgendaWeekOffset((o) => o + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Lista de aniversariantes */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Lista de aniversariantes</h2>
              <select
                value={birthdayPeriod}
                onChange={(e) => setBirthdayPeriod(e.target.value as any)}
                className="h-8 rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
            {birthdayList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversariante neste período.</p>
            ) : (
              <div className="space-y-3">
                {birthdayList.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}, {p.age}</p>
                      {p.phone && <p className="text-xs text-muted-foreground">📱 {p.phone}</p>}
                      {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{p.birthdateFormatted}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

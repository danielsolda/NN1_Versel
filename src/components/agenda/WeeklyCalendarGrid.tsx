import { isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getColorClasses } from "./ColorPicker";
import { useRef, useState, useCallback } from "react";

const HOUR_START = 7;
const HOUR_END = 18;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
const ROW_HEIGHT = 48; // px per hour

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

interface WeeklyCalendarGridProps {
  days: Date[];
  appointments: Appointment[];
  onSlotClick: (day: Date, hour: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onAppointmentDrop: (appointmentId: string, newDate: string, newTimeStart: string, newTimeEnd: string) => void;
}

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function formatTime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function WeeklyCalendarGrid({
  days,
  appointments,
  onSlotClick,
  onAppointmentClick,
  onAppointmentDrop,
}: WeeklyCalendarGridProps) {
  const [dragOverInfo, setDragOverInfo] = useState<{ dayIdx: number; hour: number } | null>(null);
  const dragDataRef = useRef<{ id: string; duration: number } | null>(null);

  const getAppointmentsForDay = useCallback(
    (day: Date) =>
      appointments.filter((a) => isSameDay(new Date(a.date + "T00:00:00"), day)),
    [appointments]
  );

  const handleDragStart = (e: React.DragEvent, appt: Appointment) => {
    const duration = parseTime(appt.time_end) - parseTime(appt.time_start);
    dragDataRef.current = { id: appt.id, duration };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appt.id);
  };

  const handleDragOver = (e: React.DragEvent, dayIdx: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverInfo({ dayIdx, hour });
  };

  const handleDragLeave = () => setDragOverInfo(null);

  const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    setDragOverInfo(null);
    const drag = dragDataRef.current;
    if (!drag) return;
    const newDate = format(day, "yyyy-MM-dd");
    const newStart = formatTime(hour);
    const newEnd = formatTime(hour + drag.duration);
    onAppointmentDrop(drag.id, newDate, newStart, newEnd);
    dragDataRef.current = null;
  };

  return (
    <div className="mt-4 flex-1 overflow-auto rounded-lg border border-border">
      <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
        {/* Header row */}
        <div className="sticky top-0 z-10 border-b border-border bg-card" />
        {days.map((day) => (
          <div key={day.toISOString()} className="sticky top-0 z-10 border-b border-l border-border bg-card px-2 py-2 text-center">
            <p className="text-xs font-medium uppercase text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</p>
            <p className="text-lg font-semibold text-foreground">{format(day, "dd")}</p>
          </div>
        ))}

        {/* Time column + day columns with positioned appointments */}
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="border-b border-border px-2 text-right text-xs text-muted-foreground" style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}>
              {hour}:00
            </div>
          ))}
        </div>

        {days.map((day, dayIdx) => {
          const dayAppts = getAppointmentsForDay(day);
          return (
            <div key={day.toISOString()} className="relative border-l border-border">
              {/* Hour grid lines + click targets */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={`border-b border-border transition-colors cursor-pointer ${
                    dragOverInfo?.dayIdx === dayIdx && dragOverInfo?.hour === hour
                      ? "bg-accent/50"
                      : "hover:bg-accent/30"
                  }`}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onSlotClick(day, hour)}
                  onDragOver={(e) => handleDragOver(e, dayIdx, hour)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day, hour)}
                />
              ))}

              {/* Positioned appointments */}
              {dayAppts.map((appt) => {
                const start = parseTime(appt.time_start.slice(0, 5));
                const end = parseTime(appt.time_end.slice(0, 5));
                const top = (start - HOUR_START) * ROW_HEIGHT;
                const height = Math.max((end - start) * ROW_HEIGHT, 20);

                return (
                  <div
                    key={appt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, appt)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(appt);
                    }}
                    className={`absolute left-1 right-1 rounded-md px-2 py-1 text-xs cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity overflow-hidden ${appt.status === "pendente" ? "ring-2 ring-amber-400 ring-offset-1 animate-pulse" : ""} ${getColorClasses(appt.color)}`}
                    style={{ top, height }}
                    title={`${appt.time_start.slice(0, 5)} - ${appt.time_end.slice(0, 5)} ${appt.patients?.name || ""}`}
                  >
                    <span className="font-medium">{appt.time_start.slice(0, 5)}</span>{" "}
                    {appt.patients?.name || "Sem paciente"}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

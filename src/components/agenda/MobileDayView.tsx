import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getColorClasses } from "./ColorPicker";

const HOUR_START = 7;
const HOUR_END = 18;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
const ROW_HEIGHT = 56;

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

interface MobileDayViewProps {
  days: Date[];
  selectedDayIndex: number;
  onDayChange: (index: number) => void;
  appointments: Appointment[];
  onSlotClick: (day: Date, hour: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

export default function MobileDayView({
  days,
  selectedDayIndex,
  onDayChange,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: MobileDayViewProps) {
  const selectedDay = days[selectedDayIndex];
  const dayAppts = appointments.filter(
    (a) => a.date === format(selectedDay, "yyyy-MM-dd")
  );

  return (
    <div className="mt-4 flex-1 flex flex-col">
      {/* Day selector strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {days.map((day, idx) => (
          <button
            key={day.toISOString()}
            onClick={() => onDayChange(idx)}
            className={`flex flex-col items-center rounded-lg px-3 py-1.5 min-w-[48px] transition-colors ${
              idx === selectedDayIndex
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <span className="text-[10px] font-medium uppercase">
              {format(day, "EEE", { locale: ptBR })}
            </span>
            <span className="text-base font-semibold">{format(day, "dd")}</span>
          </button>
        ))}
      </div>

      {/* Day grid */}
      <div className="mt-2 flex-1 overflow-auto rounded-lg border border-border">
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-border cursor-pointer hover:bg-accent/30 transition-colors"
              style={{ height: ROW_HEIGHT }}
              onClick={() => onSlotClick(selectedDay, hour)}
            >
              <div className="w-14 shrink-0 px-2 text-right text-xs text-muted-foreground" style={{ lineHeight: `${ROW_HEIGHT}px` }}>
                {hour}:00
              </div>
              <div className="flex-1 border-l border-border" />
            </div>
          ))}

          {/* Positioned appointments */}
          {dayAppts.map((appt) => {
            const start = parseTime(appt.time_start.slice(0, 5));
            const end = parseTime(appt.time_end.slice(0, 5));
            const top = (start - HOUR_START) * ROW_HEIGHT;
            const height = Math.max((end - start) * ROW_HEIGHT, 24);

            return (
              <div
                key={appt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(appt);
                }}
                className={`absolute rounded-md px-2 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity overflow-hidden ${appt.status === "pendente" ? "ring-2 ring-amber-400 ring-offset-1 animate-pulse" : ""} ${getColorClasses(appt.color)}`}
                style={{ top, height, left: 60, right: 4 }}
              >
                <span className="font-medium">{appt.time_start.slice(0, 5)}</span>{" "}
                {appt.patients?.name || "Sem paciente"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

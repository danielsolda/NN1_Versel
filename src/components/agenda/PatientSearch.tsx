import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
}

interface PatientSearchProps {
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
}

export default function PatientSearch({ patients, value, onChange }: PatientSearchProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedPatient = patients.find((p) => p.id === value);

  useEffect(() => {
    if (selectedPatient && !open) setSearch(selectedPatient.name);
  }, [selectedPatient, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <Input
        placeholder="Buscar paciente..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        className="editable-field h-8 text-sm"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-2xl border border-border/60 bg-popover shadow-none">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface-hover hover:text-surface-hover-foreground",
                value === p.id && "bg-surface-active font-medium text-surface-active-foreground"
              )}
              onClick={() => {
                onChange(p.id);
                setSearch(p.name);
                setOpen(false);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      {open && search && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-border/60 bg-popover px-3 py-2 text-sm text-muted-foreground shadow-none">
          Nenhum paciente encontrado
        </div>
      )}
    </div>
  );
}

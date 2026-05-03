import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

interface TacoFood {
  id: number;
  description: string;
  category: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
  nutritionist_id?: string | null;
}

interface Props {
  value: string;
  onSelect: (food: TacoFood) => void;
  onChange: (name: string) => void;
  className?: string;
}

export default function TacoFoodSearch({ value, onSelect, onChange, className }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<TacoFood[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("taco_foods")
      .select("*")
      .ilike("description", `%${q}%`)
      .limit(10);
    setResults((data as TacoFood[]) || []);
    setLoading(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            search(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Buscar alimento..."
          className={`h-7 text-xs pl-6 ${className || ""}`}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-border/60 bg-popover shadow-none">
          {results.map((food) => (
            <button
              key={food.id}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface-hover hover:text-primary"
              onClick={() => {
                setQuery(food.description);
                onSelect(food);
                setOpen(false);
              }}
            >
              <span className="truncate flex items-center gap-1">
                {food.nutritionist_id && <span className="shrink-0 rounded bg-primary/10 px-1 py-0.5 text-[8px] font-semibold text-primary">MEU</span>}
                {food.description}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {food.calories?.toFixed(0)} kcal
              </span>
            </button>
          ))}
        </div>
      )}
      {open && loading && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-border/60 bg-popover p-2 text-center text-xs text-muted-foreground shadow-none">
          Buscando...
        </div>
      )}
    </div>
  );
}

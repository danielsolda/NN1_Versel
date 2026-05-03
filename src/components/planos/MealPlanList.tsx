import { useState, useEffect } from "react";
import { Plus, FileText, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MealPlan {
  id: string;
  title: string;
  created_at: string;
  patient_id: string | null;
  patient: {
    name: string;
  } | null;
}

interface Props {
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export default function MealPlanList({ onSelect, onCreate }: Props) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("meal_plans")
        .select("id, title, created_at, patient_id, patient:patients!meal_plans_patient_id_fkey(name)")
        .eq("nutritionist_id", user.id)
        .order("created_at", { ascending: false });
      setPlans((data as MealPlan[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Excluir este plano alimentar?")) return;
    await supabase.from("meal_plans").delete().eq("id", id);
    setPlans((p) => p.filter((x) => x.id !== id));
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (plans.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">Nenhum plano alimentar criado ainda.</p>
        <Button size="sm" className="mt-4 gap-1.5" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Criar Primeiro Plano
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          className="group flex w-full items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{plan.title}</p>
              <p className="text-xs text-muted-foreground">
                Paciente: {plan.patient?.name || "Sem paciente"}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(plan.created_at), "dd MMM yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => handleDelete(e, plan.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </button>
      ))}
    </div>
  );
}

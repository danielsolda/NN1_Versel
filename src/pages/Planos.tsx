import { useEffect, useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MealPlanList from "@/components/planos/MealPlanList";
import MealPlanEditor from "@/components/planos/MealPlanEditor";
import { useLocation, useNavigate } from "react-router-dom";

export default function Planos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const planIdFromUrl = new URLSearchParams(location.search).get("planId");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planIdFromUrl);
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    setSelectedPlanId(planIdFromUrl);
  }, [planIdFromUrl]);

  const openPlan = (planId: string) => {
    setSelectedPlanId(planId);
    navigate(`/planos?planId=${planId}`, { replace: true });
  };

  const handleCreate = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("meal_plans")
      .insert({ nutritionist_id: user.id, title: "Novo Plano Alimentar" })
      .select("id")
      .single();
    if (data) openPlan(data.id);
  };

  const handleBack = () => {
    setSelectedPlanId(null);
    setListKey((k) => k + 1);
    navigate("/planos", { replace: true });
  };

  if (selectedPlanId) {
    return <MealPlanEditor planId={selectedPlanId} onBack={handleBack} />;
  }

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3"><UtensilsCrossed className="h-6 w-6 text-primary" /><h1 className="page-title">Planos Alimentares</h1></div>
          <p className="page-lead">Crie e gerencie planos alimentares para seus pacientes.</p>
        </div>
        <Button size="sm" className="gap-1.5 rounded-[26px]" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <div className="mt-4 h-px w-full bg-border/60" />

      <MealPlanList key={listKey} onSelect={openPlan} onCreate={handleCreate} />
    </div>
  );
}

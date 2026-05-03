import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CustomFood {
  id: number;
  description: string;
  category: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
}

interface CategoryStat {
  category: string;
  count: number;
  is_custom: boolean;
}

const emptyFood = {
  description: "",
  category: "Personalizado",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sodium: "",
};

export default function CustomFoodsManager() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [allFoods, setAllFoods] = useState<CustomFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [allFoodsLoading, setAllFoodsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyFood);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<"taco" | "custom" | null>("custom");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [catFoods, setCatFoods] = useState<CustomFood[]>([]);
  const [catFoodsLoading, setCatFoodsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("taco_foods")
      .select("*")
      .eq("nutritionist_id", user.id)
      .order("description");
    setFoods((data as CustomFood[]) || []);
    setLoading(false);
  }, [user]);

  const loadAllFoods = useCallback(async () => {
    if (!user) return;
    setAllFoodsLoading(true);
    const { data } = await supabase
      .from("taco_foods")
      .select("*")
      .order("description");
    setAllFoods((data as CustomFood[]) || []);
    setAllFoodsLoading(false);
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    // Get TACO (official) categories
    const { data: tacoData } = await supabase
      .from("taco_foods")
      .select("category, nutritionist_id");

    if (tacoData) {
      const catMap = new Map<string, { count: number; is_custom: boolean }>();
      for (const row of tacoData) {
        const isCustom = !!row.nutritionist_id;
        const cat = isCustom ? "Personalizados" : row.category;
        const existing = catMap.get(cat) || { count: 0, is_custom: isCustom };
        existing.count++;
        catMap.set(cat, existing);
      }
      const result: CategoryStat[] = [];
      catMap.forEach((val, key) => result.push({ category: key, count: val.count, is_custom: val.is_custom }));
      // Sort: Personalizados first, then alphabetically
      result.sort((a, b) => {
        if (a.is_custom && !b.is_custom) return -1;
        if (!a.is_custom && b.is_custom) return 1;
        return a.category.localeCompare(b.category);
      });
      setStats(result);
    }
    setStatsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      load();
      loadAllFoods();
      loadStats();
    } else {
      setLoading(false);
      setAllFoodsLoading(false);
      setStatsLoading(false);
    }
  }, [user, load, loadAllFoods, loadStats]);

  useEffect(() => {
    setEditorOpen(false);
  }, []);

  const loadCategoryFoods = async (category: string, isCustom: boolean) => {
    if (expandedCat === category) {
      setExpandedGroup(null);
      setExpandedCat(null);
      setCatFoods([]);
      return;
    }
    setExpandedCat(category);
    setCatFoodsLoading(true);
    let query = supabase.from("taco_foods").select("*").order("description");
    if (isCustom) {
      query = query.not("nutritionist_id", "is", null);
    } else {
      query = query.eq("category", category).is("nutritionist_id", null);
    }
    const { data } = await query.limit(500);
    setCatFoods((data as CustomFood[]) || []);
    setCatFoodsLoading(false);
  };

  const resetForm = () => {
    setForm(emptyFood);
    setEditingId(null);
  };

  const openCreateFood = () => {
    resetForm();
    setEditorOpen(true);
  };

  const startEdit = (food: CustomFood) => {
    setEditingId(food.id);
    setForm({
      description: food.description,
      category: food.category || "Personalizado",
      calories: food.calories?.toString() || "",
      protein: food.protein?.toString() || "",
      carbs: food.carbs?.toString() || "",
      fat: food.fat?.toString() || "",
      fiber: food.fiber?.toString() || "",
      sodium: food.sodium?.toString() || "",
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.description.trim()) {
      toast.error("Nome do alimento é obrigatório");
      return;
    }

    const payload = {
      description: form.description.trim(),
      category: form.category || "Personalizado",
      calories: form.calories ? parseFloat(form.calories) : null,
      protein: form.protein ? parseFloat(form.protein) : null,
      carbs: form.carbs ? parseFloat(form.carbs) : null,
      fat: form.fat ? parseFloat(form.fat) : null,
      fiber: form.fiber ? parseFloat(form.fiber) : null,
      sodium: form.sodium ? parseFloat(form.sodium) : null,
      nutritionist_id: user.id,
    };

    if (editingId) {
      const { error } = await supabase
        .from("taco_foods")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar alimento");
        return;
      }
      toast.success("Alimento atualizado");
    } else {
      const { error } = await supabase
        .from("taco_foods")
        .insert(payload);
      if (error) {
        toast.error("Erro ao adicionar alimento");
        return;
      }
      toast.success("Alimento adicionado");
    }
    setEditorOpen(false);
    resetForm();
    load();
    loadAllFoods();
    loadStats();
  };

  const handleDelete = async (id: number) => {
    await supabase.from("taco_foods").delete().eq("id", id);
    toast.success("Alimento removido");
    load();
    loadAllFoods();
    loadStats();
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const totalFoods = stats.reduce((sum, s) => sum + s.count, 0);
  const visibleFoods = expandedCat ? catFoods : expandedGroup === "custom" ? foods : allFoods;
  const visibleTitle = expandedCat ? expandedCat : expandedGroup === "custom" ? "Meus Alimentos" : "Todas";

  const chipClass = (active: boolean) =>
    [
      "group min-w-[138px] rounded-2xl border px-4 py-3 text-left transition-colors",
      active
        ? "border-surface-hover-border bg-surface-active text-surface-active-foreground"
        : "border-border/60 bg-card text-foreground hover:border-surface-hover-border hover:bg-surface-hover",
    ].join(" ");

  const rowClass = "grid grid-cols-[minmax(0,2.35fr)_minmax(0,1.6fr)_104px_112px_112px_112px_104px_96px] items-center gap-0 px-4 py-3 text-sm";

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setExpandedGroup("custom");
            setExpandedCat(null);
            setCatFoods([]);
          }}
          className={chipClass(!expandedCat && expandedGroup === "custom")}
        >
          <span className="block text-sm font-semibold transition-colors group-hover:text-primary">Meus Alimentos</span>
          <span className="mt-1 block text-xs text-muted-foreground">{foods.length} alimentos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setExpandedGroup(null);
            setExpandedCat(null);
            setCatFoods([]);
          }}
          className={chipClass(!expandedCat && expandedGroup === null)}
        >
          <span className="block text-sm font-semibold transition-colors group-hover:text-primary">Todas</span>
          <span className="mt-1 block text-xs text-muted-foreground">{totalFoods} alimentos</span>
        </button>

        {statsLoading ? (
          <div className="min-w-[138px] rounded-2xl border border-border/60 bg-card px-4 py-3 text-left text-xs text-muted-foreground">
            Carregando bases...
          </div>
        ) : (
          stats.filter((s) => !s.is_custom).map((s) => (
            <button
              key={s.category}
              type="button"
              onClick={() => {
                setExpandedGroup("taco");
                setExpandedCat(s.category);
                loadCategoryFoods(s.category, false);
              }}
              className={chipClass(expandedCat === s.category)}
            >
              <span className="block text-sm font-semibold transition-colors group-hover:text-primary">{s.category}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{s.count} alimentos</span>
            </button>
          ))
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tabela selecionada</p>
            <h3 className="text-sm font-semibold text-foreground">{visibleTitle}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
            <span>{visibleFoods.length} alimentos</span>
            {catFoodsLoading && <span>Carregando...</span>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-1 h-8 shrink-0 gap-2 rounded-full px-3 text-xs"
              onClick={openCreateFood}
            >
              <Plus className="h-4 w-4" />
              Criar Alimento
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[minmax(0,2.35fr)_minmax(0,1.6fr)_104px_112px_112px_112px_104px_96px] border-b border-border/60 bg-muted/20 px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <span className="truncate">Nome</span>
              <span className="truncate">Grupo</span>
              <span className="truncate text-center">Porção</span>
              <span className="truncate text-center text-palette-blue">Carboidratos</span>
              <span className="truncate text-center text-palette-red">Proteínas</span>
              <span className="truncate text-center text-palette-amber">Lipídeos</span>
              <span className="truncate text-center text-palette-purple">Calorias</span>
              <span className="truncate text-right">Ações</span>
            </div>

            <div className="divide-y divide-border/60">
              {loading || allFoodsLoading || (expandedCat && catFoodsLoading) ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : visibleFoods.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum alimento encontrado</div>
              ) : (
                visibleFoods.map((food, index) => (
                  <div
                    key={food.id}
                    className={`${rowClass} ${index % 2 === 0 ? "bg-card" : "bg-muted/10"} hover:bg-surface-hover`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{food.description}</p>
                    </div>
                    <div className="min-w-0 text-xs text-muted-foreground truncate">{food.category}</div>
                    <div className="flex items-center justify-center text-center text-xs text-muted-foreground tabular-nums">100g</div>
                    <div className="flex items-center justify-center text-center text-xs font-medium text-palette-blue tabular-nums">{food.carbs ?? "—"}g</div>
                    <div className="flex items-center justify-center text-center text-xs font-medium text-palette-red tabular-nums">{food.protein ?? "—"}g</div>
                    <div className="flex items-center justify-center text-center text-xs font-medium text-palette-amber tabular-nums">{food.fat ?? "—"}g</div>
                    <div className="flex items-center justify-center text-center text-xs font-medium text-palette-purple tabular-nums">{food.calories ?? "—"}kcal</div>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(food)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(food.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingId ? "Editar alimento" : "Novo alimento"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha os dados do alimento e salve para incluir na sua base.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Nome do alimento *"
              className="editable-field h-8 text-sm"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="Categoria"
                className="h-8 text-sm"
              />
              <div className="text-xs text-muted-foreground sm:flex sm:items-center sm:justify-end sm:pr-1">Valores por 100g</div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <div>
                <label className="mb-0.5 block text-[9px] text-muted-foreground">Kcal</label>
                <Input value={form.calories} onChange={(e) => updateField("calories", e.target.value)} placeholder="0" className="h-7 text-xs" type="number" step="0.1" />
              </div>
              <div>
                <label className="mb-0.5 block text-[9px] text-muted-foreground">Prot (g)</label>
                <Input value={form.protein} onChange={(e) => updateField("protein", e.target.value)} placeholder="0" className="h-7 text-xs" type="number" step="0.1" />
              </div>
              <div>
                <label className="mb-0.5 block text-[9px] text-muted-foreground">Carb (g)</label>
                <Input value={form.carbs} onChange={(e) => updateField("carbs", e.target.value)} placeholder="0" className="h-7 text-xs" type="number" step="0.1" />
              </div>
              <div>
                <label className="mb-0.5 block text-[9px] text-muted-foreground">Gord (g)</label>
                <Input value={form.fat} onChange={(e) => updateField("fat", e.target.value)} placeholder="0" className="h-7 text-xs" type="number" step="0.1" />
              </div>
              <div>
                <label className="mb-0.5 block text-[9px] text-muted-foreground">Fibra (g)</label>
                <Input value={form.fiber} onChange={(e) => updateField("fiber", e.target.value)} placeholder="0" className="h-7 text-xs" type="number" step="0.1" />
              </div>
              <div>
                <label className="mb-0.5 block text-[9px] text-muted-foreground">Sódio (mg)</label>
                <Input value={form.sodium} onChange={(e) => updateField("sodium", e.target.value)} placeholder="0" className="h-7 text-xs" type="number" step="0.1" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleSave}>
                {editingId ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
              {editingId && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetForm}>
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

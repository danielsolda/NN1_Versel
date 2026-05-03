import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, Copy, Pencil, Image as ImageIcon, X, ChevronDown, ChevronUp, Search, User, ChefHat } from "lucide-react";
import TacoFoodSearch from "@/components/shared/TacoFoodSearch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const COMMON_UNITS = ["g", "mg", "kg", "ml", "L", "xíc", "col. sopa", "col. chá", "col. café", "unid", "fatia", "porção", "pote", "copo", "sachê", "pitada", "a gosto"];

interface Patient {
  id: string;
  name: string;
}

/* ─── Food Item Card (read-only display) ─── */
function FoodItemCard({ food, onEdit, onRemove, recipes, onImportRecipe }: {
  food: FoodItem;
  onEdit: (updates: Partial<FoodItem>) => void;
  onRemove: () => void;
  recipes?: { id: string; title: string }[];
  onImportRecipe?: (recipeId: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(!food.food_name);

  return (
    <>
      <div className="group flex items-stretch rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-primary/30">
        <div className="flex-1 p-2 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {food.food_name || <span className="italic text-muted-foreground">Sem nome</span>}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            {food.quantity && <span>{food.quantity} {food.unit || "g"}</span>}
          </div>
          {(() => {
            const p = parseFloat(food.protein) || 0;
            const c = parseFloat(food.carbs) || 0;
            const f = parseFloat(food.fat) || 0;
            const total = p * 4 + c * 4 + f * 9;
            const pPct = total > 0 ? ((p * 4) / total) * 100 : 0;
            const cPct = total > 0 ? ((c * 4) / total) * 100 : 0;
            const fPct = total > 0 ? ((f * 9) / total) * 100 : 0;
            return (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-palette-orange">{food.calories || "—"} kcal</span>
                </div>
                {total > 0 && (
                  <>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <div className="rounded-l-full bg-palette-red" style={{ width: `${pPct}%` }} />
                      <div className="bg-palette-blue" style={{ width: `${cPct}%` }} />
                      <div className="rounded-r-full bg-palette-yellow" style={{ width: `${fPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] text-muted-foreground">
                      <span className="flex items-center gap-0.5 text-palette-red"><span className="inline-block h-1.5 w-1.5 rounded-full bg-palette-red" />P {food.protein}g</span>
                      <span className="flex items-center gap-0.5 text-palette-blue"><span className="inline-block h-1.5 w-1.5 rounded-full bg-palette-blue" />C {food.carbs}g</span>
                      <span className="flex items-center gap-0.5 text-palette-yellow"><span className="inline-block h-1.5 w-1.5 rounded-full bg-palette-yellow" />G {food.fat}g</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
        <div className="flex flex-col justify-center gap-0.5 border-l border-border px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setModalOpen(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <FoodItemModal
        open={modalOpen}
        food={food}
        onClose={() => setModalOpen(false)}
        onSave={(updates) => { onEdit(updates); setModalOpen(false); }}
        recipes={recipes}
        onImportRecipe={onImportRecipe}
      />
    </>
  );
}

/* ─── Food Item Edit Modal ─── */
function FoodItemModal({ open, food, onClose, onSave, recipes, onImportRecipe }: {
  open: boolean;
  food: FoodItem;
  onClose: () => void;
  onSave: (updates: Partial<FoodItem>) => void;
  recipes?: { id: string; title: string }[];
  onImportRecipe?: (recipeId: string) => void;
}) {
  const [form, setForm] = useState(food);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedFromTaco, setSelectedFromTaco] = useState(false);
  const [savingFood, setSavingFood] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setForm({
      ...food,
      substitute_type: food.substitute_type || "food",
      substitute_target: food.substitute_target || "",
    });
    setSelectedFromTaco(false);
  }, [food, open]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const filteredRecipes = recipes?.filter((r) =>
    !recipeSearch || r.title.toLowerCase().includes(recipeSearch.toLowerCase())
  ) || [];

  const handleSaveCustomFood = async () => {
    if (!user || !form.food_name) return;
    setSavingFood(true);
    try {
      await supabase.from("taco_foods").insert({
        description: form.food_name,
        category: "Personalizado",
        calories: form.calories ? parseFloat(form.calories) : null,
        protein: form.protein ? parseFloat(form.protein) : null,
        carbs: form.carbs ? parseFloat(form.carbs) : null,
        fat: form.fat ? parseFloat(form.fat) : null,
        fiber: form.fiber ? parseFloat(form.fiber) : null,
        sodium: form.sodium ? parseFloat(form.sodium) : null,
        nutritionist_id: user.id,
      });
      toast.success(`"${form.food_name}" salvo na sua base de alimentos!`);
    } catch {
      toast.error("Erro ao salvar alimento");
    } finally {
      setSavingFood(false);
    }
  };

  const macroFields = [
    { key: "calories", label: "Kcal", suffix: "", accent: "neutral" },
    { key: "protein", label: "Prot", suffix: "g", accent: "red" },
    { key: "carbs", label: "Carb", suffix: "g", accent: "blue" },
    { key: "fat", label: "Gord", suffix: "g", accent: "yellow" },
    { key: "fiber", label: "Fibra", suffix: "g", accent: "primary" },
    { key: "sodium", label: "Sódio", suffix: "mg", accent: "slate" },
  ];

  const accentStyles: Record<string, { card: string; label: string; value: string; input: string }> = {
    neutral: { card: "border-border bg-background", label: "text-muted-foreground", value: "text-foreground", input: "text-foreground placeholder:text-muted-foreground" },
    orange: { card: "border-palette-orange/35 bg-background", label: "text-palette-orange", value: "text-palette-orange", input: "text-palette-orange placeholder:text-palette-orange" },
    red: { card: "border-palette-red/35 bg-background", label: "text-palette-red", value: "text-palette-red", input: "text-palette-red placeholder:text-palette-red" },
    blue: { card: "border-palette-blue/35 bg-background", label: "text-palette-blue", value: "text-palette-blue", input: "text-palette-blue placeholder:text-palette-blue" },
    yellow: { card: "border-palette-yellow/35 bg-background", label: "text-palette-yellow", value: "text-palette-yellow", input: "text-palette-yellow placeholder:text-palette-yellow" },
    primary: { card: "border-primary/35 bg-background", label: "text-primary", value: "text-primary", input: "text-primary placeholder:text-primary" },
    slate: { card: "border-palette-slate/35 bg-background", label: "text-palette-slate", value: "text-palette-slate", input: "text-palette-slate placeholder:text-palette-slate" },
  };

  const macroPreview = useMemo(() => {
    const proteinEnergy = (parseFloat(form.protein) || 0) * 4;
    const carbEnergy = (parseFloat(form.carbs) || 0) * 4;
    const fatEnergy = (parseFloat(form.fat) || 0) * 9;
    const totalEnergy = proteinEnergy + carbEnergy + fatEnergy;

    return {
      proteinPct: totalEnergy > 0 ? (proteinEnergy / totalEnergy) * 100 : 0,
      carbPct: totalEnergy > 0 ? (carbEnergy / totalEnergy) * 100 : 0,
      fatPct: totalEnergy > 0 ? (fatEnergy / totalEnergy) * 100 : 0,
    };
  }, [form.carbs, form.fat, form.protein]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">Editar Alimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Import recipe */}
          {onImportRecipe && (
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => setShowRecipes(!showRecipes)}
              >
                <ChefHat className="h-3.5 w-3.5 text-primary" />
                Importar Receita Cadastrada
              </Button>
              {showRecipes && (
                <div className="mt-2 rounded-md border border-border p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      placeholder="Buscar receita..."
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {filteredRecipes.length === 0 ? (
                      <p className="px-2 py-2 text-center text-xs text-muted-foreground">Nenhuma receita encontrada</p>
                    ) : (
                      filteredRecipes.map((r) => (
                        <button
                          key={r.id}
                          className="w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent flex items-center gap-2"
                          onClick={() => { onImportRecipe(r.id); onClose(); }}
                        >
                          <ChefHat className="h-3 w-3 text-primary shrink-0" />
                          {r.title}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-4">
              {/* Food search */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Alimento</label>
                <TacoFoodSearch
                  value={form.food_name}
                  onChange={(name) => { update("food_name", name); setSelectedFromTaco(false); }}
                  onSelect={(taco) => {
                    setForm((p) => ({
                      ...p,
                      food_name: taco.description,
                      calories: taco.calories?.toFixed(1) || "",
                      protein: taco.protein?.toFixed(1) || "",
                      carbs: taco.carbs?.toFixed(1) || "",
                      fat: taco.fat?.toFixed(1) || "",
                      fiber: taco.fiber?.toFixed(1) || "",
                      sodium: taco.sodium?.toFixed(1) || "",
                    }));
                    setSelectedFromTaco(true);
                  }}
                  className="h-9 text-sm"
                />
              </div>

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Quantidade</label>
                  <Input value={form.quantity} onChange={(e) => update("quantity", e.target.value)} placeholder="100" className="h-9" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Unidade</label>
                  <Select value={form.unit || "g"} onValueChange={(v) => update("unit", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COMMON_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Save as custom food button */}
              {!selectedFromTaco && form.food_name && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={handleSaveCustomFood}
                  disabled={savingFood}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {savingFood ? "Salvando..." : "Salvar na minha base de alimentos"}
                </Button>
              )}

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`substitute-${food.id}`}
                    checked={form.is_substitute}
                    onCheckedChange={(checked) => {
                      setForm((prev) => ({
                        ...prev,
                        is_substitute: checked === true,
                        substitute_type: prev.substitute_type || "food",
                        substitute_target: prev.substitute_target || "",
                      }));
                    }}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`substitute-${food.id}`} className="cursor-pointer text-xs font-semibold text-foreground">
                      Marcar como alimento substituível
                    </Label>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      Use esta marcação para indicar que este alimento pode ser trocado por outro alimento ou por um grupo de alimentos.
                    </p>
                  </div>
                </div>

                {form.is_substitute && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-muted-foreground">Substituição por</label>
                      <Select
                        value={form.substitute_type || "food"}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, substitute_type: value as "food" | "group" }))}
                      >
                        <SelectTrigger className="h-9 bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Alimento</SelectItem>
                          <SelectItem value="group">Grupo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-muted-foreground">
                        {form.substitute_type === "group" ? "Grupo de alimentos" : "Alimento substituto"}
                      </label>
                      <Input
                        value={form.substitute_target || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, substitute_target: e.target.value }))}
                        placeholder={form.substitute_type === "group" ? "Ex.: pães e massas" : "Ex.: pão francês"}
                        className="h-9 bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Macros - editable when not from TACO */}
            <div className="h-fit self-start rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Informação Nutricional (por 100g)
                {!selectedFromTaco && <span className="ml-1 text-[10px] text-primary font-normal">— editável</span>}
              </label>
              <div className="mb-2 space-y-1.5">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
                  <div className="bg-palette-red" style={{ width: `${macroPreview.proteinPct}%` }} />
                  <div className="bg-palette-blue" style={{ width: `${macroPreview.carbPct}%` }} />
                  <div className="bg-palette-yellow" style={{ width: `${macroPreview.fatPct}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-palette-red"><span className="h-1.5 w-1.5 rounded-full bg-palette-red" />P</span>
                  <span className="flex items-center gap-1 text-palette-blue"><span className="h-1.5 w-1.5 rounded-full bg-palette-blue" />C</span>
                  <span className="flex items-center gap-1 text-palette-yellow"><span className="h-1.5 w-1.5 rounded-full bg-palette-yellow" />G</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {macroFields.map(({ key, label, suffix, accent }) => {
                  const style = accentStyles[accent];

                  return (
                  <div key={key} className={`rounded-md border p-2 text-center shadow-sm ${style.card}`}>
                    <span className={`mb-1 flex items-center justify-center gap-1 text-[10px] font-semibold ${style.label}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {label} {suffix && `(${suffix})`}
                    </span>
                    {selectedFromTaco ? (
                      <span className={`text-sm font-semibold ${style.value}`}>{(form as any)[key] || "—"}</span>
                    ) : (
                      <Input
                        value={(form as any)[key] || ""}
                        onChange={(e) => update(key, e.target.value)}
                        className={`h-6 border-none bg-transparent p-0 text-center text-sm font-semibold shadow-none focus-visible:ring-1 ${style.input}`}
                        placeholder="—"
                      />
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={() => onSave(form)}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FoodItem {
  id: string;
  food_name: string;
  quantity: string;
  unit: string;
  is_substitute: boolean;
  substitute_type?: "food" | "group";
  substitute_target?: string;
  sort_order: number;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
  group_name?: string;
}

interface MealOption {
  id: string;
  name: string;
  sort_order: number;
  image_url: string;
  food_items: FoodItem[];
  recipe_id?: string | null;
}

interface MealImage {
  id: string;
  image_url: string;
  caption: string;
}

interface Meal {
  id: string;
  name: string;
  type: string;
  time: string;
  location: string;
  description: string;
  sort_order: number;
  options: MealOption[];
  images: MealImage[];
  collapsed: boolean;
}

interface Props {
  planId: string;
  onBack: () => void;
}

export default function MealPlanEditor({ planId, onBack }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("patients").select("id, name").eq("nutritionist_id", user.id).order("name").then(({ data }) => {
      setPatients(data || []);
    });
    supabase.from("recipes").select("id, title, image_url").eq("nutritionist_id", user.id).order("title").then(({ data }) => {
      setRecipes(data || []);
    });
  }, [user]);


  const importRecipe = async (mealIdx: number, optIdx: number, recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    const { data: ingredients } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("sort_order");
    const newItems: FoodItem[] = (ingredients || []).map((ing: any, i: number) => ({
      id: crypto.randomUUID(),
      food_name: ing.food_name,
      quantity: ing.quantity || "",
      unit: ing.unit || "g",
      is_substitute: false,
      sort_order: i,
      calories: ing.calories?.toString() || "",
      protein: ing.protein?.toString() || "",
      carbs: ing.carbs?.toString() || "",
      fat: ing.fat?.toString() || "",
      fiber: ing.fiber?.toString() || "",
      sodium: ing.sodium?.toString() || "",
      group_name: recipe.title,
    }));
    const option = meals[mealIdx].options[optIdx];
    updateOption(mealIdx, optIdx, {
      food_items: [...option.food_items, ...newItems],
      recipe_id: recipeId,
    });
    toast.success(`Receita "${recipe.title}" importada!`);
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId]);

  const loadPlan = useCallback(async () => {
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("title, patient_id")
      .eq("id", planId)
      .single();

    if (plan) {
      setTitle(plan.title);
      setPatientId(plan.patient_id || null);
    }

    const { data: mealsData } = await supabase
      .from("meals")
      .select("*")
      .eq("meal_plan_id", planId)
      .order("sort_order");

    if (!mealsData || mealsData.length === 0) {
      setMeals([]);
      setLoading(false);
      return;
    }

    const mealIds = mealsData.map((m) => m.id);

    const [optionsRes, imagesRes] = await Promise.all([
      supabase.from("meal_options").select("*").in("meal_id", mealIds).order("sort_order"),
      supabase.from("meal_images").select("*").in("meal_id", mealIds).order("sort_order"),
    ]);

    const optionIds = (optionsRes.data || []).map((o) => o.id);
    let foodItemsData: any[] = [];
    if (optionIds.length > 0) {
      const { data } = await supabase
        .from("meal_food_items")
        .select("*")
        .in("meal_option_id", optionIds)
        .order("sort_order");
      foodItemsData = data || [];
    }

    const builtMeals: Meal[] = mealsData.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      time: m.time || "",
      location: m.location || "",
      description: m.description || "",
      sort_order: m.sort_order,
      collapsed: false,
      options: (optionsRes.data || [])
        .filter((o) => o.meal_id === m.id)
        .map((o) => ({
          id: o.id,
          name: o.name,
          sort_order: o.sort_order,
          image_url: (o as any).image_url || "",
          food_items: foodItemsData
            .filter((f) => f.meal_option_id === o.id)
            .map((f) => ({
              id: f.id,
              food_name: f.food_name,
              quantity: f.quantity || "",
              unit: f.unit || "",
              is_substitute: f.is_substitute,
              sort_order: f.sort_order,
              calories: (f as any).calories?.toString() || "",
              protein: (f as any).protein?.toString() || "",
              carbs: (f as any).carbs?.toString() || "",
              fat: (f as any).fat?.toString() || "",
              fiber: (f as any).fiber?.toString() || "",
              sodium: (f as any).sodium?.toString() || "",
            })),
        })),
      images: (imagesRes.data || [])
        .filter((img) => img.meal_id === m.id)
        .map((img) => ({
          id: img.id,
          image_url: img.image_url,
          caption: img.caption || "",
        })),
    }));

    setMeals(builtMeals);
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const addMeal = () => {
    const mealNames = ["CAFÉ DA MANHÃ", "LANCHE DA MANHÃ", "ALMOÇO", "LANCHE DA TARDE", "JANTAR", "CEIA"];
    const nextName = mealNames[meals.length % mealNames.length];
    setMeals((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: nextName,
        type: "qualitativa",
        time: "",
        location: "",
        description: "",
        sort_order: prev.length,
        options: [],
        images: [],
        collapsed: false,
      },
    ]);
  };

  const removeMeal = (idx: number) => {
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  };

  const duplicateMeal = (idx: number) => {
    const meal = meals[idx];
    const copy: Meal = {
      ...meal,
      id: crypto.randomUUID(),
      name: meal.name + " (cópia)",
      sort_order: meals.length,
      options: meal.options.map((o) => ({
        ...o,
        id: crypto.randomUUID(),
        food_items: o.food_items.map((f) => ({ ...f, id: crypto.randomUUID() })),
      })),
      images: [],
    };
    setMeals((prev) => [...prev, copy]);
  };

  const updateMeal = (idx: number, updates: Partial<Meal>) => {
    setMeals((prev) => prev.map((m, i) => (i === idx ? { ...m, ...updates } : m)));
  };

  const addOption = (mealIdx: number) => {
    const meal = meals[mealIdx];
    const newOption: MealOption = {
      id: crypto.randomUUID(),
      name: `Opção ${meal.options.length + 1}`,
      sort_order: meal.options.length,
      image_url: "",
      food_items: [],
    };
    updateMeal(mealIdx, { options: [...meal.options, newOption] });
  };

  const removeOption = (mealIdx: number, optIdx: number) => {
    const meal = meals[mealIdx];
    updateMeal(mealIdx, { options: meal.options.filter((_, i) => i !== optIdx) });
  };

  const updateOption = (mealIdx: number, optIdx: number, updates: Partial<MealOption>) => {
    const meal = meals[mealIdx];
    const newOptions = meal.options.map((o, i) => (i === optIdx ? { ...o, ...updates } : o));
    updateMeal(mealIdx, { options: newOptions });
  };

  const addFoodItem = (mealIdx: number, optIdx: number) => {
    const option = meals[mealIdx].options[optIdx];
    const newItem: FoodItem = {
      id: crypto.randomUUID(),
      food_name: "",
      quantity: "",
      unit: "g",
      is_substitute: false,
      sort_order: option.food_items.length,
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      sodium: "",
    };
    updateOption(mealIdx, optIdx, { food_items: [...option.food_items, newItem] });
  };

  const removeFoodItem = (mealIdx: number, optIdx: number, foodIdx: number) => {
    const option = meals[mealIdx].options[optIdx];
    updateOption(mealIdx, optIdx, {
      food_items: option.food_items.filter((_, i) => i !== foodIdx),
    });
  };

  const updateFoodItem = (mealIdx: number, optIdx: number, foodIdx: number, updates: Partial<FoodItem>) => {
    const option = meals[mealIdx].options[optIdx];
    const newItems = option.food_items.map((f, i) => (i === foodIdx ? { ...f, ...updates } : f));
    updateOption(mealIdx, optIdx, { food_items: newItems });
  };

  const handleImageUpload = async (mealIdx: number, files: FileList) => {
    if (!user) return;
    const meal = meals[mealIdx];
    const newImages: MealImage[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${planId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("meal-images").upload(path, file);
      if (error) {
        toast.error("Erro ao enviar imagem");
        continue;
      }
      const { data: urlData } = supabase.storage.from("meal-images").getPublicUrl(path);
      newImages.push({
        id: crypto.randomUUID(),
        image_url: urlData.publicUrl,
        caption: "",
      });
    }

    updateMeal(mealIdx, { images: [...meal.images, ...newImages] });
  };

  const removeImage = (mealIdx: number, imgIdx: number) => {
    const meal = meals[mealIdx];
    updateMeal(mealIdx, { images: meal.images.filter((_, i) => i !== imgIdx) });
  };

  const handleOptionImageUpload = async (mealIdx: number, optIdx: number, file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${planId}/options/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("meal-images").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar imagem");
      return;
    }
    const { data: urlData } = supabase.storage.from("meal-images").getPublicUrl(path);
    updateOption(mealIdx, optIdx, { image_url: urlData.publicUrl });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await supabase.from("meal_plans").update({ title, patient_id: patientId }).eq("id", planId);

      // Delete existing data and re-insert
      const { data: existingMeals } = await supabase
        .from("meals")
        .select("id")
        .eq("meal_plan_id", planId);

      if (existingMeals && existingMeals.length > 0) {
        await supabase.from("meals").delete().eq("meal_plan_id", planId);
      }

      for (const meal of meals) {
        const { data: mealRow } = await supabase
          .from("meals")
          .insert({
            meal_plan_id: planId,
            name: meal.name,
            type: meal.type,
            time: meal.time || null,
            location: meal.location || null,
            description: meal.description || null,
            sort_order: meal.sort_order,
          })
          .select("id")
          .single();

        if (!mealRow) continue;

        // Insert images
        if (meal.images.length > 0) {
          await supabase.from("meal_images").insert(
            meal.images.map((img, i) => ({
              meal_id: mealRow.id,
              image_url: img.image_url,
              caption: img.caption || null,
              sort_order: i,
            }))
          );
        }

        // Insert options and food items
        for (const option of meal.options) {
          const { data: optRow } = await supabase
            .from("meal_options")
            .insert({
              meal_id: mealRow.id,
              name: option.name,
              sort_order: option.sort_order,
              image_url: option.image_url || null,
              recipe_id: option.recipe_id || null,
            } as any)
            .select("id")
            .single();

          if (!optRow) continue;

          if (option.food_items.length > 0) {
            await supabase.from("meal_food_items").insert(
              option.food_items.map((f) => ({
                meal_option_id: optRow.id,
                food_name: f.food_name,
                quantity: f.quantity || null,
                unit: f.unit || null,
                is_substitute: f.is_substitute,
                sort_order: f.sort_order,
                calories: f.calories ? parseFloat(f.calories) : null,
                protein: f.protein ? parseFloat(f.protein) : null,
                carbs: f.carbs ? parseFloat(f.carbs) : null,
                fat: f.fat ? parseFloat(f.fat) : null,
                fiber: f.fiber ? parseFloat(f.fiber) : null,
                sodium: f.sodium ? parseFloat(f.sodium) : null,
              }))
            );
          }
        }
      }

      toast.success("Plano salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Carregando plano...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="editable-field max-w-md text-lg font-semibold"
              placeholder="Título do plano"
            />
            <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-fit justify-start gap-2 text-xs font-normal">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedPatient ? selectedPatient.name : "Associar paciente..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Buscar paciente..."
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {patientId && (
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent"
                      onClick={() => { setPatientId(null); setPatientPopoverOpen(false); setPatientSearch(""); }}
                    >
                      Remover paciente
                    </button>
                  )}
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      className={`w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent ${p.id === patientId ? "bg-accent font-medium" : ""}`}
                      onClick={() => { setPatientId(p.id); setPatientPopoverOpen(false); setPatientSearch(""); }}
                    >
                      {p.name}
                    </button>
                  ))}
                  {filteredPatients.length === 0 && (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">Nenhum paciente encontrado</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onBack}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button onClick={addMeal} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova Refeição
            </Button>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="mt-6 space-y-4">
        {meals.map((meal, mealIdx) => (
          <div key={meal.id} className="rounded-lg border border-border bg-card">
            {/* Meal Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <button
                className="flex items-center gap-2 text-left"
                onClick={() => updateMeal(mealIdx, { collapsed: !meal.collapsed })}
              >
                {meal.collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                <Input
                  value={meal.name}
                  onChange={(e) => { e.stopPropagation(); updateMeal(mealIdx, { name: e.target.value }); }}
                  onClick={(e) => e.stopPropagation()}
                  className="editable-field h-8 w-56 px-2 text-sm font-bold uppercase"
                />
              </button>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateMeal(mealIdx)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMeal(mealIdx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {!meal.collapsed && (
              <div className="space-y-4 p-4">
                {/* Tipo, Horário, Local */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
                    <Select value={meal.type} onValueChange={(v) => updateMeal(mealIdx, { type: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qualitativa">Qualitativa</SelectItem>
                        <SelectItem value="quantitativa">Quantitativa (Cálculo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Horário</label>
                    <Input value={meal.time} onChange={(e) => updateMeal(mealIdx, { time: e.target.value })} placeholder="Ex: 07:00" className="h-9" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Local</label>
                    <Input value={meal.location} onChange={(e) => updateMeal(mealIdx, { location: e.target.value })} placeholder="Ex: Casa" className="h-9" />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {meal.options.map((option, optIdx) => (
                    <div key={option.id} className="rounded-md border border-border/60 bg-background p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeOption(mealIdx, optIdx)}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Input
                          value={option.name}
                          onChange={(e) => updateOption(mealIdx, optIdx, { name: e.target.value })}
                          className="editable-field h-7 flex-1 px-2 text-xs font-semibold"
                        />
                      </div>

                      {/* Option content: photo side-by-side with foods and totals */}
                      <div className="flex gap-3">
                        {/* Photo - side */}
                        <div className="shrink-0">
                          {option.image_url ? (
                            <div className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                              <img src={option.image_url} alt={option.name} className="h-full w-full object-cover" />
                              <button
                                onClick={() => updateOption(mealIdx, optIdx, { image_url: "" })}
                                className="absolute right-0.5 top-0.5 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground/50 transition-colors hover:border-primary/30 hover:bg-accent/30">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleOptionImageUpload(mealIdx, optIdx, file);
                                }}
                              />
                              <ImageIcon className="h-4 w-4" />
                              <span className="text-[9px]">Foto</span>
                            </label>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-start">
                          {/* Food items - card display */}
                          <div className="min-w-0 flex-1">
                            <div className="grid grid-cols-1 gap-2">
                        {(() => {
                          const groups: { name: string | null; items: { food: FoodItem; idx: number }[] }[] = [];
                          let currentGroup: typeof groups[0] | null = null;

                          option.food_items.forEach((food, foodIdx) => {
                            const gName = food.group_name || null;
                            if (!currentGroup || currentGroup.name !== gName) {
                              currentGroup = { name: gName, items: [] };
                              groups.push(currentGroup);
                            }
                            currentGroup.items.push({ food, idx: foodIdx });
                          });

                          return groups.map((group, gi) => (
                            <div key={gi} className={group.name ? "rounded-md border border-primary/20 bg-primary/5 p-2" : ""}>
                              {group.name && (
                                <div className="mb-1.5 flex items-center gap-1.5">
                                  <ChefHat className="h-3 w-3 text-primary" />
                                  <span className="text-[11px] font-semibold text-primary">{group.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-auto h-5 w-5"
                                    onClick={() => {
                                      const ids = new Set(group.items.map((i) => i.food.id));
                                      updateOption(mealIdx, optIdx, {
                                        food_items: option.food_items.filter((f) => !ids.has(f.id)),
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                {group.items.map(({ food, idx: foodIdx }) => (
                                  <FoodItemCard
                                    key={food.id}
                                    food={food}
                                    onEdit={(updates) => updateFoodItem(mealIdx, optIdx, foodIdx, updates)}
                                    onRemove={() => removeFoodItem(mealIdx, optIdx, foodIdx)}
                                    recipes={recipes}
                                    onImportRecipe={(recipeId) => importRecipe(mealIdx, optIdx, recipeId)}
                                  />
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                              <button
                                type="button"
                                onClick={() => addFoodItem(mealIdx, optIdx)}
                                className="mt-1 inline-flex h-9 w-fit items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/30"
                              >
                                <Plus className="mr-1 h-3 w-3" /> Alimento
                              </button>
                            </div>
                          </div>

                          {/* Option totals */}
                          {option.food_items.length > 0 && (() => {
                            const totals: MealTotals = option.food_items.reduce(
                              (sum, food) => ({
                                cal: sum.cal + (parseFloat(food.calories) || 0),
                                prot: sum.prot + (parseFloat(food.protein) || 0),
                                carb: sum.carb + (parseFloat(food.carbs) || 0),
                                fat: sum.fat + (parseFloat(food.fat) || 0),
                                fiber: sum.fiber + (parseFloat(food.fiber) || 0),
                                sodium: sum.sodium + (parseFloat(food.sodium) || 0),
                              }),
                              { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0, sodium: 0 }
                            );

                            return (
                              <div className="w-full lg:w-[260px] shrink-0 lg:border-l lg:border-border lg:pl-4 space-y-2">
                                <MealTotalsCard totals={totals} />
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => addOption(mealIdx)}>
                    <Plus className="h-3.5 w-3.5" /> Adicionar Opção
                  </Button>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Descrição / Observações</label>
                  <Textarea
                    value={meal.description}
                    onChange={(e) => updateMeal(mealIdx, { description: e.target.value })}
                    placeholder="Notas sobre esta refeição..."
                    className="min-h-[60px] text-sm"
                  />
                </div>

                {/* Images */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Imagens</label>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(mealIdx, e.target.files)}
                      />
                      <span className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-accent">
                        <ImageIcon className="h-3 w-3" /> Adicionar
                      </span>
                    </label>
                  </div>
                  {meal.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {meal.images.map((img, imgIdx) => (
                        <div key={img.id} className="group relative h-20 w-20 overflow-hidden rounded-md border border-border">
                          <img src={img.image_url} alt={img.caption} className="h-full w-full object-cover" />
                          <button
                            onClick={() => removeImage(mealIdx, imgIdx)}
                            className="absolute right-0.5 top-0.5 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {meals.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">Clique em "Nova Refeição" para começar a montar o plano.</p>
        </div>
      )}
    </div>
  );
}

type MealTotals = {
  cal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
  sodium: number;
};

function MealTotalsCard({ totals }: { totals: MealTotals }) {
  const macro = getMacroBreakdown(totals);

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4">
      <h4 className="text-xs font-semibold text-foreground">Totais da Opção</h4>
      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
            <div className="bg-palette-red" style={{ width: `${macro.proteinPct}%` }} />
            <div className="bg-palette-blue" style={{ width: `${macro.carbPct}%` }} />
            <div className="bg-palette-yellow" style={{ width: `${macro.fatPct}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px]">
            <span className="flex items-center gap-1 text-palette-red"><span className="h-1.5 w-1.5 rounded-full bg-palette-red" />P {totals.prot.toFixed(1)}g</span>
            <span className="flex items-center gap-1 text-palette-blue"><span className="h-1.5 w-1.5 rounded-full bg-palette-blue" />C {totals.carb.toFixed(1)}g</span>
            <span className="flex items-center gap-1 text-palette-yellow"><span className="h-1.5 w-1.5 rounded-full bg-palette-yellow" />G {totals.fat.toFixed(1)}g</span>
          </div>
        </div>

        <div className="space-y-2">
          <MealTotalRow label="Calorias" value={totals.cal} unit="kcal" precision={0} />
          <MealTotalRow label="Proteínas" value={totals.prot} unit="g" labelClassName="text-palette-red" valueClassName="text-palette-red" />
          <MealTotalRow label="Carboidratos" value={totals.carb} unit="g" labelClassName="text-palette-blue" valueClassName="text-palette-blue" />
          <MealTotalRow label="Gorduras" value={totals.fat} unit="g" labelClassName="text-palette-yellow" valueClassName="text-palette-yellow" />
          <MealTotalRow label="Fibras" value={totals.fiber} unit="g" labelClassName="text-primary" valueClassName="text-primary" />
          <MealTotalRow label="Sódio" value={totals.sodium} unit="mg" labelClassName="text-palette-slate" valueClassName="text-palette-slate" />
        </div>
      </div>
      <div className="mt-4 border-t border-border/60 pt-4 flex justify-center">
        <MealTotalDonut totals={totals} />
      </div>
    </div>
  );
}

function getMacroBreakdown(totals: MealTotals) {
  const proteinEnergy = totals.prot * 4;
  const carbEnergy = totals.carb * 4;
  const fatEnergy = totals.fat * 9;
  const totalEnergy = proteinEnergy + carbEnergy + fatEnergy;

  return {
    proteinEnergy,
    carbEnergy,
    fatEnergy,
    totalEnergy,
    proteinPct: totalEnergy > 0 ? (proteinEnergy / totalEnergy) * 100 : 0,
    carbPct: totalEnergy > 0 ? (carbEnergy / totalEnergy) * 100 : 0,
    fatPct: totalEnergy > 0 ? (fatEnergy / totalEnergy) * 100 : 0,
  };
}

function MealTotalRow({ label, value, unit, precision = 1, labelClassName = "text-muted-foreground", valueClassName = "text-foreground" }: { label: string; value: number; unit: string; precision?: number; labelClassName?: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className={labelClassName}>{label}</span>
      <span className={`font-medium ${valueClassName}`}>
        {value > 0 ? `${value.toFixed(precision)} ${unit}` : "—"}
      </span>
    </div>
  );
}

function MealTotalDonut({ totals }: { totals: MealTotals }) {
  const caloriesLabel = `${Math.round(totals.cal)} kcal`;

  const macro = getMacroBreakdown(totals);

  const proteinEnd = macro.proteinPct;
  const carbEnd = macro.proteinPct + macro.carbPct;
  const fatEnd = macro.proteinPct + macro.carbPct + macro.fatPct;

  const ringBackground =
    macro.totalEnergy > 0
      ? `conic-gradient(
          hsl(var(--palette-red)) 0 ${proteinEnd}%,
          hsl(var(--palette-blue)) ${proteinEnd}% ${carbEnd}%,
          hsl(var(--palette-yellow)) ${carbEnd}% ${fatEnd}%
        )`
      : "hsl(var(--border))";

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="relative flex h-[186px] w-[186px] items-center justify-center">
        <div className="absolute inset-0 rounded-full" style={{ background: ringBackground }} />
        <div className="absolute inset-[16%] rounded-full bg-card" />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
          <span className="text-2xl font-bold leading-none text-foreground">{caloriesLabel}</span>
        </div>
      </div>
      <div className="mt-3 grid w-full grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-palette-red">
            <span className="h-1.5 w-1.5 rounded-full bg-palette-red" />
            <span className="font-semibold">P</span>
          </div>
          <p className="mt-0.5 text-foreground">{totals.prot.toFixed(1)}g</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-palette-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-palette-blue" />
            <span className="font-semibold">C</span>
          </div>
          <p className="mt-0.5 text-foreground">{totals.carb.toFixed(1)}g</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-palette-yellow">
            <span className="h-1.5 w-1.5 rounded-full bg-palette-yellow" />
            <span className="font-semibold">G</span>
          </div>
          <p className="mt-0.5 text-foreground">{totals.fat.toFixed(1)}g</p>
        </div>
      </div>
    </div>
  );
}

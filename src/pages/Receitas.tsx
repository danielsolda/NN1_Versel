import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Clock, Trash2, ChefHat, BookOpen, Pencil } from "lucide-react";
import TacoFoodSearch from "@/components/shared/TacoFoodSearch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
 

const COMMON_UNITS = ["g", "mg", "kg", "ml", "L", "xíc", "col. sopa", "col. chá", "col. café", "unid", "fatia", "porção", "pote", "copo", "sachê", "pitada", "a gosto"];

interface Ingredient {
  id: string;
  food_name: string;
  quantity: string;
  unit: string;
  is_substitute?: boolean;
  substitute_type?: "food" | "group";
  substitute_target?: string;
  sort_order: number;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  prep_time: string | null;
  servings: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  ingredients?: Ingredient[];
}

export default function Receitas() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState(false);

  const loadRecipes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("recipes")
      .select("*")
      .eq("nutritionist_id", user.id)
      .order("created_at", { ascending: false });
    setRecipes((data as Recipe[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleCreate = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("recipes")
      .insert({ nutritionist_id: user.id, title: "Nova Receita" })
      .select("*")
      .single();
    if (data) {
      const recipe = { ...(data as Recipe), ingredients: [] };
      setSelectedRecipe(recipe);
      setEditing(true);
      loadRecipes();
    }
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    const { data: ingredients } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipe.id)
      .order("sort_order");
    setSelectedRecipe({
      ...recipe,
      ingredients: (ingredients || []).map((i: any) => ({
        ...i,
        quantity: i.quantity || "",
        unit: i.unit || "",
        calories: i.calories?.toString() || "",
        protein: i.protein?.toString() || "",
        carbs: i.carbs?.toString() || "",
        fat: i.fat?.toString() || "",
        fiber: i.fiber?.toString() || "",
        sodium: i.sodium?.toString() || "",
      })),
    });
    setEditing(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("recipes").delete().eq("id", id);
    toast.success("Receita excluída");
    setSelectedRecipe(null);
    setEditing(false);
    loadRecipes();
  };

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  if (editing && selectedRecipe) {
    return (
      <RecipeEditor
        recipe={selectedRecipe}
        onBack={() => {
          setEditing(false);
          setSelectedRecipe(null);
          loadRecipes();
        }}
        onDelete={() => handleDelete(selectedRecipe.id)}
      />
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3"><ChefHat className="h-6 w-6 text-primary" /><h1 className="page-title">Receitas</h1></div>
          <p className="page-lead">
            Crie, edite e organize suas receitas para usar nos planos alimentares.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 rounded-[26px]" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-border/60" />

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar receita..."
          className="pl-9 rounded-[26px]"
        />
      </div>

      {/* Recipe list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <ChefHat className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhuma receita encontrada</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search ? "Tente uma busca diferente." : "Crie sua primeira receita para começar."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleSelectRecipe(recipe)}
              className="group flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            >
              {recipe.image_url ? (
                <div className="mb-2 aspect-[3/2] w-full overflow-hidden rounded-md">
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="mb-2 flex aspect-[3/2] w-full items-center justify-center rounded-md bg-primary/5">
                  <BookOpen className="h-6 w-6 text-primary/30" />
                </div>
              )}
              <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                {recipe.title}
              </h3>
              {recipe.description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {recipe.description}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                {recipe.prep_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {recipe.prep_time}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Recipe Editor ─── */

interface RecipeEditorProps {
  recipe: Recipe;
  onBack: () => void;
  onDelete: () => void;
}

function RecipeEditor({ recipe: initial, onBack, onDelete }: RecipeEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description || "");
  const [prepTime, setPrepTime] = useState(initial.prep_time || "");
  
  const [notes, setNotes] = useState(initial.notes || "");
  const [imageUrl, setImageUrl] = useState(initial.image_url || "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(initial.ingredients || []);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = ingredients.reduce(
    (acc, i) => ({
      calories: acc.calories + (parseFloat(i.calories) || 0),
      protein: acc.protein + (parseFloat(i.protein) || 0),
      carbs: acc.carbs + (parseFloat(i.carbs) || 0),
      fat: acc.fat + (parseFloat(i.fat) || 0),
      fiber: acc.fiber + (parseFloat(i.fiber) || 0),
      sodium: acc.sodium + (parseFloat(i.sodium) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );


  const addIngredient = () => {
    const nextIngredient: Ingredient = {
      id: crypto.randomUUID(),
      food_name: "",
      quantity: "",
      unit: "g",
      sort_order: ingredients.length,
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      sodium: "",
    };

    setIngredients((prev) => [...prev, nextIngredient]);
    setActiveIngredientIndex(ingredients.length);
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
    setActiveIngredientIndex((current) => {
      if (current === null) return null;
      if (current === idx) return null;
      if (current > idx) return current - 1;
      return current;
    });
  };

  const updateIngredient = (idx: number, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, ...updates } : ing))
    );
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/recipes/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("meal-images").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar imagem");
      return;
    }
    const { data: urlData } = supabase.storage.from("meal-images").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from("recipes")
        .update({
          title,
          description: description || null,
          prep_time: prepTime || null,
          servings: null,
          notes: notes || null,
          image_url: imageUrl || null,
        })
        .eq("id", initial.id);

      await supabase.from("recipe_ingredients").delete().eq("recipe_id", initial.id);

      const validIngredients = ingredients.filter((i) => i.food_name.trim());
      if (validIngredients.length > 0) {
        await supabase.from("recipe_ingredients").insert(
          validIngredients.map((ing, idx) => ({
            recipe_id: initial.id,
            food_name: ing.food_name,
            quantity: ing.quantity || null,
            unit: ing.unit || null,
            sort_order: idx,
            calories: ing.calories ? parseFloat(ing.calories) : null,
            protein: ing.protein ? parseFloat(ing.protein) : null,
            carbs: ing.carbs ? parseFloat(ing.carbs) : null,
            fat: ing.fat ? parseFloat(ing.fat) : null,
            fiber: ing.fiber ? parseFloat(ing.fiber) : null,
            sodium: ing.sodium ? parseFloat(ing.sodium) : null,
          }))
        );
      }

      toast.success("Receita salva com sucesso!");
      onBack();
    } catch {
      toast.error("Erro ao salvar receita");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell mx-auto max-w-7xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="editable-field w-full max-w-md text-lg font-semibold"
            placeholder="Nome da receita"
          />
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          {/* Image - smaller */}
          <div>
            {imageUrl ? (
              <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg">
                <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <label className="flex aspect-[3/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/30 hover:bg-muted/50">
                <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                <span className="mt-1 text-xs text-muted-foreground">Adicionar foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a receita..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Prep time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tempo de preparo</label>
            <Input
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="Ex: 30 min"
              className="h-9"
            />
          </div>

          {/* Ingredients with macros */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Ingredientes</label>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addIngredient}>
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </div>
            {ingredients.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Nenhum ingrediente adicionado
              </p>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={ing.id} className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{ing.food_name || "Selecionar alimento"}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {(ing.quantity || "—")} {ing.unit || "g"} · {ing.calories || "—"} kcal
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setActiveIngredientIndex(idx)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeIngredient(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeIngredientIndex !== null && ingredients[activeIngredientIndex] && (
            <FoodItemModal
              open={activeIngredientIndex !== null}
              food={ingredients[activeIngredientIndex]}
              onClose={() => setActiveIngredientIndex(null)}
              onSave={(updates) => {
                updateIngredient(activeIngredientIndex, updates);
                setActiveIngredientIndex(null);
              }}
            />
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Modo de preparo / Observações</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Passo a passo da receita..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Sidebar - Totals */}
        <div className="space-y-3">
          <RecipeTotalsCard totals={totals} />
        </div>
      </div>
    </div>
  );
}

/* ─── Food Item Edit Modal ─── */
function FoodItemModal({ open, food, onClose, onSave, recipes, onImportRecipe }: {
  open: boolean;
  food: Ingredient;
  onClose: () => void;
  onSave: (updates: Partial<Ingredient>) => void;
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
      is_substitute: food.is_substitute ?? false,
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
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
                          onClick={() => { onImportRecipe(r.id); onClose(); }}
                        >
                          <ChefHat className="h-3 w-3 shrink-0 text-primary" />
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
                    checked={form.is_substitute === true}
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

            <div className="h-fit self-start rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Informação Nutricional (por 100g)
                {!selectedFromTaco && <span className="ml-1 text-[10px] font-normal text-primary">— editável</span>}
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

type RecipeTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
};

function RecipeTotalsCard({ totals }: { totals: RecipeTotals }) {
  const macro = getRecipeMacroBreakdown(totals);
  const caloriesLabel = `${Math.round(totals.calories)} kcal`;

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
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="text-xs font-semibold text-foreground">Totais Nutricionais</h4>

      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
            <div className="bg-palette-red" style={{ width: `${macro.proteinPct}%` }} />
            <div className="bg-palette-blue" style={{ width: `${macro.carbPct}%` }} />
            <div className="bg-palette-yellow" style={{ width: `${macro.fatPct}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px]">
            <span className="flex items-center gap-1 text-palette-red"><span className="h-1.5 w-1.5 rounded-full bg-palette-red" />P {totals.protein.toFixed(1)}g</span>
            <span className="flex items-center gap-1 text-palette-blue"><span className="h-1.5 w-1.5 rounded-full bg-palette-blue" />C {totals.carbs.toFixed(1)}g</span>
            <span className="flex items-center gap-1 text-palette-yellow"><span className="h-1.5 w-1.5 rounded-full bg-palette-yellow" />G {totals.fat.toFixed(1)}g</span>
          </div>
        </div>

        <div className="space-y-2">
          <RecipeTotalRow label="Calorias" value={totals.calories} unit="kcal" precision={0} labelClassName="text-palette-orange" valueClassName="text-palette-orange" />
          <RecipeTotalRow label="Proteínas" value={totals.protein} unit="g" labelClassName="text-palette-red" valueClassName="text-palette-red" />
          <RecipeTotalRow label="Carboidratos" value={totals.carbs} unit="g" labelClassName="text-palette-blue" valueClassName="text-palette-blue" />
          <RecipeTotalRow label="Gorduras" value={totals.fat} unit="g" labelClassName="text-palette-yellow" valueClassName="text-palette-yellow" />
          <RecipeTotalRow label="Fibras" value={totals.fiber} unit="g" labelClassName="text-primary" valueClassName="text-primary" />
          <RecipeTotalRow label="Sódio" value={totals.sodium} unit="mg" labelClassName="text-palette-slate" valueClassName="text-palette-slate" />
        </div>
      </div>

      <div className="mt-4 border-t border-border/60 pt-4 flex flex-col items-center">
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
            <p className="mt-0.5 text-foreground">{totals.protein.toFixed(1)}g</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center">
            <div className="flex items-center justify-center gap-1 text-palette-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-palette-blue" />
              <span className="font-semibold">C</span>
            </div>
            <p className="mt-0.5 text-foreground">{totals.carbs.toFixed(1)}g</p>
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
    </div>
  );
}

function getRecipeMacroBreakdown(totals: RecipeTotals) {
  const proteinEnergy = totals.protein * 4;
  const carbEnergy = totals.carbs * 4;
  const fatEnergy = totals.fat * 9;
  const totalEnergy = proteinEnergy + carbEnergy + fatEnergy;

  return {
    totalEnergy,
    proteinPct: totalEnergy > 0 ? (proteinEnergy / totalEnergy) * 100 : 0,
    carbPct: totalEnergy > 0 ? (carbEnergy / totalEnergy) * 100 : 0,
    fatPct: totalEnergy > 0 ? (fatEnergy / totalEnergy) * 100 : 0,
  };
}

function RecipeTotalRow({ label, value, unit, precision = 1, labelClassName = "text-muted-foreground", valueClassName = "text-foreground" }: { label: string; value: number; unit: string; precision?: number; labelClassName?: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className={labelClassName}>{label}</span>
      <span className={`font-medium ${valueClassName}`}>
        {value > 0 ? `${value.toFixed(precision)} ${unit}` : "—"}
      </span>
    </div>
  );
}

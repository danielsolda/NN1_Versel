import { useState, useEffect, useCallback } from "react";
import { UtensilsCrossed, Clock, FileText, Calendar, User, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PinterestSlideLayout from "@/components/shared/PinterestSlideLayout";
import MealPinterestCard from "@/components/shared/MealPinterestCard";

interface MealPlan {
  id: string;
  title: string;
  notes: string | null;
  created_at: string;
}

interface Meal {
  id: string;
  name: string;
  time: string | null;
  description: string | null;
  sort_order: number;
  meal_options: MealOption[];
  images: MealImage[];
}

interface MealOption {
  id: string;
  name: string;
  image_url: string | null;
  meal_food_items: FoodItem[];
}

interface FoodItem {
  id: string;
  food_name: string;
  quantity: string | null;
  unit: string | null;
  is_substitute: boolean;
}

interface MealImage {
  id: string;
  image_url: string;
  caption: string | null;
}

interface MealFoodItemRow {
  id: string;
  food_name: string;
  quantity: string | null;
  unit: string | null;
  is_substitute: boolean;
}

interface MealOptionRow {
  id: string;
  meal_id: string;
  name: string;
  image_url: string | null;
  meal_food_items: MealFoodItemRow[];
}

interface MealImageRow {
  id: string;
  meal_id: string;
  image_url: string;
  caption: string | null;
}

export default function PatientPlanos() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlanMeals = useCallback(async (planId: string) => {
    const { data: mealsData } = await supabase
      .from("meals")
      .select("*")
      .eq("meal_plan_id", planId)
      .order("sort_order");

    if (!mealsData || mealsData.length === 0) {
      setMeals([]);
      return;
    }

    const mealIds = mealsData.map((m) => m.id);

    const [optionsRes, imagesRes] = await Promise.all([
      supabase.from("meal_options").select(`*, meal_food_items(*)`).in("meal_id", mealIds).order("sort_order"),
      supabase.from("meal_images").select("*").in("meal_id", mealIds).order("sort_order"),
    ]);

    const mealOptions = (optionsRes.data || []) as MealOptionRow[];
    const mealImages = (imagesRes.data || []) as MealImageRow[];

    const builtMeals: Meal[] = mealsData.map((m) => ({
      id: m.id,
      name: m.name,
      time: m.time,
      description: m.description,
      sort_order: m.sort_order,
      meal_options: mealOptions
        .filter((o) => o.meal_id === m.id)
        .map((o) => ({
          id: o.id,
          name: o.name,
          image_url: o.image_url || null,
          meal_food_items: (o.meal_food_items || []).map((f) => ({
            id: f.id,
            food_name: f.food_name,
            quantity: f.quantity,
            unit: f.unit,
            is_substitute: f.is_substitute,
          })),
        })),
      images: mealImages
        .filter((img) => img.meal_id === m.id)
        .map((img) => ({
          id: img.id,
          image_url: img.image_url,
          caption: img.caption,
        })),
    }));

    setMeals(builtMeals);
  }, []);

  const fetchMealPlans = useCallback(async () => {
    try {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (patient) {
        const { data: plans } = await supabase
          .from("meal_plans")
          .select("*")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false });

        setMealPlans(plans || []);
        if (plans && plans.length > 0) {
          setSelectedPlan(plans[0]);
          await fetchPlanMeals(plans[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchPlanMeals]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const selectedMeal = meals.find((m) => m.id === selectedMealId);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="page-shell mx-auto max-w-7xl">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <div className="page-shell mx-auto max-w-7xl">
        <div className="page-header">
          <h1 className="page-title">Meus Planos Alimentares</h1>
          <p className="page-lead">Acesse os planos personalizados criados pela sua nutricionista</p>
        </div>

        <div className="mt-6">
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground/70" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
              <p className="text-sm text-muted-foreground text-center">
                Aguarde sua nutricionista criar um plano alimentar personalizado para você.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="page-header">
        <h1 className="page-title">Meus Planos Alimentares</h1>
        <p className="page-lead">Acesse os planos personalizados criados pela sua nutricionista</p>
      </div>

      {/* Plan selector */}
      {mealPlans.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-none">
          {mealPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => {
                setSelectedPlan(plan);
                setSelectedMealId(null);
                fetchPlanMeals(plan.id);
              }}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedPlan?.id === plan.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/60 text-foreground hover:border-surface-hover-border hover:bg-surface-hover hover:text-primary"
              }`}
            >
              {plan.title}
            </button>
          ))}
        </div>
      )}

      {selectedPlan && (
        <PinterestSlideLayout
          selectedId={selectedMealId}
          onBack={() => setSelectedMealId(null)}
          gridContent={
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedPlan.title}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedPlan.created_at)} · {meals.length} refeições
                  </p>
                </div>
              </div>

              {selectedPlan.notes && (
                <div className="mb-5 rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground leading-relaxed">
                  {selectedPlan.notes}
                </div>
              )}

              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {meals.map((meal) => {
                  const firstImage = meal.images[0];
                  const totalItems = meal.meal_options.reduce(
                    (acc, opt) => acc + opt.meal_food_items.length,
                    0
                  );
                  return (
                    <div key={meal.id} className="break-inside-avoid">
                      <MealPinterestCard
                        imageUrl={firstImage?.image_url}
                        title={meal.name}
                        subtitle={meal.description || undefined}
                        time={meal.time}
                        itemCount={totalItems}
                        badgeText={
                          meal.meal_options.length > 1
                            ? `${meal.meal_options.length} opções`
                            : undefined
                        }
                        onClick={() => setSelectedMealId(meal.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          }
          detailContent={
            selectedMeal ? <MealDetail meal={selectedMeal} /> : null
          }
        />
      )}
    </div>
  );
}

function MealDetail({ meal }: { meal: Meal }) {
  const heroImage = meal.images[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sticky image on the side */}
        <div className="md:w-80 md:shrink-0">
          <div className="md:sticky md:top-4 space-y-3">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
              {heroImage ? (
                <img src={heroImage.image_url} alt={meal.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h2 className="text-xl font-bold text-white">{meal.name}</h2>
                {meal.time && (
                  <div className="mt-1 flex items-center gap-1.5 text-white/80 text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    {meal.time}
                  </div>
                )}
              </div>
            </div>

            {meal.images.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {meal.images.slice(1).map((img) => (
                  <div key={img.id} className="aspect-square overflow-hidden rounded-xl">
                    <img src={img.image_url} alt={img.caption || meal.name} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {meal.description && (
              <p className="text-sm text-muted-foreground leading-relaxed bg-card rounded-xl border border-border/50 p-4">
                {meal.description}
              </p>
            )}
          </div>
        </div>

        {/* Main content: Option cards grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {meal.meal_options.map((option) => (
              <div
                key={option.id}
                  className="group overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
              >
                {/* Option image */}
                <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
                  {option.image_url ? (
                    <img
                      src={option.image_url}
                      alt={option.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 transition-colors group-hover:text-primary">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {option.name}
                  </h4>

                  <div className="space-y-1.5">
                    {option.meal_food_items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                          item.is_substitute
                            ? "bg-palette-amber/10 dark:bg-palette-amber/15"
                            : "bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-foreground/30" />
                          <span className="font-medium text-foreground">{item.food_name}</span>
                          {item.is_substitute && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-palette-amber/30 text-palette-amber dark:text-palette-amber">
                              Sub
                            </Badge>
                          )}
                        </div>
                        {(item.quantity || item.unit) && (
                          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap ml-2">
                            {item.quantity} {item.unit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

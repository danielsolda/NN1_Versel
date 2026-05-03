import { useState } from "react";
import { Database, Search, Sparkles, Apple } from "lucide-react";
import FoodSearch from "@/components/shared/TacoFoodSearch";
import CustomFoodsManager from "@/components/shared/CustomFoodsManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FoodSearchResult {
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

export default function Alimentos() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);

  const macroCards = [
    { label: "Kcal", value: selectedFood?.calories?.toFixed(0) || "—" },
    { label: "Prot", value: selectedFood?.protein?.toFixed(1) || "—" },
    { label: "Carb", value: selectedFood?.carbs?.toFixed(1) || "—" },
    { label: "Gord", value: selectedFood?.fat?.toFixed(1) || "—" },
    { label: "Fibra", value: selectedFood?.fiber?.toFixed(1) || "—" },
    { label: "Sódio", value: selectedFood?.sodium?.toFixed(1) || "—" },
  ];

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="page-header">
        <div className="flex items-center gap-3"><Apple className="h-6 w-6 text-primary" /><h1 className="page-title">Alimentos</h1></div>
        <p className="page-lead">
          Busque alimentos cadastrados e gerencie suas tabelas personalizadas para usar nas receitas e planos.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <FoodSearch
              value={searchValue}
              onChange={(name) => {
                setSearchValue(name);
                setSelectedFood(null);
              }}
              onSelect={(food) => {
                setSearchValue(food.description);
                setSelectedFood(food);
              }}
              className="!h-10 !text-sm"
            />
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => document.getElementById("food-preview")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>

        {selectedFood ? (
          <div id="food-preview" className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{selectedFood.description}</h3>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                {selectedFood.nutritionist_id ? "Personalizado" : "Base padrão"}
              </Badge>
              <span className="text-xs text-muted-foreground">Categoria: {selectedFood.category}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {macroCards.map((macro) => (
                <div key={macro.label} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{macro.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{macro.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-5 text-center">
            <Sparkles className="mx-auto h-7 w-7 text-muted-foreground/30" />
            <p className="mt-2 text-sm font-medium text-foreground">Nenhum alimento selecionado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pesquise por nome para ver os detalhes nutricionais aqui.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-foreground">Tabelas de alimentos</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Gerencie as bases de alimentos disponíveis para usar nas receitas e nos planos.
              </p>
            </div>
          </div>

          <CustomFoodsManager />
        </div>
      </div>
    </div>
  );
}

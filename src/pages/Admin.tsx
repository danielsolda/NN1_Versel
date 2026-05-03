import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ShieldCheck, UserRoundPlus, UsersRound, RefreshCw, Mail, IdCard, Phone, Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";

interface NutritionistListItem {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  phone: string | null;
  crn: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface NutritionistFormState {
  full_name: string;
  email: string;
  specialty: string;
  phone: string;
  crn: string;
}

const emptyFormState: NutritionistFormState = {
  full_name: "",
  email: "",
  specialty: "",
  phone: "",
  crn: "",
};

async function getAdminNutritionists(): Promise<NutritionistListItem[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-nutritionists`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Erro ao carregar nutricionistas.");
  }

  return result.nutritionists ?? [];
}

async function createNutritionistAccount(form: NutritionistFormState) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-nutritionists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Erro ao criar nutricionista.");
  }

  return result as { password: string; nutritionist: NutritionistListItem };
}

export default function Admin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<NutritionistFormState>(emptyFormState);

  const { data: nutritionists = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-nutritionists"],
    queryFn: getAdminNutritionists,
  });

  const createMutation = useMutation({
    mutationFn: createNutritionistAccount,
    onSuccess: (result) => {
      toast.success(`Conta criada. Senha padrão: ${result.password}`);
      setForm(emptyFormState);
      queryClient.invalidateQueries({ queryKey: ["admin-nutritionists"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erro ao criar nutricionista.");
    },
  });

  const initials = useMemo(() => {
    return form.full_name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [form.full_name]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="page-title">Painel Admin</h1>
          <p className="page-lead">
            Crie contas de nutricionista e acompanhe os acessos ativos.
          </p>
        </div>

     
        <Button variant="outline" className="gap-2 self-start lg:self-auto text-destructive hover:text-destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      <div className="mt-4 h-px w-full bg-border/60" />

      <div className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-dashed border-2 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <UserRoundPlus className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Criar conta do nutricionista</h2>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                  placeholder="Ex.: Ana Souza"
                  required
                  className="editable-field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="nutricionista@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  value={form.specialty}
                  onChange={(event) => setForm((prev) => ({ ...prev, specialty: event.target.value }))}
                  placeholder="Ex.: Esportiva, clínica..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="crn">CRN</Label>
                  <Input
                    id="crn"
                    value={form.crn}
                    onChange={(event) => setForm((prev) => ({ ...prev, crn: event.target.value }))}
                    placeholder="00000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Novas contas entram com senha <span className="font-semibold text-foreground">123456</span>.
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta do nutricionista"}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <IdCard className="h-3.5 w-3.5" />
                Prévia das iniciais
              </span>
              <span className="font-semibold text-foreground">{initials || "--"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Nutricionistas</p>
                <p className="text-xs text-muted-foreground">
                  {nutritionists.length} conta{nutritionists.length !== 1 ? "s" : ""} cadastrada{nutritionists.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : nutritionists.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <UsersRound className="h-8 w-8 text-muted-foreground/60" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum nutricionista encontrado</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Use o formulário ao lado para criar a primeira conta de nutricionista.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {nutritionists.map((nutritionist) => {
                const displayInitials = nutritionist.full_name
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <Card key={nutritionist.id} className="overflow-hidden transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar className="h-12 w-12 shrink-0 border border-border">
                          <AvatarImage src={nutritionist.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground">{displayInitials || "--"}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-foreground">{nutritionist.full_name}</h3>
                          <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5" />
                              {nutritionist.email}
                            </p>
                            {nutritionist.specialty && <p className="truncate">{nutritionist.specialty}</p>}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {nutritionist.crn && (
                              <span className="rounded-full border border-border bg-background px-2 py-1">
                                CRN {nutritionist.crn}
                              </span>
                            )}
                            {nutritionist.phone && (
                              <span className="rounded-full border border-border bg-background px-2 py-1">
                                <Phone className="mr-1 inline h-3 w-3" />
                                {nutritionist.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-right text-xs text-muted-foreground sm:min-w-28">
                        <p className="font-medium text-foreground">Senha padrão</p>
                        <p className="mt-1 text-sm font-semibold text-primary">123456</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Target } from "lucide-react";
import HabitTrackingGrid from "@/components/metas/HabitTrackingGrid";

export default function PatientMetas() {
  const { user, loading: authLoading } = useAuth();

  // Find patient record for current user
  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["my-patient-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("patients")
        .select("id")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (authLoading || loadingPatient) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl">
      <div className="page-header">
        <h1 className="page-title">Minhas Metas</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Acompanhe seu progresso diário.</p>

      <div className="mt-6">
        {patient ? (
          <HabitTrackingGrid patientId={patient.id} canToggle />
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <Target className="h-8 w-8 text-muted-foreground/70" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma meta encontrada</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Sua nutricionista ainda não vinculou metas ao seu acesso.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

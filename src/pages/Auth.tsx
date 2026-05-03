import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import logoFull from "@/assets/logo-full.png";
import foodPatternBg from "@/assets/food-pattern-bg.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const redirectByRole = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles = (data || []).map(({ role }) => role);
    if (roles.includes("admin")) {
      navigate("/admin", { replace: true });
      return;
    }
    if (roles.includes("nutritionist")) {
      navigate("/", { replace: true });
      return;
    }

    navigate("/p", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await redirectByRole(session.user.id);
      }
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await redirectByRole(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectByRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, signup_role: "patient" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell relative flex min-h-screen flex-col items-center justify-center bg-background overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage: `url(${foodPatternBg})`,
          backgroundSize: "1400px",
          backgroundRepeat: "repeat",
          maskImage: "linear-gradient(to top, transparent 5%, black 35%)",
          WebkitMaskImage: "linear-gradient(to top, transparent 5%, black 35%)",
        }}
      />
      <div className="relative z-10 w-full max-w-sm flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <img src={logoFull} alt="NotionDiet" className="h-40 mb-1" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 w-full space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required className="editable-field" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-foreground underline-offset-4 hover:underline">
            {isLogin ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
      <footer className="relative z-10 pb-6 pt-4 text-center text-xs text-muted-foreground/60">
        © 2026 NotionDiet. Todos os direitos reservados.
      </footer>
    </div>
  );
}

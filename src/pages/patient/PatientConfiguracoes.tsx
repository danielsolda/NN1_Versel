import { useState, useEffect } from "react";
import { LogOut, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PatientConfiguracoes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    weight: "",
    height: "",
    goal: "",
    allergies: "",
    medical_conditions: "",
    phone: "",
    cpf: "",
    address: "",
    birthdate: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("patients")
        .select("name, weight, height, goal, allergies, medical_conditions, phone, cpf, address, birthdate")
        .eq("auth_user_id", user.id)
        .single();
      if (data) {
        setProfile({
          name: data.name || "",
          weight: data.weight?.toString() || "",
          height: data.height?.toString() || "",
          goal: data.goal || "",
          allergies: data.allergies || "",
          medical_conditions: data.medical_conditions || "",
          phone: data.phone || "",
          cpf: data.cpf || "",
          address: (data as any).address || "",
          birthdate: data.birthdate || "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setChangingPassword(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setChangingPassword(false);
      toast.error("Senha atual incorreta.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("patients")
      .update({
        name: profile.name || null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        goal: profile.goal || null,
        allergies: profile.allergies || null,
        medical_conditions: profile.medical_conditions || null,
        phone: profile.phone || null,
        cpf: profile.cpf || null,
        address: profile.address || null,
        birthdate: profile.birthdate || null,
      } as any)
      .eq("auth_user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar dados.");
    } else {
      toast.success("Dados salvos com sucesso!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="page-shell mx-auto max-w-7xl space-y-6">
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-lead">Gerencie sua conta e dados pessoais.</p>
      </div>

      {/* Two-column grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: Personal Data */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-foreground">Dados Pessoais</h2>
          <p className="text-xs text-muted-foreground">Estas informações serão visíveis para o seu nutricionista.</p>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={profile.birthdate}
                    onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Endereço</Label>
                <Input
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                    placeholder="Ex: 72.5"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Altura (cm)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                    placeholder="Ex: 170"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Objetivo</Label>
                <Input
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                  placeholder="Ex: Perder peso, ganhar massa muscular..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Alergias / Intolerâncias</Label>
                <Textarea
                  value={profile.allergies}
                  onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                  placeholder="Ex: Intolerância à lactose, alergia a frutos do mar..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Condições Médicas</Label>
                <Textarea
                  value={profile.medical_conditions}
                  onChange={(e) => setProfile({ ...profile, medical_conditions: e.target.value })}
                  placeholder="Ex: Diabetes tipo 2, hipertensão..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
              <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="h-8 text-xs gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Salvar Dados</>}
              </Button>
            </div>
          )}
        </div>

        {/* Right column: Account & read-only info */}
        <div className="space-y-6">
          {/* Read-only identifiers */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Nome</p>
              <p className="mt-0.5 text-sm text-foreground">{profile.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">CPF</p>
              <p className="mt-0.5 text-sm text-foreground">{profile.cpf || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="mt-0.5 text-sm text-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Change password */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Alterar Senha</h2>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Senha atual</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nova senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="h-8 text-sm pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Confirmar nova senha</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <Button type="submit" size="sm" disabled={changingPassword} className="h-8 text-xs gap-1.5">
                {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Alterar Senha"}
              </Button>
            </form>
          </div>

          <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}

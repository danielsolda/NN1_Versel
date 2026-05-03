import { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Camera, LogOut, ImagePlus, Eye, EyeOff, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  full_name: string;
  phone: string;
  crn: string;
  specialty: string;
  avatar_url: string;
  cover_url: string;
  bio: string;
}

export default function Configuracoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone: "",
    crn: "",
    specialty: "",
    avatar_url: "",
    cover_url: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("nutritionists")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || user!.user_metadata?.full_name || "",
        phone: data.phone || "",
        crn: data.crn || "",
        specialty: data.specialty || "",
        avatar_url: data.avatar_url || "",
        cover_url: (data as any).cover_url || "",
        bio: (data as any).bio || "",
      });
    } else {
      setProfile((p) => ({
        ...p,
        full_name: user!.user_metadata?.full_name || "",
      }));
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("nutritionists")
        .upsert({
          user_id: user!.id,
          full_name: profile.full_name,
          phone: profile.phone,
          crn: profile.crn,
          specialty: profile.specialty,
          avatar_url: profile.avatar_url,
          cover_url: profile.cover_url,
          bio: profile.bio,
        } as any, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Perfil salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      await supabase
        .from("nutritionists")
        .upsert({ user_id: user!.id, avatar_url: publicUrl } as any, { onConflict: "user_id" });
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/cover.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(path);

      setProfile((p) => ({ ...p, cover_url: publicUrl }));
      await supabase
        .from("nutritionists")
        .upsert({ user_id: user!.id, cover_url: publicUrl } as any, { onConflict: "user_id" });
      toast.success("Capa atualizada!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingCover(false);
    }
  };

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
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-3"><Settings className="h-6 w-6 text-primary" /><h1 className="page-title">Configurações</h1></div>
        <p className="page-lead">Gerencie seu perfil e preferências.</p>
      </div>

      {/* Hero: Cover + Avatar */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div
          className="relative h-36 bg-muted cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Capa" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-muted-foreground">Clique para adicionar uma capa</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadingCover ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <ImagePlus className="h-5 w-5 text-white" />
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        <div className="relative px-5 pb-4">
          <div className="relative -mt-10">
            <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="mt-2">
            <p className="font-medium text-foreground">{profile.full_name || "Sem nome"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: Profile Data */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-foreground">Dados do Perfil</h2>
          <p className="text-xs text-muted-foreground">Informações visíveis para seus pacientes.</p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome completo</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Seu nome"
                  className="editable-field h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">CRN</Label>
                <Input
                  value={profile.crn}
                  onChange={(e) => setProfile({ ...profile, crn: e.target.value })}
                  placeholder="CRN-0 00000"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Especialidade</Label>
                <Input
                  value={profile.specialty}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                  placeholder="Ex: Nutrição Esportiva"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bio</Label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Uma breve descrição sobre você"
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <Button size="sm" onClick={saveProfile} disabled={saving} className="h-8 text-xs gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Salvar Dados</>}
            </Button>
          </div>
        </div>

        {/* Right column: Password + Logout */}
        <div className="space-y-6">
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

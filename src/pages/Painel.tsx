import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, ImagePlus, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  full_name: string;
  specialty: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
}

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export default function Painel() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    specialty: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [showCaptionFor, setShowCaptionFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [profileRes, postsRes] = await Promise.all([
      supabase.from("nutritionists").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("posts").select("*").eq("nutritionist_id", user!.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) {
      const d = profileRes.data as any;
      setProfile({
        full_name: d.full_name || "",
        specialty: d.specialty || "",
        bio: d.bio || "",
        avatar_url: d.avatar_url || "",
        cover_url: d.cover_url || "",
      });
    }

    if (postsRes.data) {
      setPosts(postsRes.data as any);
    }

    setLoading(false);
  };

  const handleUploadPost = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const path = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(path);

      const { data, error } = await supabase
        .from("posts")
        .insert({ nutritionist_id: user!.id, image_url: publicUrl, caption: caption || null } as any)
        .select()
        .single();

      if (error) throw error;
      setPosts((prev) => [(data as any), ...prev]);
      setCaption("");
      toast.success("Postagem publicada!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Postagem removida.");
    } catch (err: any) {
      toast.error(err.message);
    }
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
    <div className="page-shell mx-auto max-w-7xl">
      <div className="page-header mb-6">
        <div className="flex items-center gap-3"><LayoutGrid className="h-6 w-6 text-primary" /><h1 className="page-title">Painel</h1></div>
      </div>
      {/* Cover + Profile header */}
      <div className="rounded-b-lg overflow-hidden border-b border-border">
        <div className="h-36 bg-muted">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="Capa" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="px-5 pb-4">
          <div className="relative -mt-10">
            <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-2">
            <h1 className="text-lg font-bold text-foreground">{profile.full_name || "Nutricionista"}</h1>
            {profile.specialty && <p className="text-sm text-muted-foreground">{profile.specialty}</p>}
            {profile.bio && <p className="mt-1 text-sm text-foreground/80">{profile.bio}</p>}
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{posts.length}</strong> publicações</span>
          </div>
        </div>
      </div>

      {/* New post */}
      <div className="px-5 mt-6">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Legenda da postagem (opcional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="h-8 text-sm border-border/60 shadow-none focus-visible:ring-1 flex-1"
          />
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Publicar</>}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPost} />
        </div>
      </div>

      {/* Posts grid */}
      <div className="px-5 mt-6">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImagePlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Publicar" para adicionar sua primeira imagem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-sm"
                onClick={() => setShowCaptionFor(showCaptionFor === post.id ? null : post.id)}
              >
                <img
                  src={post.image_url}
                  alt={post.caption || "Post"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post.id);
                    }}
                    className="rounded-full bg-destructive p-1.5 text-destructive-foreground hover:opacity-90"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {showCaptionFor === post.id && post.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5">
                    <p className="text-xs text-white">{post.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

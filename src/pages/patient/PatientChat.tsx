import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, ImageIcon, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientRecord {
  id: string;
  nutritionist_id: string;
}

interface NutriProfile {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface Message {
  id: string;
  conversation_nutritionist_id: string;
  conversation_patient_id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

export default function PatientChat() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: patientRecord, isLoading: loadingPatient } = useQuery<PatientRecord | null>({
    queryKey: ["my-patient-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, nutritionist_id")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Fetch nutritionist profile
  const { data: nutriProfile } = useQuery<NutriProfile | null>({
    queryKey: ["nutri-profile", patientRecord?.nutritionist_id],
    queryFn: async () => {
      if (!patientRecord) return null;
      const { data, error } = await supabase
        .from("nutritionists")
        .select("full_name, avatar_url, phone")
        .eq("user_id", patientRecord.nutritionist_id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!patientRecord,
  });

  const nutriName = nutriProfile?.full_name || "Nutricionista";
  const nutriInitial = nutriName.charAt(0).toUpperCase();
  const nutriAvatar = nutriProfile?.avatar_url;
  const whatsappUrl = buildWhatsAppUrl(nutriProfile?.phone);

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["patient-messages", patientRecord?.id],
    queryFn: async () => {
      if (!patientRecord) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_patient_id", patientRecord.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!patientRecord,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["patient-unread-count", patientRecord?.id],
    queryFn: async () => {
      if (!patientRecord || !user) return 0;
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_patient_id", patientRecord.id)
        .neq("sender_user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!patientRecord && !!user,
  });

  const markAsRead = useCallback(async () => {
    if (!user || !patientRecord) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_patient_id", patientRecord.id)
      .neq("sender_user_id", user.id)
      .is("read_at", null);
    queryClient.invalidateQueries({ queryKey: ["patient-unread-count", patientRecord.id] });
  }, [user, patientRecord, queryClient]);

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["nutritionist-posts", patientRecord?.nutritionist_id],
    queryFn: async () => {
      if (!patientRecord) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("id, image_url, caption, created_at")
        .eq("nutritionist_id", patientRecord.nutritionist_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientRecord,
  });

  // Realtime
  useEffect(() => {
    if (!patientRecord) return;
    const channel = supabase
      .channel(`patient-chat-${patientRecord.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_patient_id=eq.${patientRecord.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patient-messages", patientRecord.id] });
          queryClient.invalidateQueries({ queryKey: ["patient-unread-count", patientRecord.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [patientRecord, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read on mount
  useEffect(() => {
    if (patientRecord && user) markAsRead();
  }, [patientRecord, user, markAsRead]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !patientRecord) throw new Error("Missing data");
      const { error } = await supabase.from("messages").insert({
        conversation_nutritionist_id: patientRecord.nutritionist_id,
        conversation_patient_id: patientRecord.id,
        sender_user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["patient-messages", patientRecord?.id] });
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: Message[] }[]>((groups, msg) => {
    const msgDate = new Date(msg.created_at);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && isSameDay(new Date(lastGroup.date), msgDate)) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: msg.created_at, messages: [msg] });
    }
    return groups;
  }, []);

  if (loadingPatient) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!patientRecord) {
    return (
      <div className="page-shell mx-auto max-w-7xl">
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted/50 p-4 mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground/70" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum chat encontrado</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Seu acesso ainda não possui uma conversa vinculada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-2.9rem-env(safe-area-inset-bottom))] md:h-[100dvh]">
      <Tabs
        defaultValue="chat"
        onValueChange={(v) => { if (v === "chat") markAsRead(); }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Tabs header */}
        <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-4 pt-3 pb-0">
          <TabsList className="bg-transparent p-0 h-auto gap-4">
            <TabsTrigger
              value="chat"
              className="relative bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-1 pb-2.5 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Chat
              {unreadCount > 0 && (
                <span className="ml-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-1 pb-2.5 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground transition-colors"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Postagens
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
          {/* Chat header with nutritionist info */}
          <div className="shrink-0 border-b border-border bg-card/50 px-4 sm:px-6 py-2.5 flex items-center gap-3">
            {nutriAvatar ? (
              <img src={nutriAvatar} alt={nutriName} className="h-9 w-9 rounded-full object-cover border border-border" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <span className="text-sm font-semibold">{nutriInitial}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{nutriName}</p>
              <p className="text-[11px] text-muted-foreground">Sua nutricionista</p>
            </div>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
            {loadingMessages ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Card className="w-full max-w-md border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted/50 p-4 mb-4">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum chat encontrado</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      Envie a primeira mensagem para começar a conversa com sua nutricionista.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-1">
                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[11px] font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-0.5 rounded-full border border-border">
                        {formatDateLabel(group.date)}
                      </span>
                    </div>
                    {/* Messages */}
                    <div className="space-y-1">
                      {group.messages.map((msg, idx) => {
                        const isMe = msg.sender_user_id === user?.id;
                        const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                        const isConsecutive = prevMsg?.sender_user_id === msg.sender_user_id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"} ${!isConsecutive ? "mt-3" : "mt-0.5"}`}
                          >
                            {/* Avatar for nutritionist */}
                            {!isMe && !isConsecutive && (
                              nutriAvatar ? (
                                <img src={nutriAvatar} alt={nutriName} className="h-7 w-7 shrink-0 rounded-full object-cover mr-2 mt-auto mb-0.5 border border-border" />
                              ) : (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary mr-2 mt-auto mb-0.5">
                                  <span className="text-xs font-semibold">{nutriInitial}</span>
                                </div>
                              )
                            )}
                            {!isMe && isConsecutive && <div className="w-7 mr-2 shrink-0" />}

                            <div
                              className={`max-w-[78%] sm:max-w-[70%] px-3.5 py-2 text-sm leading-relaxed ${
                                isMe
                                  ? `bg-primary text-primary-foreground ${!isConsecutive ? "rounded-2xl rounded-br-lg" : "rounded-2xl rounded-br-lg"}`
                                  : `bg-card border border-border text-foreground ${!isConsecutive ? "rounded-2xl rounded-bl-lg" : "rounded-2xl rounded-bl-lg"}`
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[10px] mt-0.5 text-right ${isMe ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>
                                {format(new Date(msg.created_at), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-3 sm:px-6 py-3">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={messageText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva uma mensagem..."
                    rows={1}
                    className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-colors"
                    disabled={sendMutation.isPending}
                    style={{ minHeight: "42px", maxHeight: "120px" }}
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  className="h-[42px] w-[42px] rounded-full shrink-0 shadow-sm"
                  disabled={sendMutation.isPending || !messageText.trim()}
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="fixed bottom-24 right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-palette-whatsapp text-white shadow-none transition-transform hover:-translate-y-0.5 hover:bg-palette-whatsapp-hover md:bottom-6 md:right-6"
              aria-label="Abrir conversa no WhatsApp"
              title="Abrir conversa no WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
        </TabsContent>

        {/* Posts tab */}
        <TabsContent value="posts" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="px-4 sm:px-6 py-4">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-base font-medium text-foreground">Nenhuma postagem</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Quando sua nutricionista publicar conteúdos, eles aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="max-w-lg mx-auto space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <img src={post.image_url} alt="" className="w-full aspect-[4/3] object-cover" />
                      <div className="px-4 py-3">
                        {post.caption && (
                          <p className="text-sm text-foreground leading-relaxed">{post.caption}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {format(new Date(post.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

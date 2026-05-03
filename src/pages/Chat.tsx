import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  auth_user_id: string | null;
}

interface Message {
  id: string;
  conversation_nutritionist_id: string;
  conversation_patient_id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: patients = [], isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["patients-with-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, email, phone, auth_user_id")
        .eq("nutritionist_id", user!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: unreadCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["unread-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("conversation_patient_id")
        .is("read_at", null)
        .neq("sender_user_id", user!.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((row) => {
        counts[row.conversation_patient_id] = (counts[row.conversation_patient_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["messages", selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_patient_id", selectedPatient.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!selectedPatient,
  });

  const markAsRead = useCallback(async (patientId: string) => {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_patient_id", patientId)
      .neq("sender_user_id", user.id)
      .is("read_at", null);
    queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
  }, [user, queryClient]);

  const handleSelectPatient = useCallback((p: Patient) => {
    setSelectedPatient(p);
    markAsRead(p.id);
  }, [markAsRead]);

  useEffect(() => {
    if (!selectedPatient) return;
    const channel = supabase
      .channel(`chat-${selectedPatient.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_patient_id=eq.${selectedPatient.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["messages", selectedPatient.id] });
          queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
          if (payload.new && (payload.new as Message).sender_user_id !== user?.id) {
            markAsRead(selectedPatient.id);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedPatient, queryClient, user, markAsRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedPatient) throw new Error("Missing data");
      const { error } = await supabase.from("messages").insert({
        conversation_nutritionist_id: user.id,
        conversation_patient_id: selectedPatient.id,
        sender_user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedPatient?.id] });
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
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

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

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const showChatOnMobile = !!selectedPatient;
  const whatsappUrl = selectedPatient ? buildWhatsAppUrl(selectedPatient.phone) : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.25rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-0px)]">
      <div className="flex-1 flex overflow-hidden">
        <div className={`${showChatOnMobile ? "hidden md:flex" : "flex"} w-full md:w-72 lg:w-80 flex-col border-r border-border bg-card`}>
          <div className="shrink-0 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3"><MessageCircle className="h-6 w-6 text-primary" /><h1 className="text-lg font-semibold text-foreground">Chat</h1></div>
            <p className="text-xs text-muted-foreground">Converse com seus pacientes</p>
          </div>
          <ScrollArea className="flex-1">
            {loadingPatients ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : patients.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">Nenhum paciente encontrado.</p>
            ) : (
              <div className="p-2 space-y-0.5">
                {patients.map((p) => {
                  const unread = unreadCounts[p.id] || 0;
                  const active = selectedPatient?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={`group w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-200 flex items-center gap-3 ${
                        active
                          ? "border-surface-hover-border bg-surface-active shadow-sm"
                          : "border-border/60 bg-card hover:-translate-y-0.5 hover:border-surface-hover-border hover:bg-surface-hover"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${active ? "bg-surface-active text-surface-active-foreground" : "bg-muted text-muted-foreground group-hover:bg-surface-hover group-hover:text-primary"}`}>
                        <span className="text-xs font-semibold">{getInitials(p.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate transition-colors ${active ? "font-medium text-surface-active-foreground" : "text-foreground group-hover:text-primary"}`}>{p.name}</p>
                        {p.email && <p className="text-[11px] text-muted-foreground truncate">{p.email}</p>}
                      </div>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground px-1.5">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className={`${!showChatOnMobile ? "hidden md:flex" : "flex"} flex-1 flex-col overflow-hidden`}>
          {!selectedPatient ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <p className="text-base font-medium text-foreground">Selecione um paciente</p>
                <p className="text-sm text-muted-foreground mt-1">Escolha uma conversa na lista ao lado.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <span className="text-sm font-semibold">{getInitials(selectedPatient.name)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{selectedPatient.name}</p>
                  {selectedPatient.email && <p className="text-[11px] text-muted-foreground truncate">{selectedPatient.email}</p>}
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                      <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-base font-medium text-foreground">Inicie uma conversa</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Envie uma mensagem para {selectedPatient.name}.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-1">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-4">
                          <span className="text-[11px] font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-0.5 rounded-full border border-border">
                            {formatDateLabel(group.date)}
                          </span>
                        </div>
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
                                {!isMe && !isConsecutive && (
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground mr-2 mt-auto mb-0.5">
                                    <span className="text-xs font-semibold">{getInitials(selectedPatient.name)}</span>
                                  </div>
                                )}
                                {!isMe && isConsecutive && <div className="w-7 mr-2 shrink-0" />}

                                <div
                                  className={`max-w-[78%] sm:max-w-[70%] px-3.5 py-2 text-sm leading-relaxed ${
                                    isMe
                                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-lg"
                                      : "bg-card border border-border text-foreground rounded-2xl rounded-bl-lg"
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

              <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-3 sm:px-6 py-3">
                <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-2">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

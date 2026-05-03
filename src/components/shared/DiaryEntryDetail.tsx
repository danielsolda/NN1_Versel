import { useState } from "react";
import { format } from "date-fns";
import { Clock, Calendar, Camera, User, MessageSquare, Send, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiaryEntry {
  id: string;
  date: string;
  meal_type: string;
  description: string;
  notes: string | null;
  created_at: string;
  photo_url: string | null;
  nutritionist_feedback?: string | null;
  feedback_at?: string | null;
}

interface DiaryEntryDetailProps {
  entry: DiaryEntry;
  allEntries: DiaryEntry[];
  /** Show patient info card (nutritionist view) */
  patientInfo?: { name: string } | null;
  /** Allow feedback editing (nutritionist view) */
  canFeedback?: boolean;
  /** Callback after feedback is saved */
  onFeedbackSaved?: (entryId: string, feedback: string) => void;
}

export default function DiaryEntryDetail({
  entry,
  allEntries,
  patientInfo,
  canFeedback = false,
  onFeedbackSaved,
}: DiaryEntryDetailProps) {
  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      {/* Left: photo / hero */}
      <div className="relative min-h-[320px] overflow-hidden bg-muted lg:h-full lg:min-h-0">
        <div className="relative h-full min-h-[320px] lg:min-h-0">
          {entry.photo_url ? (
            <img
              src={entry.photo_url}
              alt={entry.meal_type}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

          <div className="absolute left-0 right-0 bottom-0 p-4 sm:p-6">
            <div className="max-w-xl space-y-2 text-white">
              <h2 className="text-2xl font-bold sm:text-3xl">{entry.meal_type}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                {patientInfo && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {patientInfo.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(entry.created_at), "HH:mm")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(entry.date + "T12:00:00"), "dd/MM/yyyy")}
                </span>
              </div>
              <p className="max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                {entry.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: feedback and comments */}
      <div className="flex min-h-0 flex-col border-t border-border/60 bg-card lg:h-full lg:border-l lg:border-t-0">
        <div className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-5">
          {patientInfo && (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
              <Avatar className="h-10 w-10 border border-primary/10">
                <AvatarFallback className="bg-primary/5 text-primary font-medium text-sm">
                  {patientInfo.name?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{patientInfo.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(entry.date + "T12:00:00"), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-3.5">
            {allEntries.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                isHero={e.id === entry.id}
                canFeedback={canFeedback}
                onFeedbackSaved={onFeedbackSaved}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryCard({
  entry: e,
  isHero,
  canFeedback,
  onFeedbackSaved,
}: {
  entry: DiaryEntry;
  isHero: boolean;
  canFeedback: boolean;
  onFeedbackSaved?: (entryId: string, feedback: string) => void;
}) {
  const [feedbackText, setFeedbackText] = useState(e.nutritionist_feedback || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasFeedback = !!e.nutritionist_feedback;
  const isEdited = feedbackText !== (e.nutritionist_feedback || "");

  const handleSaveFeedback = async () => {
    if (!feedbackText.trim() && !hasFeedback) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("food_diary_entries")
        .update({
          nutritionist_feedback: feedbackText.trim() || null,
          feedback_at: feedbackText.trim() ? new Date().toISOString() : null,
        } as any)
        .eq("id", e.id);

      if (error) throw error;
      toast.success("Feedback salvo!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onFeedbackSaved?.(e.id, feedbackText.trim());
    } catch (err: any) {
      toast.error("Erro ao salvar feedback: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`overflow-hidden border-border/60 ${isHero ? "ring-1 ring-primary/15" : ""}`}>
      {e.photo_url && !isHero && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={e.photo_url}
            alt={e.meal_type}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardContent className="space-y-3 p-3.5 sm:p-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px]">
            <Clock className="h-2.5 w-2.5 mr-1" />
            {format(new Date(e.created_at), "HH:mm")}
          </Badge>
          <div className="flex items-center gap-1.5">
            {e.photo_url && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Camera className="h-2.5 w-2.5" />
                Foto
              </Badge>
            )}
            {hasFeedback && !canFeedback && (
              <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                <MessageSquare className="h-2.5 w-2.5" />
                Feedback
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          {e.description}
        </p>
        {e.notes && (
          <div className="rounded-lg bg-muted/30 p-2.5 text-sm text-muted-foreground italic">
            <User className="inline h-3.5 w-3.5 mr-1 opacity-50" />
            &ldquo;{e.notes}&rdquo;
          </div>
        )}

        {/* Feedback display (patient view) */}
        {!canFeedback && e.nutritionist_feedback && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <MessageSquare className="h-3 w-3" />
              Feedback da nutricionista
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {e.nutritionist_feedback}
            </p>
            {e.feedback_at && (
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(e.feedback_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            )}
          </div>
        )}

        {/* Feedback input (nutritionist view) */}
        {canFeedback && (
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {hasFeedback ? "Seu feedback" : "Adicionar feedback"}
            </div>
            <Textarea
              value={feedbackText}
              onChange={(ev) => setFeedbackText(ev.target.value)}
              placeholder="Escreva um comentário sobre esta refeição..."
              className="min-h-[72px] text-sm resize-none bg-background"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {feedbackText.length}/500
              </span>
              <Button
                type="button"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                disabled={saving || (!isEdited && !(!hasFeedback && feedbackText.trim()))}
                onClick={handleSaveFeedback}
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : saved ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                {saving ? "Salvando..." : saved ? "Salvo!" : "Enviar"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

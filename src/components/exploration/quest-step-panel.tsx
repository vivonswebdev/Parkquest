"use client";

import { BookOpenText, Camera, Eye, Gift, Headphones, Loader2, Puzzle, Square, Volume2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { QuizCard } from "@/components/game/quiz-card";
import { Button } from "@/components/ui/button";
import { speak, speechSupported, stopSpeaking } from "@/lib/audio-guide/speech";
import type { PublicQuiz } from "@/lib/domain/types";
import type { ActivityKind, QuestStepId } from "@/lib/quests/engine";
import type { QuestKey } from "@/lib/quests/catalog";

export const ACTIVITY_ICON: Record<ActivityKind, typeof Puzzle> = {
  riddle: Puzzle,
  quiz: BookOpenText,
  observe: Eye,
  audioHint: Headphones,
  photo: Camera,
  reward: Gift,
};

/**
 * Activité de l'étape en cours, une fois arrivé au spot.
 * Chaque activité a une alternative accessible : texte toujours affiché, audio facultatif,
 * photo facultative et jamais envoyée, quiz qui peut être poursuivi même hors ligne.
 */
export function QuestActivity({
  questKey,
  stepId,
  activity,
  optional,
  quizzes,
  onComplete,
  onSkip,
}: {
  questKey: QuestKey;
  stepId: QuestStepId;
  activity: ActivityKind;
  optional?: boolean;
  quizzes: PublicQuiz[];
  onComplete(): void;
  onSkip?(): void;
}) {
  const t = useTranslations("explore");
  const locale = useLocale();
  const body = t(`quests.${questKey}.steps.${stepId}.body`);
  const fact = t(`quests.${questKey}.steps.${stepId}.fact`);
  const [quizDone, setQuizDone] = useState(quizzes.length === 0);
  const [speaking, setSpeaking] = useState(false);
  // Détecté après le montage (la synthèse vocale n'existe pas côté serveur).
  const [canSpeak, setCanSpeak] = useState<boolean | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => setCanSpeak(speechSupported()), 0);
    return () => {
      window.clearTimeout(id);
      stopSpeaking();
    };
  }, []);

  let content: ReactNode = null;
  let doneLabel = t("continue");
  let canComplete = true;

  switch (activity) {
    case "riddle":
      doneLabel = t("activity.riddleDone");
      break;
    case "quiz":
      content = quizzes.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <QuizCard quizzes={quizzes} onResult={() => setQuizDone(true)} />
        </div>
      );
      canComplete = quizDone;
      break;
    case "observe":
      doneLabel = t("activity.observeDone");
      break;
    case "audioHint":
      content = (
        <div className="space-y-2">
          {canSpeak === false ? (
            <p className="text-xs text-muted-foreground">{t("activity.audioUnavailable")}</p>
          ) : (
            <Button
              variant="secondary"
              block
              disabled={canSpeak === null}
              aria-pressed={speaking}
              onClick={() => {
                if (speaking) {
                  stopSpeaking();
                  setSpeaking(false);
                } else if (speak(body, locale, () => setSpeaking(false))) setSpeaking(true);
              }}
            >
              {canSpeak === null ? <Loader2 className="animate-spin" /> : speaking ? <Square /> : <Volume2 />}
              {speaking ? t("activity.audioStop") : t("activity.audioListen")}
            </Button>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("activity.transcript")}</p>
        </div>
      );
      doneLabel = t("activity.audioDone");
      break;
    case "photo":
      content = <p className="text-xs text-muted-foreground">{t("activity.photoNote")}</p>;
      doneLabel = t("activity.photoDone");
      break;
    case "reward":
      doneLabel = t("activity.openTreasure");
      break;
  }

  return (
    <div className="space-y-3">
      {/* Texte toujours affiché (y compris pour l'indice audio : c'est sa transcription) */}
      {activity === "audioHint" ? content : null}
      <p className="whitespace-pre-line text-[15px] leading-relaxed">{body}</p>
      {activity !== "audioHint" ? content : null}
      {/* Apprendre fait partie de chaque étape : un fait nature court */}
      <p className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-sm">
        <span className="font-semibold text-primary">{t("activity.didYouKnow")}</span> {fact}
      </p>
      <Button size="lg" block onClick={onComplete} disabled={!canComplete}>
        {activity === "reward" && <Gift />} {doneLabel}
      </Button>
      {optional && onSkip && (
        <Button variant="ghost" block onClick={onSkip}>
          {t("step.skip")}
        </Button>
      )}
    </div>
  );
}

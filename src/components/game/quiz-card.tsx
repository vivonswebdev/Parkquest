"use client";

import { Check, HelpCircle, Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useOnline } from "@/components/layout/network-status";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import type { PublicQuiz, QuizResult } from "@/lib/domain/types";
import { updateDemoProgress, useDemoProgress } from "@/features/demo/demo-progress";
import { cn } from "@/lib/utils";
import { submitQuizAction } from "@/server/game-actions";
import { ActionErrorMessage, ModeNotice, PointsBurst } from "./feedback";

export function QuizCard({
  quizzes,
  visitId,
  onResult,
}: {
  quizzes: PublicQuiz[];
  visitId?: string | null;
  /** Appelé après chaque réponse traitée (ok = réponse enregistrée, même incorrecte). */
  onResult?(ok: boolean): void;
}) {
  const t = useTranslations("quiz");
  const [index, setIndex] = useState(0);
  const quiz = quizzes[index];
  if (!quiz) return null;
  return (
    <div className="space-y-3">
      {quizzes.length > 1 && <p className="text-xs font-semibold text-muted-foreground">{t("questionOf", { current: index + 1, total: quizzes.length })}</p>}
      <QuizQuestion key={quiz.id} quiz={quiz} visitId={visitId} onResult={onResult} onNext={index < quizzes.length - 1 ? () => setIndex((i) => i + 1) : undefined} />
    </div>
  );
}

function QuizQuestion({ quiz, visitId, onNext, onResult }: { quiz: PublicQuiz; visitId?: string | null; onNext?: () => void; onResult?(ok: boolean): void }) {
  const t = useTranslations("quiz");
  const tc = useTranslations("common");
  const locale = useLocale();
  const online = useOnline();
  const demo = useDemoProgress();
  const [choice, setChoice] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!choice) return;
    if (!online) {
      setResult({ ok: false, error: "OFFLINE" });
      onResult?.(false);
      return;
    }
    start(async () => {
      const firstAttempt = !(quiz.id in demo.quizAttempts);
      const r = await submitQuizAction({ quizId: quiz.id, answerId: choice, visitId: visitId ?? null, locale, firstAttempt });
      setResult(r);
      onResult?.(r.ok);
      if (r.ok && r.mode === "demo" && firstAttempt) {
        updateDemoProgress((p) => ({
          ...p,
          quizAttempts: { ...p.quizAttempts, [quiz.id]: r.isCorrect },
          points: p.points + r.pointsAwarded,
        }));
      }
    });
  };

  const answered = result?.ok ? result : null;
  const correctLabel = answered && quiz.answers.find((a) => a.id === answered.correctAnswerId)?.label;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-start gap-2 text-lg font-bold leading-snug">
          <HelpCircle className="mt-1 size-5 shrink-0 text-primary" />
          {quiz.question}
        </h3>
        <Pill tone="gold" size="sm" className="shrink-0">{tc("pointsGain", { count: quiz.pointsValue })}</Pill>
      </div>

      <fieldset className="mt-4 space-y-2" disabled={Boolean(answered) || pending}>
        <legend className="sr-only">{t("chooseAnswer")}</legend>
        {quiz.answers.map((a) => {
          const isChoice = choice === a.id;
          const isCorrect = answered?.correctAnswerId === a.id;
          const isWrongChoice = answered && isChoice && !answered.isCorrect;
          return (
            <label
              key={a.id}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                !answered && isChoice && "border-primary bg-primary-soft",
                !answered && !isChoice && "border-border bg-muted/40 hover:border-primary/40",
                isCorrect && "border-primary bg-primary/15",
                isWrongChoice && "border-danger/60 bg-danger/10",
                answered && !isCorrect && !isWrongChoice && "border-border opacity-60",
              )}
            >
              <input type="radio" name={`quiz-${quiz.id}`} value={a.id} checked={isChoice} onChange={() => setChoice(a.id)} className="peer sr-only" />
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                  isChoice || isCorrect ? "border-primary" : "border-muted-foreground/50",
                  isWrongChoice && "border-danger",
                )}
              >
                {isCorrect ? <Check className="size-3.5 text-primary" strokeWidth={3} /> : isWrongChoice ? <X className="size-3.5 text-danger" strokeWidth={3} /> : isChoice && <span className="size-2.5 rounded-full bg-primary" />}
              </span>
              <span className="font-medium">{a.label}</span>
            </label>
          );
        })}
      </fieldset>

      {!answered && (
        <Button block size="lg" className="mt-4" onClick={submit} disabled={!choice || pending}>
          {pending && <Loader2 className="animate-spin" />}
          {t("validate")}
        </Button>
      )}

      {result && !result.ok && <ActionErrorMessage error={result.error} className="mt-3" />}

      {answered && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className={cn("rounded-2xl p-4", answered.isCorrect ? "bg-primary/10" : "bg-danger/10")}>
            <p className={cn("font-display text-lg font-bold", answered.isCorrect ? "text-primary" : "text-danger")}>
              {answered.isCorrect ? t("correct") : t("incorrect")}
            </p>
            {!answered.isCorrect && correctLabel && <p className="mt-1 text-sm">{t("correctAnswerWas", { answer: correctLabel })}</p>}
            {answered.explanation && <p className="mt-1 text-sm text-muted-foreground">{answered.explanation}</p>}
            {answered.isCorrect && !answered.firstAttempt && <p className="mt-1 text-xs text-muted-foreground">{t("noPointsRetry")}</p>}
          </div>
          <PointsBurst points={answered.pointsAwarded} badges={answered.newBadges} />
          <ModeNotice mode={answered.mode} />
          {onNext && (
            <Button variant="secondary" block onClick={onNext}>
              {t("next")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

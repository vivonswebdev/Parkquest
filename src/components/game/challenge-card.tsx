"use client";

import { Camera, Check, Footprints, ImagePlus, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useOnline } from "@/components/layout/network-status";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import type { Challenge, ChallengeResult } from "@/lib/domain/types";
import { updateDemoProgress, useDemoProgress } from "@/lib/game/demo-progress";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { completeChallengeAction } from "@/server/game-actions";
import { ActionErrorMessage, ModeNotice, PointsBurst } from "./feedback";

export function ChallengeCard({ challenge, parkId, visitId }: { challenge: Challenge; parkId: string; visitId?: string | null }) {
  const t = useTranslations("challenge");
  const tc = useTranslations("common");
  const online = useOnline();
  const demo = useDemoProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const already = isSupabaseConfigured ? undefined : demo.challenges[challenge.id];
  const Icon = challenge.type === "PHOTO" ? Camera : challenge.type === "WALK" ? Footprints : Sparkles;

  const submit = () => {
    if (!online) {
      setResult({ ok: false, error: "OFFLINE" });
      return;
    }
    const fd = new FormData();
    fd.set("challengeId", challenge.id);
    fd.set("parkId", parkId);
    if (challenge.spotId) fd.set("spotId", challenge.spotId);
    if (visitId) fd.set("visitId", visitId);
    if (file) fd.set("photo", file);
    start(async () => {
      const r = await completeChallengeAction(fd);
      setResult(r);
      if (r.ok && r.mode === "demo" && (r.status === "APPROVED" || r.status === "PENDING")) {
        const status = r.status;
        updateDemoProgress((p) => ({ ...p, challenges: { ...p.challenges, [challenge.id]: status }, points: p.points + r.pointsAwarded }));
      }
    });
  };

  const done = result?.ok ? result : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(`types.${challenge.type}`)}</p>
            <h3 className="text-lg font-bold leading-snug">{challenge.title}</h3>
          </div>
        </div>
        <Pill tone="gold" size="sm" className="shrink-0">{tc("pointsGain", { count: challenge.pointsValue })}</Pill>
      </div>
      {challenge.instructions && <p className="mt-2 text-sm text-muted-foreground">{challenge.instructions}</p>}

      {challenge.requiresPhoto && !done && (
        <div className="mt-4 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {preview ? (
            <button type="button" onClick={() => fileRef.current?.click()} className="relative block aspect-video w-full overflow-hidden rounded-2xl border border-border">
              <Image src={preview} alt="" fill unoptimized className="object-cover" />
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs">{t("changePhoto")}</span>
            </button>
          ) : (
            <Button variant="outline" block size="lg" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> {t("addPhoto")}
            </Button>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> {t("photoPrivacy")}
          </p>
        </div>
      )}

      {!done && (
        <Button block size="lg" variant={already ? "secondary" : "primary"} className="mt-4" onClick={submit} disabled={pending || Boolean(already) || (challenge.requiresPhoto && !file)}>
          {pending ? <Loader2 className="animate-spin" /> : already ? <Check /> : null}
          {already ? t("alreadySubmitted") : t("done")}
        </Button>
      )}

      {result && !result.ok && <ActionErrorMessage error={result.error} className="mt-3" />}

      {done && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <p className="rounded-2xl bg-primary/10 p-4 font-semibold text-primary">
            {done.status === "APPROVED"
              ? t("approved")
              : done.status === "PENDING"
                ? t("photoPending")
                : done.status === "ALREADY_SUBMITTED"
                  ? t("alreadySubmitted")
                  : t("notReached", { progress: 0, target: challenge.targetValue ?? 0 })}
          </p>
          <PointsBurst points={done.pointsAwarded} badges={done.newBadges} />
          <ModeNotice mode={done.mode} />
        </div>
      )}
    </div>
  );
}

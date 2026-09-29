"use client";

import { Bird, Camera, Droplet, Flower2, Leaf, Loader2, Moon, Mountain, Squirrel, Sun, Trash2, TreePine, UserRound, Wind, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { photoToAvatar, saveAvatar, useAvatar } from "@/features/profile/use-avatar";
import { AVATAR_PRESETS, type Avatar, type AvatarPreset } from "@/lib/avatar";
import { ACCEPTED_PHOTO_TYPES, validatePhotoFile } from "@/lib/photos/prepare";
import { cn } from "@/lib/utils";

/** Emblèmes nature (dessins originaux) : icône + couleur, jamais une créature. */
const PRESET: Record<AvatarPreset, { Icon: typeof Leaf; color: string }> = {
  leaf: { Icon: Leaf, color: "#19E6A2" },
  water: { Icon: Droplet, color: "#5CC8F2" },
  flower: { Icon: Flower2, color: "#F28DB2" },
  air: { Icon: Wind, color: "#A9C8E8" },
  forest: { Icon: TreePine, color: "#6FBF73" },
  moon: { Icon: Moon, color: "#B7A8F5" },
  sun: { Icon: Sun, color: "#F4C95D" },
  bird: { Icon: Bird, color: "#8FD3C8" },
  squirrel: { Icon: Squirrel, color: "#D9A066" },
  mountain: { Icon: Mountain, color: "#9DB8FF" },
};

export function AvatarImage({ avatar, className }: { avatar: Avatar | null; className?: string }) {
  if (avatar?.kind === "photo") {
    // eslint-disable-next-line @next/next/no-img-element -- image locale (data URL), jamais servie par Next
    return <img src={avatar.dataUrl} alt="" className={cn("size-full rounded-full object-cover", className)} />;
  }
  if (avatar?.kind === "preset") {
    const { Icon, color } = PRESET[avatar.preset];
    return (
      <span className={cn("inline-flex size-full items-center justify-center rounded-full bg-background", className)}>
        <span className="inline-flex size-full items-center justify-center rounded-full" style={{ background: `${color}2e`, color }}>
          <Icon className="size-1/2" />
        </span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex size-full items-center justify-center rounded-full bg-background", className)}>
      <UserRound className="size-10 text-primary" />
    </span>
  );
}

/**
 * Avatar du profil : un emblème nature ou une photo personnelle. Tout reste sur l'appareil ;
 * la photo est recadrée, réduite et nettoyée de ses métadonnées avant d'être gardée.
 */
export function AvatarPicker() {
  const t = useTranslations("avatar");
  const avatar = useAvatar();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const choose = (a: Avatar | null) => {
    setError(saveAvatar(a) ? null : t("errorStorage"));
    if (a?.kind !== "photo") setOpen(false);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const invalid = validatePhotoFile(file);
    if (invalid) {
      setError(t(invalid === "TYPE" ? "errorType" : invalid === "TOO_LARGE" ? "errorSize" : "errorEmpty"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const a = await photoToAvatar(file);
      if (saveAvatar(a)) setOpen(false);
      else setError(t("errorStorage"));
    } catch {
      setError(t("errorRead"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("change")}
        className="group relative mx-auto inline-flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-mint to-forest p-1 glow-mint"
      >
        <AvatarImage avatar={avatar} />
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground" aria-hidden>
          <Camera className="size-4" />
        </span>
      </button>

      {open &&
        // Portail : la carte du profil (flou d'arrière-plan) ne doit pas contenir la feuille.
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:items-center"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-md rounded-[var(--radius-sheet)] border border-border bg-surface p-4 text-left card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{t("title")}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-sm font-semibold">{t("presets")}</p>
            <ul className="mt-2 grid grid-cols-5 gap-2">
              {AVATAR_PRESETS.map((p) => {
                const selected = avatar?.kind === "preset" && avatar.preset === p;
                return (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => choose({ kind: "preset", preset: p })}
                      aria-label={t(`preset.${p}`)}
                      aria-pressed={selected}
                      className={cn("aspect-square w-full rounded-full p-0.5 ring-2", selected ? "ring-primary" : "ring-transparent hover:ring-border")}
                    >
                      <AvatarImage avatar={{ kind: "preset", preset: p }} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <input ref={fileRef} type="file" accept={ACCEPTED_PHOTO_TYPES.join(",")} className="sr-only" aria-label={t("photo")} onChange={(e) => onFile(e.target.files?.[0])} />
            <Button block variant="secondary" className="mt-4" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Camera />} {t("photo")}
            </Button>
            {avatar && (
              <Button block variant="ghost" className="mt-1" onClick={() => choose(null)}>
                <Trash2 /> {t("remove")}
              </Button>
            )}
            {error && <p role="alert" className="mt-2 text-sm text-gold">{error}</p>}
            <p className="mt-3 text-[11px] text-muted-foreground">{t("privacy")}</p>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

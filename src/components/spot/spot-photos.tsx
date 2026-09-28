"use client";

import { Camera, ChevronLeft, ChevronRight, Clock, ExternalLink, ImagePlus, Loader2, MapPin, ShieldCheck, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { ActionErrorMessage, ModeNotice } from "@/components/game/feedback";
import { useOnline } from "@/components/layout/network-status";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { addDemoSpotPhoto, useDemoSpotPhotos } from "@/features/demo/demo-photos";
import { isDemoMode } from "@/lib/config/app-mode";
import type { ActionError, ActionMode, SpotPhoto } from "@/lib/domain/types";
import { blobToDataUrl, preparePhoto, validatePhotoFile } from "@/lib/photos/prepare";
import type { SpeciesPhoto } from "@/lib/species/parse";
import { cn } from "@/lib/utils";
import { submitSpotPhotoAction } from "@/server/game-actions";

interface GalleryItem {
  key: string;
  url: string;
  /** Vignette plus légère pour le bandeau */
  thumbUrl?: string;
  alt?: string;
  pending: boolean;
  isCover: boolean;
  credit: string;
  sourceUrl?: string;
  /** Lieu / date / distance (photos d'espèce) */
  note?: string;
  near?: boolean;
}

const SOURCE_NAME: Record<SpeciesPhoto["source"], string> = { INATURALIST: "iNaturalist", GBIF: "GBIF", WIKIMEDIA: "Wikimedia Commons" };

/**
 * Photos d'un spot : photos publiées (communauté validée, officielles, Wikimedia Commons)
 * et proposition d'une photo par les visiteurs, toujours vérifiée avant publication.
 */
export function SpotPhotos({ spotId, spotName, photos, speciesPhotos = [] }: { spotId: string; spotName: string; photos: SpotPhoto[]; speciesPhotos?: SpeciesPhoto[] }) {
  const t = useTranslations("photos");
  const local = useDemoSpotPhotos(spotId);
  const [contributing, setContributing] = useState(false);
  const [viewer, setViewer] = useState<{ band: "spot" | "species"; index: number } | null>(null);

  const credit = (p: SpotPhoto) =>
    p.source === "OFFICIAL"
      ? t("official")
      : p.source === "WIKIMEDIA"
        ? [p.authorName, p.license, t("wikimedia")].filter(Boolean).join(" · ")
        : `© ${p.authorName ?? t("community")} · ${p.license ?? "CC BY-SA 4.0"}`;

  const items: GalleryItem[] = [
    ...(isDemoMode
      ? local
          .slice()
          .reverse()
          .map((p) => ({ key: p.id, url: p.dataUrl, alt: p.alt, pending: p.status === "PENDING", isCover: false, credit: `${t("you")} · CC BY-SA 4.0` }))
      : []),
    ...photos.map((p) => ({ key: p.id, url: p.url, alt: p.alt, pending: false, isCover: p.isCover, credit: credit(p), sourceUrl: p.sourceUrl })),
  ];

  const speciesItems: GalleryItem[] = speciesPhotos.map((p) => {
    const km = p.distanceM !== undefined ? Math.max(1, Math.round(p.distanceM / 1000)) : null;
    return {
      key: p.id,
      url: p.url,
      thumbUrl: p.thumbUrl,
      pending: false,
      isCover: false,
      credit: `© ${p.author} · ${p.license} · ${SOURCE_NAME[p.source]}`,
      sourceUrl: p.sourceUrl,
      near: km !== null && km <= 50,
      note: [p.place, p.observedOn, km !== null && km <= 50 ? t("km", { km }) : null].filter(Boolean).join(" · ") || undefined,
    };
  });
  const viewerItems = viewer?.band === "species" ? speciesItems : items;

  return (
    <section aria-labelledby="spot-photos-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="spot-photos-title" className="light-serif text-xl font-bold">
          {t("title")}
          {items.length > 0 && <span className="ml-2 text-sm font-medium text-muted-foreground">{t("count", { count: items.length })}</span>}
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setContributing(true)}>
          <ImagePlus /> {t("add")}
        </Button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => setContributing(true)}
          className="flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-dashed border-primary/40 bg-primary-soft p-4 text-left transition-colors hover:border-primary/70"
        >
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Camera className="size-6" />
          </span>
          <span>
            <span className="block font-semibold">{t("emptyTitle")}</span>
            <span className="block text-sm text-muted-foreground">{t("emptyBody", { name: spotName })}</span>
          </span>
        </button>
      ) : (
        <ul className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {items.map((it, i) => (
            <li key={it.key} className="snap-start">
              <button
                type="button"
                onClick={() => setViewer({ band: "spot", index: i })}
                aria-label={t("open", { n: i + 1 })}
                className="relative block h-44 w-36 overflow-hidden rounded-2xl bg-inset"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- photos d'origines variées (stockage, Wikimedia, appareil) */}
                <img src={it.url} alt={it.alt ?? ""} loading="lazy" className={cn("size-full object-cover", it.pending && "opacity-70")} />
                {it.pending && (
                  <span className="absolute inset-x-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                    <Clock className="size-3" /> {t("pending")}
                  </span>
                )}
                {it.isCover && (
                  <span className="absolute left-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-[#f4c95d]" aria-label={t("cover")}>
                    <Star className="size-3.5 fill-current" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5 text-left text-[10px] text-white/90">{it.credit}</span>
              </button>
            </li>
          ))}
          <li className="snap-start">
            <button
              type="button"
              onClick={() => setContributing(true)}
              className="flex h-44 w-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              <ImagePlus className="size-6" /> {t("addShort")}
            </button>
          </li>
        </ul>
      )}

      {speciesItems.length > 0 && (
        <div className="space-y-2 pt-2">
          <div>
            <h3 className="light-serif text-lg font-bold">{t("speciesTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("speciesNote")}</p>
          </div>
          <ul className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {speciesItems.map((it, i) => (
              <li key={it.key} className="snap-start">
                <button type="button" onClick={() => setViewer({ band: "species", index: i })} aria-label={t("open", { n: i + 1 })} className="relative block h-44 w-36 overflow-hidden rounded-2xl bg-inset">
                  {/* eslint-disable-next-line @next/next/no-img-element -- photos d'observations (iNaturalist, GBIF, Wikimedia) */}
                  <img src={it.thumbUrl ?? it.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
                  {it.near && (
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                      <MapPin className="size-3" /> {t("nearHere")}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5 text-left text-[10px] text-white/90">{it.credit}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contributing && <ContributeSheet spotId={spotId} spotName={spotName} onClose={() => setContributing(false)} />}
      {viewer !== null && viewerItems[viewer.index] && (
        <PhotoViewer items={viewerItems} index={viewer.index} onIndex={(index) => setViewer({ ...viewer, index })} onClose={() => setViewer(null)} />
      )}
    </section>
  );
}

type Step = { kind: "choose" } | { kind: "preview"; blob: Blob; url: string; width: number; height: number } | { kind: "done"; mode: ActionMode };

function ContributeSheet({ spotId, spotName, onClose }: { spotId: string; spotName: string; onClose(): void }) {
  const t = useTranslations("photos");
  const online = useOnline();
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [fileError, setFileError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [alt, setAlt] = useState("");
  const [sending, start] = useTransition();

  const pick = async (file: File | undefined) => {
    setFileError(null);
    setActionError(null);
    if (!file) return;
    const err = validatePhotoFile(file);
    if (err) {
      setFileError(t(`errors.${err}`));
      return;
    }
    setPreparing(true);
    try {
      const p = await preparePhoto(file);
      if (step.kind === "preview") URL.revokeObjectURL(step.url);
      setStep({ kind: "preview", blob: p.blob, url: URL.createObjectURL(p.blob), width: p.width, height: p.height });
    } catch (e) {
      setFileError(t(e instanceof Error && e.message === "TOO_SMALL" ? "errors.TOO_SMALL" : "errors.READ"));
    } finally {
      setPreparing(false);
    }
  };

  const send = () => {
    if (step.kind !== "preview") return;
    if (!online) {
      setActionError("OFFLINE");
      return;
    }
    start(async () => {
      const form = new FormData();
      form.set("spotId", spotId);
      form.set("photo", new File([step.blob], "photo.jpg", { type: "image/jpeg" }));
      form.set("width", String(step.width));
      form.set("height", String(step.height));
      if (alt.trim()) form.set("alt", alt.trim());
      form.set("consent", consent ? "true" : "false");
      const r = await submitSpotPhotoAction(form);
      if (!r.ok) {
        setActionError(r.error);
        return;
      }
      if (r.mode === "demo") {
        // Démo : version allégée conservée uniquement sur cet appareil.
        const small = await preparePhoto(new File([step.blob], "p.jpg", { type: "image/jpeg" }), 1024, 0.72);
        addDemoSpotPhoto({ spotId, dataUrl: await blobToDataUrl(small.blob), width: small.width, height: small.height, alt: alt.trim() || undefined });
      }
      URL.revokeObjectURL(step.url);
      setStep({ kind: "done", mode: r.mode });
    });
  };

  const rules = ["place", "own", "paths", "privacy"] as const;

  return (
    <BottomSheet modal onClose={onClose} closeLabel={t("close")} title={step.kind === "done" ? t("thanksTitle") : t("sheetTitle", { name: spotName })} description={step.kind === "choose" ? t("sheetIntro") : undefined}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={t("choose")}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {step.kind === "choose" && (
        <div className="space-y-4">
          <ul className="space-y-2.5">
            {rules.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t(`rules.${r}`)}</span>
              </li>
            ))}
          </ul>
          {fileError && <p role="alert" className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{fileError}</p>}
          <Button size="lg" block onClick={() => input.current?.click()} disabled={preparing}>
            {preparing ? <Loader2 className="animate-spin" /> : <Camera />} {preparing ? t("preparing") : t("choose")}
          </Button>
        </div>
      )}

      {step.kind === "preview" && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob) */}
          <img src={step.url} alt="" className="max-h-[34dvh] w-full rounded-2xl bg-inset object-contain" />
          <label className="block text-sm">
            <span className="font-medium">{t("altLabel")}</span>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              maxLength={200}
              placeholder={t("altPlaceholder")}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
            <span>{t("consent")}</span>
          </label>
          {actionError && <ActionErrorMessage error={actionError} />}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" onClick={send} disabled={!consent || sending}>
              {sending && <Loader2 className="animate-spin" />} {sending ? t("sending") : t("send")}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => input.current?.click()} disabled={sending || preparing}>
              {t("change")}
            </Button>
          </div>
        </div>
      )}

      {step.kind === "done" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("thanksBody")}</p>
          <ModeNotice mode={step.mode} />
          {step.mode === "demo" && <p className="text-xs text-muted-foreground">{t("demoNote")}</p>}
          <Button size="lg" block onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}

function PhotoViewer({ items, index, onIndex, onClose }: { items: GalleryItem[]; index: number; onIndex(i: number): void; onClose(): void }) {
  const t = useTranslations("photos");
  const it = items[index];
  return (
    <div role="dialog" aria-modal="true" aria-label={t("open", { n: index + 1 })} className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-white" onClick={onClose}>
      <div className="flex items-center justify-between p-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <span className="text-sm text-white/70">
          {index + 1} / {items.length}
        </span>
        <button type="button" onClick={onClose} aria-label={t("close")} className="inline-flex size-11 items-center justify-center rounded-full bg-white/10">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element -- photos d'origines variées */}
        <img src={it.url} alt={it.alt ?? ""} referrerPolicy="no-referrer" className="size-full object-contain" />
        {index > 0 && (
          <button type="button" onClick={() => onIndex(index - 1)} aria-label={t("prev")} className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50">
            <ChevronLeft className="size-6" />
          </button>
        )}
        {index < items.length - 1 && (
          <button type="button" onClick={() => onIndex(index + 1)} aria-label={t("next")} className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50">
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
      <div className="space-y-1 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] text-sm" onClick={(e) => e.stopPropagation()}>
        {it.alt && <p>{it.alt}</p>}
        {it.note && <p className="text-white/85">{it.note}</p>}
        <p className="text-white/70">
          {it.credit}
          {it.pending && ` · ${t("pending")}`}
        </p>
        {it.sourceUrl && (
          <a href={it.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-white/80 underline">
            {t("sourceLink")} <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

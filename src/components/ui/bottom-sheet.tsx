"use client";

import { X } from "lucide-react";
import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Panneau bas (« bottom sheet »), composant de base du design system.
 * - `modal` : superposé avec voile, Échap et clic extérieur pour fermer.
 * - sinon : panneau flottant posé sur la carte.
 */
export function BottomSheet({
  title,
  description,
  onClose,
  closeLabel = "Fermer",
  modal = false,
  className,
  children,
  footer,
}: {
  title?: ReactNode;
  description?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  modal?: boolean;
  className?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const isClient = useIsClient();
  useEffect(() => {
    if (!modal || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, onClose]);

  const panel = (
    <section
      role="dialog"
      aria-modal={modal || undefined}
      aria-labelledby={title ? titleId : undefined}
      onClick={(e) => e.stopPropagation()}
      className={cn("glass-strong pointer-events-auto w-full rounded-[var(--radius-sheet)] p-4 card-shadow", modal && "max-h-[88dvh] max-w-md overflow-y-auto p-5 safe-bottom", className)}
    >
      <div aria-hidden className="mx-auto -mt-1 mb-3 h-1 w-10 rounded-full bg-foreground/20" />
      {(title || onClose) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="font-display text-xl font-extrabold leading-tight">
                {title}
              </h2>
            )}
            {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label={closeLabel} className="-mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-inset">
              <X className="size-5" />
            </button>
          )}
        </header>
      )}
      {children}
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );

  if (!modal) return panel;
  const overlay = (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm md:items-center" onClick={onClose}>
      {panel}
    </div>
  );
  // Rendu dans <body> : le voile passe au-dessus de la barre de navigation,
  // quel que soit le contexte d'empilement du parent (carte, etc.).
  return isClient ? createPortal(overlay, document.body) : overlay;
}

const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

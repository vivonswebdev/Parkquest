"use client";

import { Flag, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DioMarker } from "../art/diorama";

/** Repère debout sur le diorama : pastille lisible + court libellé. */
export function MarkerPin({ m, compact, selected, onSelect }: { m: DioMarker; compact?: boolean; selected?: boolean; onSelect?(id: string): void }) {
  const body = (() => {
    switch (m.kind) {
      case "player":
        return (
          <span className="relative grid size-9 place-items-center">
            <span className="lab-ping absolute inset-0 rounded-full bg-[#2f7fa3]/40" />
            <span className="size-5 rounded-full border-[3px] border-white bg-[#2f7fa3] shadow-[0_2px_8px_rgba(23,41,75,.5)]" />
          </span>
        );
      case "friend":
        return (
          <span className="grid size-10 place-items-center rounded-full border-[3px] border-white bg-[#a48ad6] text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(23,41,75,.45)]">L</span>
        );
      case "adventure":
        return (
          <span className="relative grid size-12 place-items-center">
            <span className="lab-glow absolute -inset-2 rounded-full bg-[#f4b54a]/45 blur-md" />
            <span className="relative grid size-12 place-items-center rounded-full border-[3px] border-white bg-gradient-to-b from-[#f6c66b] to-[#d98a1c] shadow-[0_6px_16px_rgba(120,70,0,.45)]">
              <Star className="size-6 fill-white text-white" aria-hidden />
            </span>
          </span>
        );
      case "egg":
        return (
          <span className="relative grid size-11 place-items-center">
            <span className="lab-glow absolute -inset-1 rounded-full bg-[#cfe3a8]/70 blur-sm" />
            <svg viewBox="0 0 40 48" className="relative h-11 w-9 drop-shadow-[0_4px_6px_rgba(23,41,75,.35)]" aria-hidden>
              <path d="M20 2 C 30 2, 37 20, 37 30 C 37 41, 29 46, 20 46 C 11 46, 3 41, 3 30 C 3 20, 10 2, 20 2 Z" fill="#f6eedb" stroke="#fff" strokeWidth="2" />
              <path d="M8 34 C 16 28, 24 38, 33 30" stroke="#6f9a4f" strokeWidth="3" fill="none" />
              <circle cx="15" cy="18" r="3" fill="#a9bf86" />
            </svg>
          </span>
        );
      case "clue":
        return (
          <span className="grid size-10 place-items-center rounded-full border-[3px] border-white bg-[#1f5a3d] text-white shadow-[0_4px_12px_rgba(23,41,75,.4)]">
            <Search className="size-5" aria-hidden />
          </span>
        );
      case "start":
        return (
          <span className="grid size-10 place-items-center rounded-full border-[3px] border-white bg-[#17294b] text-[#f6c66b] shadow-[0_4px_12px_rgba(23,41,75,.4)]">
            <Flag className="size-5" aria-hidden />
          </span>
        );
    }
  })();
  const content = (
    <span className={cn("flex flex-col items-center", selected && "scale-110")}>
      {body}
      {!compact && (
        <span className="mt-1 max-w-32 truncate rounded-full bg-[rgba(255,250,240,.94)] px-2 py-0.5 text-[11px] font-bold text-[#1d2a22] shadow">{m.label}</span>
      )}
      <span className="mt-0.5 h-2 w-4 rounded-[50%] bg-black/20" aria-hidden />
    </span>
  );
  if (!onSelect) return <span aria-hidden>{content}</span>;
  return (
    <button type="button" onClick={() => onSelect(m.id)} aria-label={m.label} aria-pressed={selected} className="block rounded-2xl p-1">
      {content}
    </button>
  );
}

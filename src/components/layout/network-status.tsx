"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Bandeau d'état réseau : l'app ne fait jamais croire qu'une action a été validée hors ligne. */
export function NetworkStatus() {
  const t = useTranslations("offline");
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(env(safe-area-inset-top),0.5rem)]">
      <div className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gold">
        <WifiOff className="size-4" />
        {t("banner")}
      </div>
    </div>
  );
}

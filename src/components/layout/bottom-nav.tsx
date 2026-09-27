"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

/** Navigation basse mobile : pastille active large, sombre, accent menthe. */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  // Mode visite immersif : pas de barre de navigation.
  if (pathname.endsWith("/visit")) return null;

  return (
    <nav
      aria-label={t("mainNavigation")}
      className="fixed inset-x-0 bottom-0 z-40 px-3 safe-bottom md:hidden"
    >
      <div className="glass-strong mx-auto flex max-w-md items-center justify-between rounded-[26px] p-1.5 card-shadow">
        {NAV_ITEMS.map(({ key, href, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-14 min-w-14 items-center justify-center rounded-[20px] transition-all duration-200",
                active
                  ? "flex-row gap-2 bg-nav-active px-4 text-mint ring-1 ring-mint/25"
                  : "flex-1 flex-col gap-0.5 text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("shrink-0", active ? "size-6" : "size-[22px]")} strokeWidth={active ? 2.3 : 1.8} />
              <span className={cn("font-medium", active ? "text-sm text-white" : "text-[10.5px]")}>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

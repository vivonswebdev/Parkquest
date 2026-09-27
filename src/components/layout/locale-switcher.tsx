"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className={cn("glass relative inline-flex h-10 items-center gap-1.5 rounded-full pl-3 pr-2 text-sm", pending && "opacity-60", className)}>
      <Globe className="size-4 text-primary" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(e) =>
          startTransition(() => {
            router.replace(pathname, { locale: e.target.value });
          })
        }
        className="cursor-pointer appearance-none bg-transparent pr-1 font-semibold uppercase outline-none"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="bg-surface text-foreground">
            {l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

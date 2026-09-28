import { Search, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { FEATURED_PARK_SLUG_PUBLIC } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme/theme-switcher";
import { LocaleSwitcher } from "./locale-switcher";

export async function DesktopHeader() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const links = [
    { href: "/parks", label: t("parks") },
    { href: `/parks/${FEATURED_PARK_SLUG_PUBLIC}#trails`, label: t("trails") },
    { href: "/map", label: t("map") },
    { href: "/blog", label: t("tips") },
    { href: "/community", label: t("community") },
  ];
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-background/80 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
        <Link href="/" aria-label="ParkQuest">
          <Logo />
        </Link>
        <nav aria-label={t("mainNavigation")} className="flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/parks" aria-label={tc("search")} className="glass inline-flex size-10 items-center justify-center rounded-full hover:text-primary">
            <Search className="size-[18px]" />
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <Link href="/profile" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-110">
            <UserRound className="size-4" />
            {t("profile")}
          </Link>
        </div>
      </div>
    </header>
  );
}

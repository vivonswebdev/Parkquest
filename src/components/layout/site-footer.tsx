import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("legal");
  return (
    <footer className="border-t border-border pb-32 pt-10 md:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:px-6">
        <div className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span>© {new Date().getFullYear()} ParkQuest</span>
        </div>
        <p className="md:flex-1">{t("footer")}</p>
        <nav className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-foreground">{t("privacy")}</Link>
          <Link href="/legal/terms" className="hover:text-foreground">{t("terms")}</Link>
          <Link href="/credits" className="hover:text-foreground">{t("credits")}</Link>
        </nav>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { repo } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const articles = await repo.listArticles(locale);
  return (
    <div className="theme-light min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-5xl space-y-6 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <header>
          <h1 className="font-display text-3xl font-extrabold md:text-5xl">{t("title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>
        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/blog/${a.slug}`} className="group overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition-shadow hover:shadow-lg">
              <div className="relative aspect-[16/10]">
                <Image src={a.coverImageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex gap-1.5">
                  <Pill size="sm">{t.has(`categories.${a.categoryKey}` as "categories.tips") ? t(`categories.${a.categoryKey}` as "categories.tips") : a.categoryKey}</Pill>
                  {a.isDemoData && <DemoBadge />}
                </div>
                <h2 className="text-lg font-bold leading-snug">{a.title}</h2>
                {a.excerpt && <p className="text-sm text-muted-foreground">{a.excerpt}</p>}
                <p className="text-xs text-muted-foreground">{t("readingTime", { count: a.readingMinutes })}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Markdown } from "@/components/content/markdown";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoNotice } from "@/components/shared/demo-badge";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { repo } from "@/lib/data";

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = await repo.getArticle(slug, locale);
  return a ? { title: a.title, description: a.excerpt } : {};
}

export default async function ArticlePage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const a = await repo.getArticle(slug, locale);
  if (!a) notFound();
  return (
    <div className="theme-light min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {t("blog.title")}</Link>
        <div className="relative aspect-[16/9] overflow-hidden rounded-[28px]">
          <Image src={a.coverImageUrl} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
        <header className="space-y-3">
          <div className="flex gap-2">
            <Pill>{t.has(`blog.categories.${a.categoryKey}` as "blog.categories.tips") ? t(`blog.categories.${a.categoryKey}` as "blog.categories.tips") : a.categoryKey}</Pill>
            <Pill tone="muted">{t("blog.readingTime", { count: a.readingMinutes })}</Pill>
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">{a.title}</h1>
          {a.excerpt && <p className="text-xl text-muted-foreground">{a.excerpt}</p>}
          {a.contentLocale !== locale && <p className="text-xs text-muted-foreground">{t("common.contentFallback", { locale: a.contentLocale.toUpperCase() })}</p>}
        </header>
        {a.bodyMd && <Markdown source={a.bodyMd} />}
        {a.isDemoData && <DemoNotice className="border-accent/40 bg-accent/10 text-foreground" />}
      </main>
      <SiteFooter />
    </div>
  );
}

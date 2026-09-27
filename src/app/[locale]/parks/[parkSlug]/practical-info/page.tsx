import { Accessibility, ArrowLeft, Bus, Clock, ExternalLink, MapPin, Navigation, ScrollText, Ticket } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoNotice } from "@/components/shared/demo-badge";
import { FACILITY_ICON } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";

type Params = { params: Promise<{ locale: string; parkSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "practical" });
  return { title: t("title") };
}

export default async function PracticalInfoPage({ params }: Params) {
  const { locale, parkSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const park = await requirePark(parkSlug, locale);
  const facilities = await repo.listFacilities(park.id, locale);
  const info = park.practicalInfo;
  const money = (amount: number, currency: string) =>
    amount === 0 ? t("common.free") : new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  const mapsUrl = `https://www.openstreetmap.org/directions?to=${park.location.lat}%2C${park.location.lng}`;

  return (
    // Thème clair : meilleur contraste pour la lecture d'informations pratiques.
    <div className="reading-light min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-4xl space-y-5 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <Link href={`/parks/${park.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {park.name}
        </Link>
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">{t("practical.title")}</h1>
        {park.isDemoData && <DemoNotice className="border-accent/40 bg-accent/10 text-foreground" />}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-bold"><MapPin className="size-5 text-primary" /> {t("practical.address")}</h2>
            <p className="mt-2">{info?.addressLine}<br />{info?.postalCode}</p>
            <Button asChild variant="forest" className="mt-4">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation /> {t("practical.directions")}</a>
            </Button>
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-bold"><Clock className="size-5 text-primary" /> {t("practical.hours")}</h2>
            <ul className="mt-2 space-y-1">
              {(info?.openingHours ?? []).map((h, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{h.season ? t(`practical.${h.season}`) : t("practical.everyDay")}</span>
                  <span className="font-semibold tabular-nums">{h.open} – {h.close}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-bold"><Ticket className="size-5 text-primary" /> {t("practical.prices")}</h2>
            <ul className="mt-2 space-y-1">
              {(info?.prices ?? []).map((p) => (
                <li key={p.labelKey} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t(`practical.priceLabels.${p.labelKey}`)}</span>
                  <span className="font-semibold">{money(p.amount, p.currency)}</span>
                </li>
              ))}
            </ul>
            {info?.ticketUrl && (
              <Button asChild variant="outline" className="mt-4">
                <a href={info.ticketUrl} target="_blank" rel="noopener noreferrer">{t("practical.buyTickets")} <ExternalLink /></a>
              </Button>
            )}
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-bold"><Bus className="size-5 text-primary" /> {t("practical.transport")}</h2>
            <p className="mt-2 text-muted-foreground">{park.transportNotes}</p>
          </Card>
        </div>

        <Card className="p-5 shadow-none">
          <h2 className="font-bold">{t("practical.services")}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {facilities.map((f) => {
              const Icon = FACILITY_ICON[f.type];
              return (
                <li key={f.id} className="flex items-center gap-2.5 rounded-2xl bg-muted p-3">
                  <Icon className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{f.name}</span>
                    <span className="block text-xs text-muted-foreground">{t(`facility.${f.type}`)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-bold"><Accessibility className="size-5 text-primary" /> {t("practical.accessibility")}</h2>
            <p className="mt-2 text-muted-foreground">{park.accessibilityNotes}</p>
            {park.isPmrFriendly && <Pill className="mt-3">{t("common.pmr")}</Pill>}
          </Card>
          <Card className="p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-bold"><ScrollText className="size-5 text-primary" /> {t("practical.rules")}</h2>
            <p className="mt-2 text-muted-foreground">{park.rules}</p>
            {park.practicalNotes && <p className="mt-2 text-sm text-muted-foreground">{park.practicalNotes}</p>}
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

"use client";

import { Lock, MapPin, Navigation, Ruler } from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { setLocationConsent } from "@/lib/location-consent";

/**
 * Écran d'explication AVANT la demande système de localisation.
 * La permission du navigateur n'est demandée qu'après « Activer ma position ».
 */
export function LocationConsentSheet({ onAccept, onDecline }: { onAccept(): void; onDecline(): void }) {
  const t = useTranslations("geo");
  const uses = [
    { icon: MapPin, text: t("consentUse1") },
    { icon: Navigation, text: t("consentUse2") },
    { icon: Ruler, text: t("consentUse3") },
  ];
  return (
    <BottomSheet
      modal
      title={t("consentTitle")}
      onClose={() => {
        setLocationConsent("declined");
        onDecline();
      }}
      closeLabel={t("consentLater")}
      footer={
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            block
            onClick={() => {
              setLocationConsent("granted");
              onAccept();
            }}
          >
            <Navigation /> {t("consentAccept")}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            block
            onClick={() => {
              setLocationConsent("declined");
              onDecline();
            }}
          >
            {t("consentLater")}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">{t("consentIntro")}</p>
      <ul className="mt-3 space-y-2.5">
        {uses.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-[18px]" />
            </span>
            <span className="pt-1.5 text-[15px]">{text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-inset p-3 text-sm font-medium">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          {t("consentPrivate")}{" "}
          <Link href="/legal/privacy" className="text-primary underline underline-offset-2">
            {t("privacyLink")}
          </Link>
        </span>
      </p>
    </BottomSheet>
  );
}

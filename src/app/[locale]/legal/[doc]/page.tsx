import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Markdown } from "@/components/content/markdown";
import { SiteFooter } from "@/components/layout/site-footer";

const DOCS = ["privacy", "terms"] as const;
type Doc = (typeof DOCS)[number];

// Contenus provisoires (FR) — à rédiger et valider par un conseil juridique avant lancement.
const BODY: Record<Doc, string> = {
  privacy: `## Données collectées
- Compte : adresse e-mail (connexion), pseudonyme généré automatiquement.
- Jeu : spots découverts, réponses aux quiz, défis, points, badges.
- **Position** : utilisée uniquement sur votre appareil pour vous guider. Lors d'une découverte, elle est envoyée ponctuellement pour calculer une distance ; **seules la distance et la précision sont conservées, jamais vos coordonnées**.

## Ce que nous ne faisons jamais
- Afficher publiquement votre position ou celle d'un autre utilisateur.
- Créer un réseau social de localisation.
- Publier une photo ou un commentaire sans modération.

## Vos droits (RGPD)
Accès, rectification, suppression, portabilité : contactez l'équipe ParkQuest (adresse à définir).

## Mineurs
Les fonctions communautaires pour les mineurs nécessiteront un consentement parental (à venir).`,
  terms: `## Objet
ParkQuest est un compagnon de visite de parcs. Les contenus marqués « Démo » sont des exemples non validés par les parcs.

## Règles de conduite
Respectez les règles de chaque parc, restez sur les chemins, ne cueillez pas les plantes.

## Contenus des utilisateurs
Photos et commentaires sont modérés et peuvent être refusés ou supprimés. Tout contenu peut être signalé.

## Responsabilité
Les informations pratiques (horaires, tarifs) doivent être vérifiées auprès du parc.`,
};

type Params = { params: Promise<{ locale: string; doc: string }> };

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, doc } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return DOCS.includes(doc as Doc) ? { title: t(doc as Doc) } : {};
}

export default async function LegalPage({ params }: Params) {
  const { locale, doc } = await params;
  if (!DOCS.includes(doc as Doc)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  return (
    <div className="reading-light min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <h1 className="font-display text-3xl font-extrabold">{t(doc as Doc)}</h1>
        <p className="rounded-2xl bg-accent/10 p-3 text-sm">{t("placeholder")}</p>
        <Markdown source={BODY[doc as Doc]} />
      </main>
      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { CREATURES } from "@/features/lab/creatures";

/* Sommaire du laboratoire : uniquement pour tester le prototype (non relié à l'application officielle). */
const SCREENS: [string, string][] = [
  ["Bienvenue", "/fr/lab/welcome"],
  ["Tutoriel · étape 1", "/fr/lab/onboarding/1"],
  ["Tutoriel · étape 4 (œuf)", "/fr/lab/onboarding/4"],
  ["Tutoriel · étape 5 (évolution)", "/fr/lab/onboarding/5"],
  ["Profil et choix de l'œuf", "/fr/lab/choose-egg"],
  ["Choix de localisation", "/fr/lab/location-choice"],
  ["Première aventure", "/fr/lab/first-adventure"],
  ["Première découverte", "/fr/lab/first-discovery"],
  ["Éclosion", "/fr/lab/hatch?replay=1"],
  ["Compagnon", "/fr/lab/companion"],
  ["Arbre d'évolution", "/fr/lab/companion/evolution"],
  ["Collection", "/fr/lab/collection"],
  ...CREATURES.map((c): [string, string] => [`Fiche · ${c.name}`, `/fr/lab/creature/${c.id}`]),
  ["Accueil prototype", "/fr/lab/home"],
  ["Carte de jour", "/fr/lab/map?theme=day"],
  ["Carte de nuit", "/fr/lab/map?theme=night"],
];

export default function Page() {
  return (
    <main className="lab-safe-top mx-auto max-w-md px-5 pb-10">
      <h1 className="lab-serif mt-4 text-3xl font-bold text-[var(--lab-forest-deep)]">Laboratoire de design</h1>
      <p className="mt-1 text-[var(--lab-ink-soft)]">Prototype isolé : aucune donnée réelle, aucun compte créé, aucune position partagée.</p>
      <ul className="mt-5 grid gap-2">
        {SCREENS.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="flex min-h-12 items-center rounded-2xl bg-[var(--lab-paper)] px-4 font-bold">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { deployEnv } from "@/lib/config/deploy-env";
import "./lab.css";

/*
 * Laboratoire de design (prototype isolé, branche design/prototype-evolving-companion).
 * - Aucune donnée réelle, aucun appel réseau, aucun compte : état local au navigateur (préfixe « pq-lab: »).
 * - Jamais en production, uniquement en français ; non indexé ; aucun lien depuis l'application officielle.
 * - Plein écran au-dessus de la mise en page officielle (navigation incluse), sans la modifier.
 * Suppression du prototype : effacer src/app/[locale]/lab, src/features/lab et tests/e2e/lab.spec.ts.
 */
export const metadata: Metadata = { title: "Laboratoire de design", robots: { index: false, follow: false } };

export default async function LabLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (deployEnv === "production" || locale !== "fr") notFound();
  return (
    <div className="lab-root fixed inset-0 z-[60] overflow-x-hidden overflow-y-auto" data-lab>
      {children}
    </div>
  );
}

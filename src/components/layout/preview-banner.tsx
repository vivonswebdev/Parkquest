import { getTranslations } from "next-intl/server";
import { previewBuild, showPreviewBanner } from "@/lib/config/deploy-env";

/**
 * Bannière discrète des aperçus Vercel (branches de PR). Jamais rendue en production :
 * la condition est évaluée côté serveur, le composant n'existe pas dans le HTML de production.
 */
export async function PreviewBanner() {
  if (!showPreviewBanner) return null;
  const t = await getTranslations("common");
  const build = [previewBuild.branch, previewBuild.commit].filter(Boolean).join(" · ");
  return (
    <p role="note" className="bg-[#f4c95d] px-3 py-1 text-center text-[11px] font-semibold text-[#2a1f00] print:hidden">
      {t("previewBanner")}
      {build && <span className="ml-1.5 font-mono font-normal opacity-75">{build}</span>}
    </p>
  );
}

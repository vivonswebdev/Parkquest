import type { CreatureId } from "../creatures";
import type { FigureProps } from "./figure-kit";
import { LumoFigure } from "./lumo";
import { MossyFigure } from "./mossy";
import { PerlineFigure } from "./perline";

/* Les trois compagnons « figurine » (ceux qui naissent d'un œuf). */
export type CompanionId = Extract<CreatureId, "mossy" | "perline" | "lumo">;
export const FIGURINE_IDS: CompanionId[] = ["mossy", "perline", "lumo"];
export const isFigurine = (id: string): id is CompanionId => (FIGURINE_IDS as string[]).includes(id);

export function CompanionFigure({ id, scarf, ...props }: FigureProps & { id: CompanionId; scarf?: boolean }) {
  if (id === "perline") return <PerlineFigure {...props} />;
  if (id === "lumo") return <LumoFigure {...props} />;
  return <MossyFigure scarf={scarf} {...props} />;
}

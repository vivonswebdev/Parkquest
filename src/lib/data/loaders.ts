import "server-only";
import { notFound } from "next/navigation";
import { getPark } from "./index";

/** Charge un parc publié ou renvoie 404. */
export async function requirePark(slug: string, locale: string) {
  const park = await getPark(slug, locale);
  if (!park) notFound();
  return park;
}

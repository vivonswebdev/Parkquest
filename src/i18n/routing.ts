import { defineRouting } from "next-intl/routing";
import { LOCALES } from "@/lib/domain/types";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "fr",
  localePrefix: "always",
});

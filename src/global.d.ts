import type messages from "../messages/fr.json";

// Clés de traduction typées (fr.json est la référence) : une clé inexistante ne compile pas.
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}

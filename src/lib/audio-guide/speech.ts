/**
 * Adaptateur « sortie vocale » du guidage audio (Web Speech API aujourd'hui ; moteur natif plus tard).
 * Le texte est TOUJOURS affiché à l'écran en parallèle : l'audio n'est jamais la seule source.
 * Sur iOS, la lecture doit partir d'un geste de l'utilisateur (bouton « Écouter »).
 */

const VOICE_LANG: Record<string, string> = { fr: "fr-FR", nl: "nl-BE", en: "en-GB", es: "es-ES", de: "de-DE" };

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** Lit un texte ; retourne false si la synthèse vocale n'est pas disponible. */
export function speak(text: string, locale: string, onEnd?: () => void): boolean {
  if (!speechSupported()) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = VOICE_LANG[locale] ?? locale;
  u.rate = 0.95;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

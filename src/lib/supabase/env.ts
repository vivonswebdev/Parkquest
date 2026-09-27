/** Configuration publique. Aucune clé secrète ici. */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sans Supabase configuré, l'app tourne en MODE DÉMO (données locales, rien n'est enregistré). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

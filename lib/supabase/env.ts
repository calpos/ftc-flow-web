// Next inlines NEXT_PUBLIC_ vars at build time only for literal
// `process.env.NAME` reads, so no destructuring or dynamic keys here.
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// A malformed URL counts as unconfigured, so createClient() can never throw
// supabase-js's "Invalid supabaseUrl" at render time. Not URL.canParse: Safari
// 16.4, in Next's default browser targets, lacks it.
function validUrl(value: string | undefined): string | undefined {
  // Mirrors supabase-js: it requires a literal http(s):// prefix (new URL()
  // accepts "https:host") and parses with a trailing slash appended (new URL()
  // drops a trailing control character, which the slash would trap in the host).
  if (!value || !/^https?:\/\//i.test(value)) return undefined;
  try {
    const { protocol } = new URL(value.endsWith("/") ? value : `${value}/`);
    return protocol === "http:" || protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

export const supabaseUrl = validUrl(clean(process.env.NEXT_PUBLIC_SUPABASE_URL));
export const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** False in local demo mode, where every Supabase caller must fall back. */
export const isSupabaseConfigured: boolean = Boolean(supabaseUrl && supabaseAnonKey);

/** Both values narrowed to strings, or null when Supabase is not configured. */
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

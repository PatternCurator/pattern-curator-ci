// src/lib/storage.ts
import { supabaseServer } from "@/lib/supabaseServer";

export async function signedUrl(path: string | null) {
  if (!path) return null;
  const clean = path.replace(/^\/+/, "");

  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;

  const supabase = await supabaseServer();
  const { data } = await supabase.storage
    .from("assets")
    .createSignedUrl(clean, 60 * 60);

  return data?.signedUrl ?? null;
}

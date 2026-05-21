import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function getReportDownloadUrl(path: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from("paid-reports")
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

  if (error) {
    console.error("signed url error", error);
    return null;
  }

  return data?.signedUrl;
}
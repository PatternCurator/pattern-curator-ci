import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function getReportDownloadUrl(path: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from("paid-reports")
    .createSignedUrl(path, 60 * 60 * 24 * 30); // 1 month

  if (error) {
    console.error("signed url error", error);
    return null;
  }

  return data?.signedUrl;
}
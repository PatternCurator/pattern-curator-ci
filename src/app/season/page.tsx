import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  const supabase = getSupabaseAdmin();

  const { data: season, error } = await supabase
    .from("seasons")
    .select("season")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("season redirect error", error);
  }

  if (season?.season) {
    redirect(`/season/${encodeURIComponent(season.season)}`);
  }

  redirect("/moodboards");
}
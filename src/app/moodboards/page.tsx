export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseServer } from "@/lib/supabaseServer";
import MoodboardResults from "@/components/MoodboardResults";

export default async function MoodboardsPage() {
  const supabase = await supabaseServer();

  const { data: moodboards = [], error } = await supabase
    .from("moodboards")
    .select("id,title,image_path,source_url,source_site")
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(90);

  if (error) console.error("Supabase error (moodboards):", error.message);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="space-y-2">
        <div
          className="text-[18px] font-bold italic uppercase tracking-widest"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#8a8a8aff",
          }}
        >
          MOODBOARDS
        </div>

        <p className="max-w-3xl pt-1 text-xs leading-relaxed text-zinc-500">
            A curated moodboard library — an ongoing source of color, print, and pattern inspiration.
        </p>
    </div>

      <MoodboardResults moodboards={moodboards as any} />
    </main>
  );
}
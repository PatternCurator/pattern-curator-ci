"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function HeaderAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!email) return null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-[11px] text-black/60">{email}</span>

      <button
        type="button"
        onClick={handleLogout}
        className="text-[11px] underline hover:opacity-70"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Log out
      </button>
    </div>
  );
}

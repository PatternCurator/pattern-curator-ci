"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AccountNavLink() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data?.session?.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  return (
    <Link
      href="/account"
      className="text-[12px] sm:text-[13px] underline underline-offset-4 decoration-[0.5px] hover:opacity-70"
    >
      {email ? "Account" : "Log In"}
    </Link>
  );
}
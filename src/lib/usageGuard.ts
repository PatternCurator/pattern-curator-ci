import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireUsageOrRedirect(opts: {
  email: string | null;
  action: "search" | "view_board" | "view_moodboard" | "view_asset" | "view_post";
  redirectTo?: string; // default "/"
}) {
  const redirectTo = opts.redirectTo ?? "/";
  const email = (opts.email ?? "").trim().toLowerCase();

  // No email session: go home (EmailGate will overlay)
  if (!email) redirect(redirectTo);

  // Build absolute URL to internal API
  const h = headers(); // ✅ not async
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (!host) redirect(redirectTo);

  const url = `${proto}://${host}/api/usage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ email, action: opts.action }),
  });

  if (!res.ok) {
    // Fail closed: protect content
    redirect(redirectTo);
  }

  const json = (await res.json().catch(() => ({}))) as any;
  const isUnlocked = Boolean(json?.is_unlocked);

  if (!isUnlocked) redirect(redirectTo);

  return { email, isUnlocked };
}
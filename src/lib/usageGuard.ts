import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side usage gate.
 * Calls internal /api/usage and redirects if not unlocked.
 */
export async function requireUsageOrRedirect(opts: {
  email: string | null;
  action: "search" | "view_board" | "view_moodboard" | "view_asset" | "view_post";
  redirectTo?: string; // default "/pricing" once you add that route
}) {
  const redirectTo = opts.redirectTo ?? "/pricing";
  const email = (opts.email ?? "").trim().toLowerCase();

  // No email session: send to pricing (EmailGate can overlay there too)
  if (!email) redirect(redirectTo);

  // ✅ In your Next version/types, headers() returns a Promise
  const h = await headers();
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

  // Fail closed: protect content
  if (!res.ok) redirect(redirectTo);

  const json = (await res.json().catch(() => ({}))) as any;
  const isUnlocked = Boolean(json?.is_unlocked);

  if (!isUnlocked) redirect(redirectTo);

  return { email, isUnlocked };
}
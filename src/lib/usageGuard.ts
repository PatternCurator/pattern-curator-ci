import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side usage gate.
 * Calls your internal /api/usage endpoint so all counting rules stay centralized.
 *
 * Requirements:
 * - /api/usage must accept: { email, action } and return:
 *   { ok: boolean, is_unlocked: boolean } OR { is_unlocked: boolean }
 * - If not allowed, we redirect to /pricing (or your paywall route).
 */
export async function requireUsageOrRedirect(opts: {
  email: string | null;
  action:
    | "search"
    | "view_board"
    | "view_moodboard"
    | "view_asset"
    | "view_post";
  redirectTo?: string;
}) {
  const redirectTo = opts.redirectTo ?? "/pricing";
  const email = (opts.email ?? "").trim().toLowerCase();

  // No email session: send to pricing (or your email gate route)
  if (!email) redirect(redirectTo);

  // Build absolute URL to your own API route
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) redirect(redirectTo);

  const url = `${proto}://${host}/api/usage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // IMPORTANT: do not cache; we want a fresh counter update
    cache: "no-store",
    body: JSON.stringify({
      email,
      action: opts.action,
    }),
  });

  if (!res.ok) {
    // If the API is down, fail closed (protect content)
    redirect(redirectTo);
  }

  const json = (await res.json()) as any;
  const isUnlocked = Boolean(json?.is_unlocked ?? json?.isUnlocked ?? json?.allowed);

  if (!isUnlocked) redirect(redirectTo);

  return { email, isUnlocked };
}
export function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined) {
  const e = normalizeEmail(email || "");
  if (!e) return false;

  const raw = process.env.ADMIN_EMAILS || "";
  const allow = raw
    .split(",")
    .map((s) => normalizeEmail(s))
    .filter(Boolean);

  return allow.includes(e);
}
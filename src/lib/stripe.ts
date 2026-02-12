import "server-only";
import Stripe from "stripe";

/**
 * Deploy-first helper:
 * - Never throws at import time.
 * - Returns null if STRIPE_SECRET_KEY is not set.
 */
export function getStripeOrNull() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  return new Stripe(key, { apiVersion: "2024-06-20" as any });
}

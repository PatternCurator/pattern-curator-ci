import "server-only";
import Stripe from "stripe";

// Deploy-first mode: do NOT throw if STRIPE_SECRET_KEY is missing.
// Routes can return a friendly 503 until you add keys later.
export function getStripeOrNull() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  return new Stripe(key, {
    apiVersion: "2024-06-20" as any,
  });
}

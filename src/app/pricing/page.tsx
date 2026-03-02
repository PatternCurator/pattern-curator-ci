import EmailGate from "@/components/EmailGate";
import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export default function PricingPage() {
  // EmailGate ensures: no password, email-only OTP.
  // PricingClient will read session email and start Stripe checkout.
  return (
    <EmailGate source="ci">
      <PricingClient />
    </EmailGate>
  );
}
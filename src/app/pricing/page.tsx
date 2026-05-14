import EmailGate from "@/components/EmailGate";
import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export default function PricingPage() {
  return (
    <EmailGate source="ci">
      <PricingClient />
    </EmailGate>
  );
}
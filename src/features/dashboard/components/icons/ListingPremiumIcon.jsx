// ======================================================================
// Ícone KPI — Anúncio Premium (Store + coroa, roxo via CSS).
// ======================================================================

import { Crown, Store } from "lucide-react";

/**
 * @param {{ className?: string; title?: string }} props
 */
export default function ListingPremiumIcon({ className = "", title = "Anúncio Premium" }) {
  return (
    <span
      className={["s7-pricing-health-listing-store-badge", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      title={title}
    >
      <Store className="s7-pricing-health-listing-store-badge__store" strokeWidth={2} />
      <Crown className="s7-pricing-health-listing-store-badge__crown" strokeWidth={2.25} />
    </span>
  );
}

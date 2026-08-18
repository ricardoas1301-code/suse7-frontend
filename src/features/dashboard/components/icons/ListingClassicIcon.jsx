// ======================================================================
// Ícone KPI — Anúncio Clássico (Store line icon, azul via CSS).
// ======================================================================

import { Store } from "lucide-react";

/**
 * @param {{ className?: string; title?: string }} props
 */
export default function ListingClassicIcon({ className = "", title = "Anúncio Clássico" }) {
  return (
    <Store
      className={className}
      aria-hidden="true"
      title={title}
      strokeWidth={2}
    />
  );
}

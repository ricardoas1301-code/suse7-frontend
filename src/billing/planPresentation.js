// ======================================================================
// Camada visual de planos — suporte e metadados de apresentação (UI)
// Limites/preço vêm do catálogo via API (`public.plans`).
// ======================================================================

import { resolvePlanSupportLabel } from "./planSupportChannels";

export function getPlanPresentation(planKey) {
  const key = String(planKey || "").toLowerCase();
  return {
    support: resolvePlanSupportLabel(key),
  };
}

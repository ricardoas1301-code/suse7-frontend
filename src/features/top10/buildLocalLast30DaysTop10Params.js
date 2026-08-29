// ======================================================================
// Scope local do Top 10 para listas: últimos 30 dias + conta da página.
// Reutiliza getDefaultLast30DaysRange + resolveTop10Scope (sem estado global).
// ======================================================================

import { resolveTop10Scope } from "../../components/dashboard/dashboardScope.js";
import { getDefaultLast30DaysRange } from "../vendas/filters/vendasFiltersPeriod.js";

/**
 * Params de API para o badge Top 10 nas listas (Vendas / Precificações / Anúncios).
 * Período sempre rolling “últimos 30 dias”; conta vem do filtro local da página.
 *
 * @param {{ marketplaceAccountId?: string | null; marketplace?: string | null }} [input]
 * @returns {import("../../services/salesTop10Api.js").SalesTop10Params}
 */
export function buildLocalLast30DaysTop10Params(input = {}) {
  const defaultRange = getDefaultLast30DaysRange();
  const accountId =
    input.marketplaceAccountId != null && String(input.marketplaceAccountId).trim() !== ""
      ? String(input.marketplaceAccountId).trim()
      : "";
  const marketplace =
    input.marketplace != null && String(input.marketplace).trim() !== ""
      ? String(input.marketplace).trim()
      : "";

  const scope = resolveTop10Scope(
    {
      periodPreset: "last_30_days",
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      marketplace,
      marketplaceAccountId: accountId,
    },
    { periodTouched: false },
  );

  return /** @type {import("../../services/salesTop10Api.js").SalesTop10Params} */ (
    scope.executiveParams
  );
}

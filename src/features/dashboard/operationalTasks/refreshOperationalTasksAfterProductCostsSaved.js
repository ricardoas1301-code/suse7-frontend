// ======================================================================
// Pós-save de custos — invalida/refaz Pendências da operação (SSOT).
// Mesma fonte do modal em lote: GET /api/products/costs/pending → total.
// ======================================================================

import { fetchPendingProductCosts } from "../../products/costs/productCostsApi.js";
import {
  invalidateOperationalTasksCache,
  notifyProductCostsSaved,
} from "./operationalTasksApi.js";

/**
 * Refaz a contagem canônica de produtos com custo pendente e atualiza o card.
 * Sem decremento manual — somente após persistência confirmada pelo caller.
 */
export async function refreshOperationalTasksAfterProductCostsSaved() {
  const pendingResult = await fetchPendingProductCosts({ page: 1, pageSize: 1 });

  if (pendingResult.ok && Number.isFinite(Number(pendingResult.total))) {
    return notifyProductCostsSaved({ remainingCount: Number(pendingResult.total) });
  }

  invalidateOperationalTasksCache({
    reason: "product_costs_saved",
    force_revalidate: true,
  });
  return null;
}

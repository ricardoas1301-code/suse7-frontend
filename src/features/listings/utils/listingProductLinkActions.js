// ======================================================================
// Ações de vínculo/custos na linha — SSOT compartilhado (Anúncios / Precificações / Vendas).
// ======================================================================

import { ATTENTION_REASON_SKU_PENDING_ML } from "../../../constants/listingAttention.js";

export const SKU_DEPENDENCY_REASON = {
  ML_MISSING_SKU: "ml_missing_sku",
  PRODUCT_LINK_MISSING: "product_link_missing",
};

/** @param {Record<string, unknown>} row */
export function resolveListingSkuDependency(row) {
  const hasCanonicalPending = typeof row.skuDependencyPending === "boolean";
  const canonicalReason =
    row.skuDependencyReason === SKU_DEPENDENCY_REASON.ML_MISSING_SKU ||
    row.skuDependencyReason === SKU_DEPENDENCY_REASON.PRODUCT_LINK_MISSING
      ? row.skuDependencyReason
      : null;

  if (hasCanonicalPending) {
    return {
      pending: row.skuDependencyPending,
      reason: row.skuDependencyPending ? canonicalReason : null,
      source: "canonical",
    };
  }

  const legacySkuPending =
    row.attentionReason === ATTENTION_REASON_SKU_PENDING_ML || row.skuPending === true;
  const legacyMissingProduct =
    !row.productId ||
    (row.pricingContext != null &&
      typeof row.pricingContext === "object" &&
      /** @type {{ product_health?: { product_health_status?: string } }} */ (row.pricingContext)
        .product_health?.product_health_status === "MISSING_PRODUCT");

  return {
    pending: legacySkuPending || legacyMissingProduct,
    reason: legacySkuPending
      ? SKU_DEPENDENCY_REASON.ML_MISSING_SKU
      : legacyMissingProduct
        ? SKU_DEPENDENCY_REASON.PRODUCT_LINK_MISSING
        : null,
    source: "legacy",
  };
}

export function isAnunciosCatalogRowPending(row) {
  if (resolveListingSkuDependency(row).pending) return true;
  const ph =
    row.pricingContext != null && typeof row.pricingContext === "object"
      ? /** @type {{ product_health?: { product_health_status?: string } }} */ (row.pricingContext).product_health
      : null;
  const st = ph?.product_health_status != null ? String(ph.product_health_status) : null;
  if (st === "MISSING_PRODUCT") return true;
  if (row.skuPending) return true;
  if (!row.productId) return true;
  if (row.isProductReady === true) return false;
  if (row.isProductReady === false) return true;
  if (row.isProductReady == null && st === "INCOMPLETE_PRODUCT") return true;
  return false;
}

/**
 * @param {{ skuDependencyPending?: boolean; skuDependencyReason?: string | null; sku?: string | null; skuPending?: boolean; attentionReason?: string | null; pricingContext?: Record<string, unknown> | null; productId?: string | null; isProductReady?: boolean | null; initialSyncUniverseStable?: boolean | null }} row
 * @param {(r: typeof row) => void} [onInformSku]
 */
export function getListingProductLinkActions(row, onInformSku) {
  const universeStable = row.initialSyncUniverseStable !== false;
  if (!universeStable) {
    return {
      isSkuPendingMl: false,
      isProductLinkPending: false,
      skuDependencyPending: false,
      skuDependencyReason: null,
      skuDependencySource: "universe_gate",
      healthSt: null,
      showInformSkuMl: false,
      showVincular: false,
      showCompletar: false,
      primaryCtaLabel: null,
      blockedByInitialSyncUniverse: true,
      blockedReason: "Sincronização estrutural em andamento",
    };
  }

  const skuDependency = resolveListingSkuDependency(row);
  const isSkuPendingMl =
    skuDependency.pending && skuDependency.reason === SKU_DEPENDENCY_REASON.ML_MISSING_SKU;
  const isProductLinkPending =
    skuDependency.pending && skuDependency.reason === SKU_DEPENDENCY_REASON.PRODUCT_LINK_MISSING;
  const phSt =
    row.pricingContext != null && typeof row.pricingContext === "object"
      ? /** @type {{ product_health?: { product_health_status?: string } }} */ (row.pricingContext).product_health
          ?.product_health_status
      : null;
  const healthSt = phSt != null ? String(phSt) : null;
  const hasInform = typeof onInformSku === "function";
  const pid = row.productId != null && String(row.productId).trim() !== "" ? String(row.productId).trim() : "";
  const incompletoCadastroMinimo =
    row.isProductReady === true
      ? false
      : typeof row.isProductReady === "boolean"
        ? row.isProductReady === false
        : healthSt === "INCOMPLETE_PRODUCT";
  return {
    isSkuPendingMl,
    isProductLinkPending,
    skuDependencyPending: skuDependency.pending,
    skuDependencyReason: skuDependency.reason,
    skuDependencySource: skuDependency.source,
    healthSt,
    showInformSkuMl: hasInform && isSkuPendingMl,
    showVincular:
      hasInform &&
      isProductLinkPending,
    showCompletar: !skuDependency.pending && Boolean(pid) && incompletoCadastroMinimo,
    primaryCtaLabel: isSkuPendingMl
      ? "Cadastrar SKU"
      : isProductLinkPending
        ? "Vincular produto"
        : null,
    blockedByInitialSyncUniverse: false,
    blockedReason: null,
  };
}

/** @param {Parameters<typeof getListingProductLinkActions>[0]} row */
export function shouldShowCadastrarCustosListaRow(row) {
  return getListingProductLinkActions(row).showCompletar;
}

// ======================================================
// PI — Promoções: chave estável do cenário financeiro simulado (Clássico/Premium).
// Espelha chaveCacheSimulacaoOficial — somente orquestração de loading.
// ======================================================

/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */

/**
 * @param {Record<string, unknown> | null | undefined} cfg
 * @returns {Record<string, unknown> | null}
 */
function montarPayloadExtrasPrecificacaoInteligenteLocal(cfg) {
  if (cfg == null || typeof cfg !== "object") return null;
  return {
    plannedPromoEnabled: cfg.plannedPromoEnabled === true,
    plannedPromoPercent: cfg.plannedPromoPct ?? cfg.plannedPromoPercent ?? null,
    affiliatesEnabled: cfg.affiliatesEnabled === true,
    affiliatePercent: cfg.affiliatesPct ?? cfg.affiliatePercent ?? null,
    mlAdsEnabled: cfg.mlAdsEnabled === true,
    mlAdsPercent: cfg.mlAdsPct ?? cfg.mlAdsPercent ?? null,
    operationalCostEnabled: cfg.reserveEnabled === true,
    operationalCostPercent: cfg.reservePct ?? cfg.reservePercent ?? null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} cfg
 * @returns {string}
 */
function chaveExtrasPrecificacaoInteligenteLocal(cfg) {
  const p = montarPayloadExtrasPrecificacaoInteligenteLocal(cfg);
  if (p == null) return "none";
  /** @type {string[]} */
  const parts = [];
  if (p.plannedPromoEnabled === true) parts.push(`p:${String(p.plannedPromoPercent ?? "0")}`);
  if (p.affiliatesEnabled === true) parts.push(`a:${String(p.affiliatePercent ?? "0")}`);
  if (p.mlAdsEnabled === true) parts.push(`m:${String(p.mlAdsPercent ?? "0")}`);
  if (p.operationalCostEnabled === true) parts.push(`o:${String(p.operationalCostPercent ?? "0")}`);
  return parts.length > 0 ? parts.join("|") : "none";
}

/**
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: ListingTypeChoice;
 *   precoPromocao?: number | null;
 *   configuracaoFinanceira?: Record<string, unknown> | null;
 *   promotionSelection?: { promotion_id?: string | null } | null;
 * }} params
 * @returns {string | null}
 */
export function montarChaveCenarioFinanceiroPromocao({
  listingExternalId,
  listingId,
  listingType,
  precoPromocao = null,
  configuracaoFinanceira = null,
  promotionSelection = null,
}) {
  if (precoPromocao == null || !(precoPromocao > 0)) return null;
  const anuncio =
    (listingExternalId != null && String(listingExternalId).trim() !== ""
      ? String(listingExternalId).trim()
      : String(listingId ?? "").trim()) || "?";
  const valor = Math.round(precoPromocao * 100) / 100;
  const extras = chaveExtrasPrecificacaoInteligenteLocal(configuracaoFinanceira);
  const promo =
    promotionSelection?.promotion_id != null && String(promotionSelection.promotion_id).trim() !== ""
      ? String(promotionSelection.promotion_id).trim()
      : "none";
  return `${anuncio}|${listingType}|preco:${valor}|promo:${promo}|extras:${extras}`;
}

/**
 * @param {{
 *   selectedKey?: string | null;
 *   renderedKey?: string | null;
 *   loading?: boolean;
 * }} params
 * @returns {boolean}
 */
export function resolverCenarioFinanceiroPromocaoPendente({
  selectedKey = null,
  renderedKey = null,
  loading = false,
}) {
  if (selectedKey == null) return false;
  if (loading === true) return true;
  if (renderedKey == null || String(renderedKey).trim() === "") return true;
  return selectedKey !== renderedKey;
}

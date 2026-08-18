// ======================================================
// Chaves estáveis da simulação oficial (sem I/O / sem API).
// ======================================================

/**
 * @typedef {{
 *   plannedPromoEnabled?: boolean;
 *   plannedPromoPct?: string;
 *   affiliatesEnabled?: boolean;
 *   affiliatesPct?: string;
 *   mlAdsEnabled?: boolean;
 *   mlAdsPct?: string;
 *   reserveEnabled?: boolean;
 *   reservePct?: string;
 * }} ConfiguracaoFinanceiraExtras
 */

/**
 * @param {ConfiguracaoFinanceiraExtras | null | undefined} cfg
 */
export function montarPayloadExtrasPrecificacaoInteligente(cfg) {
  if (cfg == null || typeof cfg !== "object") return null;
  return {
    plannedPromoEnabled: cfg.plannedPromoEnabled === true,
    plannedPromoPercent: cfg.plannedPromoPct ?? null,
    affiliatesEnabled: cfg.affiliatesEnabled === true,
    affiliatePercent: cfg.affiliatesPct ?? null,
    mlAdsEnabled: cfg.mlAdsEnabled === true,
    mlAdsPercent: cfg.mlAdsPct ?? null,
    operationalCostEnabled: cfg.reserveEnabled === true,
    operationalCostPercent: cfg.reservePct ?? null,
  };
}

/**
 * @param {ConfiguracaoFinanceiraExtras | null | undefined} cfg
 */
export function chaveExtrasPrecificacaoInteligente(cfg) {
  const p = montarPayloadExtrasPrecificacaoInteligente(cfg);
  if (p == null) return "none";
  /** @type {string[]} */
  const parts = [];
  if (p.plannedPromoEnabled) parts.push(`p:${String(p.plannedPromoPercent ?? "0")}`);
  if (p.affiliatesEnabled) parts.push(`a:${String(p.affiliatePercent ?? "0")}`);
  if (p.mlAdsEnabled) parts.push(`m:${String(p.mlAdsPercent ?? "0")}`);
  if (p.operationalCostEnabled) parts.push(`o:${String(p.operationalCostPercent ?? "0")}`);
  return parts.length > 0 ? parts.join("|") : "none";
}

/**
 * Chave de cache estável: anúncio + tipo + (preço OU margem) + extras PI.
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: string;
 *   kind: "preco" | "margem";
 *   value: number;
 *   configuracaoFinanceira?: ConfiguracaoFinanceiraExtras | null;
 *   promotionId?: string | null;
 * }} p
 */
export function chaveCacheSimulacaoOficial(p) {
  const anuncio =
    (p.listingExternalId != null && String(p.listingExternalId).trim() !== ""
      ? String(p.listingExternalId).trim()
      : String(p.listingId ?? "").trim()) || "?";
  const valor = Number.isFinite(p.value) ? Math.round(p.value * 100) / 100 : "?";
  const extras = chaveExtrasPrecificacaoInteligente(p.configuracaoFinanceira);
  const promo =
    p.promotionId != null && String(p.promotionId).trim() !== "" ? String(p.promotionId).trim() : "none";
  return `${anuncio}|${p.listingType}|${p.kind}:${valor}|promo:${promo}|extras:${extras}`;
}

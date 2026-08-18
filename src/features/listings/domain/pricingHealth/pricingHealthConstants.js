// ======================================================================
// Constantes — filtros rápidos Precificações (paridade Central de Saúde).
// Espelho: pricingHealthConstants.js (backend).
// ======================================================================

/** Estado padrão ao limpar filtros. */
export const PRECIFICACOES_QUICK_FILTER_NEUTRAL_ID = "top_sales";

/** IDs legados removidos do menu — normalizados com segurança. */
export const PRECIFICACOES_QUICK_FILTER_LEGACY_ALIASES = {
  all: "top_sales",
  low_margin: "projected_margin_0_9",
  needs_attention: "offer_status_attention",
  loss: "projected_margin_loss",
  mercadolivre: "top_sales",
};

/** Faixas — Status da Oferta (chaves canônicas). */
export const PRICING_HEALTH_OFFER_STATUS_KEYS = [
  "offer_status_healthy",
  "offer_status_attention",
  "offer_status_critical",
  "offer_status_no_data",
];

/** Faixas — Margem Projetada (chaves de filtro → bucket SSOT). */
export const PRICING_HEALTH_PROJECTED_MARGIN_FILTER_TO_BUCKET = {
  projected_margin_30_plus: "margin_30_plus",
  projected_margin_20_29: "margin_20_29",
  projected_margin_10_19: "margin_10_19",
  projected_margin_0_9: "margin_0_9",
  projected_margin_loss: "loss",
  projected_margin_no_data: "no_data",
};

/** Faixas — Promoções (chaves de filtro → bucket SSOT). */
export const PRICING_HEALTH_PROMOTION_FILTER_TO_BUCKET = {
  promotion_active: "active_promotion",
  promotion_scheduled: "scheduled_promotion",
  promotion_available: "available_promotion",
  promotion_none: "no_promotion",
};

/** Tipo de anúncio (chaves de filtro → bucket SSOT). */
export const PRICING_HEALTH_LISTING_TYPE_FILTER_TO_BUCKET = {
  listing_type_classic: "classic",
  listing_type_premium: "premium",
};

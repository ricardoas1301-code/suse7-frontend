// ======================================================================
// Constantes — filtros rápidos Produtos (paridade Central de Saúde).
// ======================================================================

/** IDs legados removidos do menu — normalizados com segurança. */
export const PRODUCTS_QUICK_FILTER_LEGACY_ALIASES = {
  low_margin: "profit_low",
  margin_low: "profit_low",
  needs_attention: "top_sales",
  opportunity: "top_sales",
  declining: "top_sales",
  new_no_history: "top_sales",
  all: "top_sales",
};

/** Estado neutro da lista (sem filtro de saúde). */
export const PRODUCTS_QUICK_FILTER_NEUTRAL_ID = "top_sales";

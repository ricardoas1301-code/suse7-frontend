// ======================================================================
// Configuração declarativa — filtros rápidos da Página Vendas.
// UI separada da regra (vendasListQuickFilter.js no backend).
// ======================================================================

/** @typedef {"ordering" | "financial_health" | "sale_status"} VendasQuickFilterSection */

/** @type {Record<VendasQuickFilterSection, string>} */
export const VENDAS_QUICK_FILTER_SECTION_LABELS = {
  ordering: "ORDENAÇÃO",
  financial_health: "SAÚDE FINANCEIRA",
  sale_status: "STATUS DA VENDA",
};

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   buttonLabel?: string;
 *   icon: string;
 *   iconTone: string;
 *   section: VendasQuickFilterSection;
 *   kind: "sort" | "filter";
 *   title?: string;
 * }} VendasQuickFilterOption
 */

export const VENDAS_QUICK_FILTER_NEUTRAL_ID = "all";

/** @type {readonly VendasQuickFilterOption[]} */
export const VENDAS_QUICK_FILTER_OPTIONS = [
  {
    id: "profit_high",
    label: "Mais lucrativas",
    icon: "catalog_filter_top_profit",
    iconTone: "success",
    section: "ordering",
    kind: "sort",
    title: "Ordenar por lucro em R$ decrescente",
  },
  {
    id: "margin_low",
    label: "Margem crítica",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    section: "financial_health",
    kind: "filter",
  },
  {
    id: "loss",
    label: "Em prejuízo",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    section: "financial_health",
    kind: "filter",
  },
  {
    id: "no_profit_data",
    label: "Sem dados de lucro",
    icon: "catalog_filter_new",
    iconTone: "slate",
    section: "financial_health",
    kind: "filter",
    title: "Vendas sem resultado financeiro canônico calculável",
  },
  {
    id: "status_to_ship",
    label: "A enviar",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "sale_status",
    kind: "filter",
  },
  {
    id: "status_in_transit",
    label: "A caminho",
    icon: "catalog_filter_with_sales",
    iconTone: "success",
    section: "sale_status",
    kind: "filter",
  },
  {
    id: "status_delivered",
    label: "Entregue",
    icon: "billing_check",
    iconTone: "success",
    section: "sale_status",
    kind: "filter",
  },
  {
    id: "status_cancelled",
    label: "Cancelada",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    section: "sale_status",
    kind: "filter",
  },
];

/**
 * Chips legados para relatórios e contratos que esperam SALES_FILTER_CHIPS.
 * @type {{ id: string; label: string; icon: string; iconTone: string }[]}
 */
export const SALES_FILTER_CHIPS = [
  { id: VENDAS_QUICK_FILTER_NEUTRAL_ID, label: "Todos", icon: "catalog_filter_all", iconTone: "neutral" },
  ...VENDAS_QUICK_FILTER_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    icon: option.icon,
    iconTone: option.iconTone,
  })),
];

/**
 * @param {string} filterId
 * @returns {VendasQuickFilterOption | undefined}
 */
export function findVendasQuickFilterOption(filterId) {
  const id = String(filterId ?? "").trim();
  return VENDAS_QUICK_FILTER_OPTIONS.find((option) => option.id === id);
}

/**
 * @param {string} filterId
 */
export function resolverRotuloBotaoFiltroRapidoVendas(filterId) {
  const option = findVendasQuickFilterOption(filterId);
  if (!option) return null;
  return option.buttonLabel ?? option.label;
}

/**
 * @param {string} filterId
 */
export function filtroRapidoVendasAfetaResumoExecutivo(filterId) {
  const id = String(filterId ?? "").trim() || VENDAS_QUICK_FILTER_NEUTRAL_ID;
  return id !== VENDAS_QUICK_FILTER_NEUTRAL_ID && id !== "profit_high";
}

// ======================================================================
// Configuração declarativa — filtros rápidos da Página Produtos (18 opções).
// UI separada da regra (productHealthListClassifiers.js).
// ======================================================================

import { S7_OPERATIONAL_SORT_TOP_SALES_CHIP } from "../../../utils/s7OperationalListSort.js";

/** @typedef {"ordering" | "abc" | "stock_coverage" | "profitability" | "health_action"} ProductsQuickFilterSection */

/** @type {Record<ProductsQuickFilterSection, string>} */
export const PRODUCTS_QUICK_FILTER_SECTION_LABELS = {
  ordering: "ORDENAÇÃO",
  abc: "CURVA ABC",
  stock_coverage: "COBERTURA DE ESTOQUE",
  profitability: "LUCRATIVIDADE",
  health_action: "SAÚDE E AÇÃO",
};

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   icon: string;
 *   iconTone: string;
 *   section: ProductsQuickFilterSection;
 *   kind: "sort" | "filter";
 *   title?: string;
 * }} ProductsQuickFilterOption
 */

/** @type {readonly ProductsQuickFilterOption[]} */
export const PRODUCTS_QUICK_FILTER_OPTIONS = [
  {
    id: S7_OPERATIONAL_SORT_TOP_SALES_CHIP.id,
    label: S7_OPERATIONAL_SORT_TOP_SALES_CHIP.label,
    icon: S7_OPERATIONAL_SORT_TOP_SALES_CHIP.icon,
    iconTone: S7_OPERATIONAL_SORT_TOP_SALES_CHIP.iconTone,
    section: "ordering",
    kind: "sort",
    title: "Ordenar por maior volume de vendas",
  },
  {
    id: "top_profit",
    label: "Mais lucrativos",
    icon: "catalog_filter_top_profit",
    iconTone: "success",
    section: "ordering",
    kind: "sort",
    title: "Ordenar por lucro em R$ decrescente",
  },
  {
    id: "abc_a",
    label: "Curva A",
    icon: "podium_medal",
    iconTone: "success",
    section: "abc",
    kind: "filter",
  },
  {
    id: "abc_b",
    label: "Curva B",
    icon: "podium_trophy",
    iconTone: "warning",
    section: "abc",
    kind: "filter",
  },
  {
    id: "abc_c",
    label: "Curva C",
    icon: "mercado_lider_medal",
    iconTone: "slate",
    section: "abc",
    kind: "filter",
  },
  {
    id: "no_sales",
    label: "Sem vendas",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    section: "abc",
    kind: "filter",
  },
  {
    id: "stock_out",
    label: "Sem estoque",
    icon: "catalog_filter_no_sales",
    iconTone: "danger",
    section: "stock_coverage",
    kind: "filter",
  },
  {
    id: "stock_critical",
    label: "Estoque crítico — até 7 dias",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "stock_coverage",
    kind: "filter",
  },
  {
    id: "stock_low",
    label: "Estoque baixo",
    icon: "catalog_filter_low_stock",
    iconTone: "warning",
    section: "stock_coverage",
    kind: "filter",
  },
  {
    id: "stock_healthy",
    label: "Estoque em dia",
    icon: "billing_check",
    iconTone: "success",
    section: "stock_coverage",
    kind: "filter",
  },
  {
    id: "profit_high",
    label: "Alta lucratividade",
    icon: "trend_up",
    iconTone: "success",
    section: "profitability",
    kind: "filter",
  },
  {
    id: "profit_ok",
    label: "Com lucro",
    icon: "catalog_filter_top_profit",
    iconTone: "success",
    section: "profitability",
    kind: "filter",
  },
  {
    id: "profit_low",
    label: "Lucro baixo",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    section: "profitability",
    kind: "filter",
  },
  {
    id: "loss",
    label: "Prejuízo",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    section: "profitability",
    kind: "filter",
  },
  {
    id: "dead_stock",
    label: "Estoque parado — +15 dias",
    icon: "catalog_filter_new",
    iconTone: "slate",
    section: "health_action",
    kind: "filter",
    title: "Inclui o diagnóstico de Sem venda recente da Cobertura de Estoque",
  },
  {
    id: "replenishment_priority",
    label: "Reposição prioritária",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "health_action",
    kind: "filter",
  },
  {
    id: "low_markup",
    label: "Markup abaixo de 1,5x",
    icon: "trend_down",
    iconTone: "warning",
    section: "health_action",
    kind: "filter",
  },
  {
    id: "turnover_15d",
    label: "Com giro nos últimos 15 dias",
    icon: "catalog_filter_with_sales",
    iconTone: "fire",
    section: "health_action",
    kind: "filter",
  },
];

/**
 * @param {string} filterId
 * @returns {ProductsQuickFilterOption | undefined}
 */
export function findProductsQuickFilterOption(filterId) {
  const id = String(filterId ?? "").trim();
  return PRODUCTS_QUICK_FILTER_OPTIONS.find((o) => o.id === id);
}

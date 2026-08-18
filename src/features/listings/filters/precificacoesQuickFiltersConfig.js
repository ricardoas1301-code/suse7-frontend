// ======================================================================
// Configuração declarativa — filtros rápidos da Página Precificações.
// UI separada da regra (pricingHealthListClassifiers.js).
// ======================================================================

import { S7_OPERATIONAL_SORT_TOP_SALES_CHIP } from "../../../utils/s7OperationalListSort.js";

/** @typedef {"ordering" | "offer_status" | "projected_margin" | "promotions" | "listing_type" | "logistics" | "operation"} PrecificacoesQuickFilterSection */

/** @type {Record<PrecificacoesQuickFilterSection, string>} */
export const PRECIFICACOES_QUICK_FILTER_SECTION_LABELS = {
  ordering: "ORDENAÇÃO",
  offer_status: "STATUS DA OFERTA",
  projected_margin: "MARGEM PROJETADA",
  promotions: "PROMOÇÕES DOS ANÚNCIOS",
  listing_type: "TIPO DE ANÚNCIO",
  logistics: "LOGÍSTICA",
  operation: "OPERAÇÃO E CADASTRO",
};

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   buttonLabel?: string;
 *   icon: string;
 *   iconTone: string;
 *   section: PrecificacoesQuickFilterSection;
 *   kind: "sort" | "filter";
 *   title?: string;
 * }} PrecificacoesQuickFilterOption
 */

/** @type {readonly PrecificacoesQuickFilterOption[]} */
export const PRECIFICACOES_QUICK_FILTER_OPTIONS = [
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
    id: "projected_margin_30_plus",
    label: "Margem ≥30%",
    icon: "trend_up",
    iconTone: "success",
    section: "projected_margin",
    kind: "filter",
  },
  {
    id: "projected_margin_20_29",
    label: "Margem 20–29%",
    icon: "trend_up",
    iconTone: "success",
    section: "projected_margin",
    kind: "filter",
  },
  {
    id: "projected_margin_10_19",
    label: "Margem 10–19%",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    section: "projected_margin",
    kind: "filter",
  },
  {
    id: "projected_margin_0_9",
    label: "Margem 0–9%",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    section: "projected_margin",
    kind: "filter",
  },
  {
    id: "projected_margin_loss",
    label: "Prejuízo",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    section: "projected_margin",
    kind: "filter",
  },
  {
    id: "projected_margin_no_data",
    label: "Sem dados",
    buttonLabel: "Margem: Sem dados",
    icon: "catalog_filter_new",
    iconTone: "slate",
    section: "projected_margin",
    kind: "filter",
  },
  {
    id: "offer_status_healthy",
    label: "Saudável",
    icon: "billing_check",
    iconTone: "success",
    section: "offer_status",
    kind: "filter",
  },
  {
    id: "offer_status_attention",
    label: "Atenção",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "offer_status",
    kind: "filter",
  },
  {
    id: "offer_status_critical",
    label: "Crítico",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    section: "offer_status",
    kind: "filter",
  },
  {
    id: "offer_status_no_data",
    label: "Sem dados",
    buttonLabel: "Status: Sem dados",
    icon: "catalog_filter_new",
    iconTone: "slate",
    section: "offer_status",
    kind: "filter",
  },
  {
    id: "promotion_active",
    label: "Em promoção",
    icon: "catalog_filter_with_sales",
    iconTone: "success",
    section: "promotions",
    kind: "filter",
  },
  {
    id: "promotion_scheduled",
    label: "Promoção programada",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "promotions",
    kind: "filter",
  },
  {
    id: "promotion_available",
    label: "Disponíveis para promoção",
    icon: "catalog_filter_with_ads",
    iconTone: "insight",
    section: "promotions",
    kind: "filter",
  },
  {
    id: "promotion_none",
    label: "Sem promoção",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    section: "promotions",
    kind: "filter",
  },
  {
    id: "listing_type_classic",
    label: "Clássico",
    icon: "catalog_filter_mkt",
    iconTone: "mkp",
    section: "listing_type",
    kind: "filter",
  },
  {
    id: "listing_type_premium",
    label: "Premium",
    icon: "catalog_filter_top_profit",
    iconTone: "success",
    section: "listing_type",
    kind: "filter",
  },
  {
    id: "logistics_free_shipping",
    label: "Com frete grátis",
    icon: "catalog_filter_with_ads",
    iconTone: "success",
    section: "logistics",
    kind: "filter",
  },
  {
    id: "operation_active",
    label: "Ativos no ar",
    icon: "catalog_filter_with_ads",
    iconTone: "success",
    section: "operation",
    kind: "filter",
  },
  {
    id: "operation_paused",
    label: "Pausados",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    section: "operation",
    kind: "filter",
  },
  {
    id: "operation_no_sales",
    label: "Sem vendas",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    section: "operation",
    kind: "filter",
  },
  {
    id: "operation_sku_pending",
    label: "SKU pendente",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "operation",
    kind: "filter",
  },
];

/**
 * @param {string} filterId
 * @returns {PrecificacoesQuickFilterOption | undefined}
 */
export function findPrecificacoesQuickFilterOption(filterId) {
  const id = String(filterId ?? "").trim();
  return PRECIFICACOES_QUICK_FILTER_OPTIONS.find((option) => option.id === id);
}

/**
 * Label do botão fechado (evita ambiguidade entre dois “Sem dados”).
 * @param {string} filterId
 */
export function resolverRotuloBotaoFiltroRapidoPrecificacoes(filterId) {
  const option = findPrecificacoesQuickFilterOption(filterId);
  if (!option) return null;
  return option.buttonLabel ?? option.label;
}

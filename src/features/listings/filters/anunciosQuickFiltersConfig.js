// ======================================================================
// Configuração declarativa — filtros rápidos da Página Anúncios.
// UI separada da regra (listingHealthListClassifiers.js).
// ======================================================================

import { S7_OPERATIONAL_SORT_TOP_SALES_CHIP } from "../../../utils/s7OperationalListSort.js";

/** @typedef {"ordering" | "executive" | "registration_health" | "operational_health" | "commercial_health"} AnunciosQuickFilterSection */

/** @type {Record<AnunciosQuickFilterSection, string>} */
export const ANUNCIOS_QUICK_FILTER_SECTION_LABELS = {
  ordering: "ORDENAÇÃO",
  executive: "VISÃO EXECUTIVA",
  registration_health: "SAÚDE DO CADASTRO",
  operational_health: "SAÚDE OPERACIONAL",
  commercial_health: "SAÚDE COMERCIAL",
};

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   icon: string;
 *   iconTone: string;
 *   section: AnunciosQuickFilterSection;
 *   kind: "sort" | "filter";
 *   title?: string;
 * }} AnunciosQuickFilterOption
 */

/** @type {readonly AnunciosQuickFilterOption[]} */
export const ANUNCIOS_QUICK_FILTER_OPTIONS = [
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
    id: "commercial_excellent_margin",
    label: "Margem ≥ 30%",
    icon: "trend_up",
    iconTone: "success",
    section: "commercial_health",
    kind: "filter",
  },
  {
    id: "commercial_healthy_margin",
    label: "Margem 20–29%",
    icon: "trend_up",
    iconTone: "success",
    section: "commercial_health",
    kind: "filter",
  },
  {
    id: "commercial_attention_margin",
    label: "Margem 10–19%",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    section: "commercial_health",
    kind: "filter",
  },
  {
    id: "commercial_critical_margin",
    label: "Margem 0–9%",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    section: "commercial_health",
    kind: "filter",
  },
  {
    id: "commercial_negative_margin",
    label: "Em prejuízo",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    section: "commercial_health",
    kind: "filter",
  },
  {
    id: "commercial_no_data",
    label: "Sem dados",
    icon: "catalog_filter_new",
    iconTone: "slate",
    section: "commercial_health",
    kind: "filter",
  },
  {
    id: "executive_active_listings",
    label: "Anúncios ativos",
    icon: "catalog_filter_with_ads",
    iconTone: "success",
    section: "executive",
    kind: "filter",
  },
  {
    id: "executive_offline",
    label: "Fora do ar",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    section: "executive",
    kind: "filter",
  },
  {
    id: "executive_active_with_sales",
    label: "Ativos com venda",
    icon: "catalog_filter_with_sales",
    iconTone: "fire",
    section: "executive",
    kind: "filter",
  },
  {
    id: "executive_active_without_sales",
    label: "Ativos sem venda",
    icon: "trend_down",
    iconTone: "decline",
    section: "executive",
    kind: "filter",
  },
  {
    id: "executive_needs_attention",
    label: "Precisam atenção",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "executive",
    kind: "filter",
  },
  {
    id: "registration_complete",
    label: "Cadastro 100%",
    icon: "billing_check",
    iconTone: "success",
    section: "registration_health",
    kind: "filter",
  },
  {
    id: "registration_excellent",
    label: "Cadastro 90–99%",
    icon: "billing_check",
    iconTone: "success",
    section: "registration_health",
    kind: "filter",
  },
  {
    id: "registration_attention",
    label: "Cadastro 70–89%",
    icon: "billing_check",
    iconTone: "warning",
    section: "registration_health",
    kind: "filter",
  },
  {
    id: "registration_critical",
    label: "Cadastro 50–69%",
    icon: "billing_check",
    iconTone: "warning",
    section: "registration_health",
    kind: "filter",
  },
  {
    id: "registration_urgent",
    label: "Cadastro abaixo de 50%",
    icon: "billing_check",
    iconTone: "danger",
    section: "registration_health",
    kind: "filter",
  },
  {
    id: "operational_critical_stock",
    label: "Críticos",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "operational_health",
    kind: "filter",
    title: "Estoque crítico",
  },
  {
    id: "operational_zero_stock",
    label: "Sem estoque",
    icon: "catalog_filter_no_sales",
    iconTone: "danger",
    section: "operational_health",
    kind: "filter",
  },
  {
    id: "operational_paused",
    label: "Pausados",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    section: "operational_health",
    kind: "filter",
  },
  {
    id: "operational_inactive",
    label: "Inativos",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    section: "operational_health",
    kind: "filter",
  },
];

/**
 * @param {string} filterId
 * @returns {AnunciosQuickFilterOption | undefined}
 */
export function findAnunciosQuickFilterOption(filterId) {
  const id = String(filterId ?? "").trim();
  return ANUNCIOS_QUICK_FILTER_OPTIONS.find((option) => option.id === id);
}

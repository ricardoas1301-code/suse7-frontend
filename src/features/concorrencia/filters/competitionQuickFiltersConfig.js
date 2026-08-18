// ======================================================================
// Configuração declarativa — filtros rápidos da Página Concorrência (15 opções).
// UI separada da regra (competitionHealthListClassifiers.js).
// ======================================================================

import { S7_OPERATIONAL_SORT_TOP_SALES_CHIP } from "../../../utils/s7OperationalListSort.js";

/** @typedef {"ordering" | "monitoring_coverage" | "price_position" | "logistics_health" | "reputation"} ConcorrenciaQuickFilterSection */

/** @type {Record<ConcorrenciaQuickFilterSection, string>} */
export const CONCORRENCIA_QUICK_FILTER_SECTION_LABELS = {
  ordering: "ORDENAÇÃO",
  monitoring_coverage: "COBERTURA DO MONITORAMENTO",
  price_position: "POSIÇÃO DE PREÇO",
  logistics_health: "LOGÍSTICA E SAÚDE",
  reputation: "REPUTAÇÃO DOS CONCORRENTES",
};

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   icon: string;
 *   iconTone: string;
 *   section: ConcorrenciaQuickFilterSection;
 *   kind: "sort" | "filter";
 *   title?: string;
 * }} ConcorrenciaQuickFilterOption
 */

/** @type {readonly ConcorrenciaQuickFilterOption[]} */
export const CONCORRENCIA_QUICK_FILTER_OPTIONS = [
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
    id: "with",
    label: "Com concorrentes",
    icon: "monitoring",
    iconTone: "mkp",
    section: "monitoring_coverage",
    kind: "filter",
  },
  {
    id: "without",
    label: "Sem concorrentes",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    section: "monitoring_coverage",
    kind: "filter",
  },
  {
    id: "complete",
    label: "Monitoramento completo",
    icon: "billing_check",
    iconTone: "success",
    section: "monitoring_coverage",
    kind: "filter",
  },
  {
    id: "incomplete",
    label: "Monitoramento incompleto",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    section: "monitoring_coverage",
    kind: "filter",
  },
  {
    id: "cheaper",
    label: "Mais baratos",
    icon: "trend_down",
    iconTone: "success",
    section: "price_position",
    kind: "filter",
  },
  {
    id: "more_expensive",
    label: "Mais caros",
    icon: "trend_up",
    iconTone: "decline",
    section: "price_position",
    kind: "filter",
  },
  {
    id: "free_shipping_competitors",
    label: "Concorrentes com frete grátis",
    icon: "truck_shipping",
    iconTone: "mkp",
    section: "logistics_health",
    kind: "filter",
  },
  {
    id: "full_competitors",
    label: "Concorrentes no Full",
    icon: "billing_layers",
    iconTone: "success",
    section: "logistics_health",
    kind: "filter",
  },
  {
    id: "inactive_competitors",
    label: "Concorrentes inativos",
    icon: "catalog_filter_attention",
    iconTone: "slate",
    section: "logistics_health",
    kind: "filter",
  },
  {
    id: "platinum",
    label: "Platinum",
    icon: "podium_medal",
    iconTone: "slate",
    section: "reputation",
    kind: "filter",
  },
  {
    id: "gold",
    label: "Gold",
    icon: "podium_trophy",
    iconTone: "warning",
    section: "reputation",
    kind: "filter",
  },
  {
    id: "mercado_lider",
    label: "MercadoLíder",
    icon: "billing_shield",
    iconTone: "mkp",
    section: "reputation",
    kind: "filter",
  },
  {
    id: "green_reputation",
    label: "Reputação verde",
    icon: "billing_check",
    iconTone: "success",
    section: "reputation",
    kind: "filter",
  },
  {
    id: "no_reputation",
    label: "Sem reputação",
    icon: "catalog_filter_no_sales",
    iconTone: "neutral",
    section: "reputation",
    kind: "filter",
  },
];

/**
 * @param {string} filterId
 * @returns {ConcorrenciaQuickFilterOption | undefined}
 */
export function findConcorrenciaQuickFilterOption(filterId) {
  const id = String(filterId ?? "").trim();
  return CONCORRENCIA_QUICK_FILTER_OPTIONS.find((o) => o.id === id);
}

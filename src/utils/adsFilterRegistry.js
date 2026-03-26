// ======================================================================
// SUSE7 — Chips de filtro da listagem de Anúncios (UI + placeholders).
// Filtros aplicam-se aos dados da listagem (mock até a API existir).
// ======================================================================

import { CATALOG_FILTER_LOW_MARGIN_MAX_PCT } from "./applyCatalogFilters.js";

/**
 * @typedef {(
 *   'neutral' | 'danger' | 'warning' | 'fire' | 'success' | 'slate' | 'mkp' | 'insight' | 'decline'
 * )} AdsFilterIconTone
 */

/** @type {Array<{ id: string; label: string; icon: string; iconTone: AdsFilterIconTone; enabled: boolean; description: string }>} */
export const ADS_FILTER_DEFINITIONS = [
  {
    id: "all",
    label: "Todos",
    icon: "catalog_filter_all",
    iconTone: "neutral",
    enabled: true,
    description: "Mostra todos os anúncios da listagem.",
  },
  {
    id: "top_sales",
    label: "Mais vendidos",
    icon: "catalog_filter_top_sales",
    iconTone: "fire",
    enabled: true,
    description: "Anúncios no patamar superior de vendas (entre os da lista atual).",
  },
  {
    id: "top_profit",
    label: "Mais lucrativos",
    icon: "catalog_filter_top_profit",
    iconTone: "success",
    enabled: true,
    description: "Anúncios com maior lucro absoluto na lista atual.",
  },
  {
    id: "low_margin",
    label: "Margem baixa",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    enabled: true,
    description: `Margem entre 0% e ${CATALOG_FILTER_LOW_MARGIN_MAX_PCT}% (mesmo critério do catálogo de produtos).`,
  },
  {
    id: "loss",
    label: "Prejuízo",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    enabled: true,
    description: "Anúncios com margem negativa ou lucro negativo.",
  },
  {
    id: "no_sales",
    label: "Sem vendas",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    enabled: true,
    description: "Anúncios sem unidades vendidas no período.",
  },
  {
    id: "visit_volume",
    label: "Qtd visitas",
    icon: "ads_filter_visits",
    iconTone: "insight",
    enabled: true,
    description: "Anúncios com volume de visitas no patamar superior (entre os da lista atual).",
  },
  {
    id: "active",
    label: "Ativos no ar",
    icon: "catalog_filter_with_ads",
    iconTone: "success",
    enabled: true,
    description: "Anúncios com status ativo no marketplace.",
  },
  {
    id: "paused",
    label: "Pausados",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    enabled: true,
    description: "Anúncios pausados ou inativos.",
  },
  {
    id: "mercadolivre",
    label: "Mercado Livre",
    icon: "catalog_filter_mkt",
    iconTone: "mkp",
    enabled: true,
    description: "Somente anúncios no Mercado Livre.",
  },
  {
    id: "needs_attention",
    label: "Precisam atenção",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    enabled: true,
    description: "Anúncios com alertas ou métricas fora do esperado.",
  },
  {
    id: "declining",
    label: "Em queda",
    icon: "catalog_filter_declining",
    iconTone: "decline",
    enabled: true,
    description: "Anúncios com tendência de queda em vendas ou saúde.",
  },
];

export function getAdsFilterChipsForToolbar() {
  return ADS_FILTER_DEFINITIONS;
}

/**
 * Limiar do “top” entre os itens já filtrados (ex.: mais vendidos / visitas).
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} key
 * @param {number} topFraction fração superior (0–1], ex. 0.4 = ~40% melhores
 */
function rowPassesTopTier(rows, key, topFraction = 0.4) {
  const vals = rows.map((r) => Number(r[key]) || 0).filter((v) => v > 0);
  if (vals.length === 0) return () => false;
  const sorted = [...vals].sort((a, b) => b - a);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * topFraction) - 1));
  const threshold = sorted[idx];
  return (row) => (Number(row[key]) || 0) >= threshold;
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} filterId
 */
export function applyAdsCatalogFilter(rows, filterId) {
  if (!Array.isArray(rows)) return [];
  if (filterId === "all") return rows;

  if (filterId === "top_sales") {
    const test = rowPassesTopTier(rows, "salesCount", 0.4);
    return rows.filter((row) => test(row));
  }

  if (filterId === "top_profit") {
    const test = rowPassesTopTier(rows, "profit", 0.4);
    return rows.filter((row) => test(row));
  }

  if (filterId === "visit_volume") {
    const test = rowPassesTopTier(rows, "visitCount", 0.4);
    return rows.filter((row) => test(row));
  }

  return rows.filter((row) => {
    const status = String(row.statusKey || "");
    const mkt = String(row.marketplaceSlug || "");
    const flags = row.uiFlags && typeof row.uiFlags === "object" ? row.uiFlags : {};
    const marginPct = Number(row.marginPct);
    const profit = Number(row.profit);
    const sales = Number(row.salesCount) || 0;

    switch (filterId) {
      case "low_margin":
        return (
          Number.isFinite(marginPct) &&
          marginPct >= 0 &&
          marginPct < CATALOG_FILTER_LOW_MARGIN_MAX_PCT
        );
      case "loss":
        return (Number.isFinite(marginPct) && marginPct < 0) || (Number.isFinite(profit) && profit < 0);
      case "no_sales":
        return sales === 0;
      case "active":
        return status === "active";
      case "paused":
        return status === "paused";
      case "mercadolivre":
        return mkt === "mercadolivre";
      case "needs_attention":
        return Boolean(flags.needs_attention);
      case "declining":
        return Boolean(flags.declining);
      default:
        return true;
    }
  });
}

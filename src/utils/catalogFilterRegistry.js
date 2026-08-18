// ======================================================================
// SUSE7 — Filtros inteligentes do catálogo (3 fases)
// Fase 1: ativa. Fases 2 e 3: definidas aqui para evolução sem retrabalho estrutural.
// Lógica de filtro/ordenação: applyCatalogFilters.js
// UI: ícones via chaves em iconsMap (catalog_filter_*), tons semânticos em Products.css
// ======================================================================

import { applyCatalogFilter, buildCatalogRowContext, CATALOG_FILTER_LOW_MARGIN_MAX_PCT } from "./applyCatalogFilters.js";

export { applyCatalogFilter, buildCatalogRowContext, CATALOG_FILTER_LOW_MARGIN_MAX_PCT };

/** Chips por marketplace na barra (ids `mkt_*`); definições seguem no registry para reativar depois. */
export const SHOW_CATALOG_MARKETPLACE_FILTER_CHIPS = false;

/**
 * Ordem fixa na UI (uma linha com wrap; “Limpar filtros” é botão separado no JSX).
 */
export const CATALOG_FILTER_TOOLBAR_LINE1_IDS = [
  "top_sales",
  "top_profit",
  "low_margin",
  "loss",
  "no_sales",
];

export const CATALOG_FILTER_TOOLBAR_LINE2_IDS = [
  "needs_attention",
  "opportunity",
  "declining",
  "new_no_history",
];

export const CATALOG_FILTER_TOOLBAR_ORDER = [
  ...CATALOG_FILTER_TOOLBAR_LINE1_IDS,
  ...CATALOG_FILTER_TOOLBAR_LINE2_IDS,
];

/**
 * @typedef {(
 *   'neutral' | 'danger' | 'warning' | 'fire' | 'success' | 'slate' | 'mkp' | 'insight' | 'decline'
 * )} CatalogFilterIconTone
 */

/** Definição de chip para UI e documentação (ids estáveis para URL/query futura). */
export const CATALOG_FILTER_DEFINITIONS = [
  // —— Fase 1 ——
  {
    id: "all",
    phase: 1,
    label: "Todos",
    icon: "catalog_filter_all",
    iconTone: "neutral",
    enabled: true,
    description: "Remove filtros e ordenação da listagem.",
  },
  {
    id: "loss",
    phase: 1,
    label: "Prejuízo",
    icon: "catalog_filter_loss",
    iconTone: "danger",
    enabled: true,
    description: "Margem < 0 (requer margem calculada ou vinda da API).",
  },
  {
    id: "low_margin",
    phase: 1,
    label: "Margem baixa",
    icon: "catalog_filter_low_margin",
    iconTone: "warning",
    enabled: true,
    description: "Margem entre 0% e o limite configurável (padrão 10%).",
  },
  {
    id: "top_sales",
    phase: 1,
    label: "Mais vendidos",
    icon: "catalog_filter_top_sales",
    iconTone: "fire",
    enabled: true,
    description: "Ordena por quantidade de vendas (maior primeiro).",
  },
  {
    id: "top_profit",
    phase: 1,
    label: "Mais lucrativos",
    icon: "catalog_filter_top_profit",
    iconTone: "success",
    enabled: true,
    description: "Ordena por lucro bruto (maior primeiro).",
  },
  {
    id: "no_sales",
    phase: 1,
    label: "Sem vendas",
    icon: "catalog_filter_no_sales",
    iconTone: "slate",
    enabled: true,
    description: "Vendas = 0.",
  },
  // —— Fase 2 — operacional (ativar quando dados estiverem consolidados) ——
  {
    id: "low_stock",
    phase: 2,
    label: "Estoque baixo",
    icon: "catalog_filter_low_stock",
    iconTone: "warning",
    enabled: false,
    description: "Abaixo do estoque mínimo ou política futura (min_stock no produto).",
  },
  {
    id: "no_ads",
    phase: 2,
    label: "Sem anúncios",
    icon: "catalog_filter_no_ads",
    iconTone: "slate",
    enabled: false,
    description: "Anúncios vinculados = 0.",
  },
  {
    id: "mkt_ml",
    phase: 2,
    label: "Mercado Livre",
    icon: "catalog_filter_mkt",
    iconTone: "mkp",
    enabled: false,
    description: "Produtos com vínculo ao marketplace ML.",
  },
  {
    id: "mkt_shopee",
    phase: 2,
    label: "Shopee",
    icon: "catalog_filter_mkt",
    iconTone: "mkp",
    enabled: false,
    description: "Produtos com vínculo à Shopee.",
  },
  {
    id: "mkt_amazon",
    phase: 2,
    label: "Amazon",
    icon: "catalog_filter_mkt",
    iconTone: "mkp",
    enabled: false,
    description: "Produtos com vínculo à Amazon.",
  },
  {
    id: "mkt_shein",
    phase: 2,
    label: "Shein",
    icon: "catalog_filter_mkt",
    iconTone: "mkp",
    enabled: false,
    description: "Produtos com vínculo à Shein.",
  },
  {
    id: "mkt_magalu",
    phase: 2,
    label: "Magalu",
    icon: "catalog_filter_mkt",
    iconTone: "mkp",
    enabled: false,
    description: "Produtos com vínculo ao Magalu.",
  },
  {
    id: "with_ads",
    phase: 2,
    label: "Com anúncios",
    icon: "catalog_filter_with_ads",
    iconTone: "neutral",
    enabled: false,
    description: "Anúncios vinculados > 0.",
  },
  {
    id: "with_sales",
    phase: 2,
    label: "Com vendas",
    icon: "catalog_filter_with_sales",
    iconTone: "neutral",
    enabled: false,
    description: "Vendas > 0.",
  },
  // —— Fase 3 — inteligência de negócio (predicados compostos / séries temporais) ——
  {
    id: "needs_attention",
    phase: 3,
    label: "Precisam atenção",
    icon: "catalog_filter_attention",
    iconTone: "warning",
    enabled: true,
    description: "Combina margem, estoque, vendas e tendência (evoluir com backend).",
  },
  {
    id: "opportunity",
    phase: 3,
    label: "Oportunidade",
    icon: "catalog_filter_opportunity",
    iconTone: "insight",
    enabled: true,
    description: "Alta margem e baixa venda (limiares configuráveis no futuro).",
  },
  {
    id: "declining",
    phase: 3,
    label: "Em queda",
    icon: "catalog_filter_declining",
    iconTone: "decline",
    enabled: true,
    description: "Perda de desempenho no período (requer histórico).",
  },
  {
    id: "new_no_history",
    phase: 3,
    label: "Novos sem histórico",
    icon: "catalog_filter_new",
    iconTone: "slate",
    enabled: true,
    description: "Produto recente sem vendas relevantes (janela a definir).",
  },
];

function pickToolbarChips(ids) {
  const byId = new Map(CATALOG_FILTER_DEFINITIONS.map((d) => [d.id, d]));
  const list = ids.map((id) => byId.get(id)).filter(Boolean);
  if (SHOW_CATALOG_MARKETPLACE_FILTER_CHIPS) return list;
  return list.filter((d) => !String(d.id).startsWith("mkt_"));
}

/**
 * Duas linhas (legado / testes); a página de Produtos usa {@link getCatalogFilterChipsForToolbar}.
 * @returns {{ line1: typeof CATALOG_FILTER_DEFINITIONS, line2: typeof CATALOG_FILTER_DEFINITIONS }}
 */
export function getCatalogFilterToolbarLines() {
  return {
    line1: pickToolbarChips(CATALOG_FILTER_TOOLBAR_LINE1_IDS),
    line2: pickToolbarChips(CATALOG_FILTER_TOOLBAR_LINE2_IDS),
  };
}

/**
 * Lista plana (mesma ordem que LINE1 + LINE2); desabilitados quando enabled === false.
 * @returns {typeof CATALOG_FILTER_DEFINITIONS}
 */
export function getCatalogFilterChipsForToolbar() {
  return pickToolbarChips(CATALOG_FILTER_TOOLBAR_ORDER);
}

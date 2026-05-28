// ======================================================================
// Constantes dos filtros da página Vendas — multi-marketplace ready.
// ======================================================================

/** @typedef {{ id: string; label: string; enabled: boolean; shortLabel?: string }} VendasMarketplaceOption */

/** @type {readonly VendasMarketplaceOption[]} */
export const VENDAS_MARKETPLACE_OPTIONS = [
  { id: "", label: "Todos", shortLabel: "Todos", enabled: true },
  { id: "mercado_livre", label: "Mercado Livre", shortLabel: "ML", enabled: true },
  { id: "shopee", label: "Shopee", shortLabel: "Shopee", enabled: false },
  { id: "amazon", label: "Amazon", shortLabel: "Amazon", enabled: false },
  { id: "shein", label: "Shein", shortLabel: "Shein", enabled: false },
];

/** Opções visíveis na UI (somente marketplaces liberados). */
export function getVendasMarketplaceOptionsForUi() {
  return VENDAS_MARKETPLACE_OPTIONS.filter((o) => o.enabled);
}

/** @type {readonly { id: import("./vendasFiltersPeriod.js").VendasPeriodPresetUi; label: string }[]} */
export const VENDAS_PERIOD_PRESETS = [
  { id: "today", label: "Hoje" },
  { id: "this_week", label: "Esta semana" },
  { id: "last_week", label: "Semana passada" },
  { id: "this_month", label: "Este mês" },
  { id: "last_month", label: "Mês passado" },
  { id: "custom", label: "Período customizado" },
];

export const VENDAS_FILTERS_EXPANDED_STORAGE_KEY = "s7:vendas:filters:expanded";

export const VENDAS_CALENDAR_WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

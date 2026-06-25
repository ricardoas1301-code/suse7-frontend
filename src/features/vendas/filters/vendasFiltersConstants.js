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

// ----------------------------------------------------------------------
// Filtros operacionais (P_2.2) — apenas UX/UI + estado local.
// Sem integração de backend nesta fase; estrutura pronta para conexão futura.
// ----------------------------------------------------------------------

/** @typedef {{ id: string; label: string }} VendasOperacionalFilterOption */

/** @type {readonly VendasOperacionalFilterOption[]} */
export const VENDAS_STATUS_VENDA_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "a_enviar", label: "A enviar" },
  { id: "em_transito", label: "Em trânsito" },
  { id: "entregue", label: "Entregue" },
  { id: "cancelada", label: "Cancelada" },
  { id: "devolvida", label: "Devolvida" },
];

/** @type {readonly VendasOperacionalFilterOption[]} */
export const VENDAS_TIPO_ENTREGA_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "full", label: "Full" },
  { id: "flex", label: "Flex" },
  { id: "padrao", label: "Padrão" },
  { id: "a_combinar", label: "A combinar" },
];

/** @type {readonly VendasOperacionalFilterOption[]} */
export const VENDAS_ORIGEM_VENDA_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "organica", label: "Orgânica" },
  { id: "publicidade", label: "Publicidade" },
  { id: "promocao", label: "Promoção" },
  { id: "afiliado", label: "Afiliado" },
];

/** @type {readonly { id: import("./vendasFiltersPeriod.js").VendasPeriodPresetUi; label: string }[]} */
export const VENDAS_PERIOD_PRESETS = [
  { id: "last_30_days", label: "Últimos 30 dias" },
  { id: "today", label: "Hoje" },
  { id: "this_week", label: "Esta semana" },
  { id: "last_week", label: "Semana passada" },
  { id: "this_month", label: "Este mês" },
  { id: "last_month", label: "Mês passado" },
  { id: "custom", label: "Período customizado" },
];

export const VENDAS_FILTERS_EXPANDED_STORAGE_KEY = "s7:vendas:filters:expanded";

/** Sessão separada — card recolhido por padrão no Dashboard. */
export const DASHBOARD_FILTERS_EXPANDED_STORAGE_KEY = "s7:dashboard:filters:expanded";

export const VENDAS_CALENDAR_WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

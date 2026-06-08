// ======================================================================
// Chips de filtro da página Vendas — ids alinhados ao query param `filter` da API.
// Ícones alinhados ao padrão da listagem de Precificações / Anúncios (`adsFilterRegistry`).
// ======================================================================

/**
 * @type {{ id: string; label: string; icon: string; iconTone: string }[]}
 */
export const SALES_FILTER_CHIPS = [
  { id: "all", label: "Todos", icon: "catalog_filter_all", iconTone: "neutral" },
  { id: "profit_high", label: "Mais lucrativos", icon: "catalog_filter_top_profit", iconTone: "success" },
  { id: "margin_low", label: "Margem crítica", icon: "catalog_filter_low_margin", iconTone: "warning" },
  { id: "loss", label: "Prejuízo", icon: "catalog_filter_loss", iconTone: "danger" },
  { id: "no_profit", label: "Sem lucro", icon: "catalog_filter_no_sales", iconTone: "slate" },
  { id: "ticket_high", label: "Ticket alto", icon: "catalog_filter_top_sales", iconTone: "fire" },
  { id: "ticket_low", label: "Ticket baixo", icon: "catalog_filter_no_sales", iconTone: "slate" },
  { id: "needs_attention", label: "Precisam atenção", icon: "catalog_filter_attention", iconTone: "warning" },
];

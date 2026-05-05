// ======================================================================
// Chips de filtro da página Vendas — ids alinhados ao query param `filter` da API.
// ======================================================================

/** @type {{ id: string; label: string }[]} */
export const SALES_FILTER_CHIPS = [
  { id: "all", label: "Todos" },
  { id: "profit_high", label: "Mais lucrativos" },
  { id: "margin_low", label: "Margem baixa" },
  { id: "loss", label: "Prejuízo" },
  { id: "no_profit", label: "Sem lucro" },
  { id: "ticket_high", label: "Ticket alto" },
  { id: "ticket_low", label: "Ticket baixo" },
  { id: "needs_attention", label: "Precisam atenção" },
];

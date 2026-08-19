// ======================================================================
// Ordem canônica das colunas das listas SUSE7 (contrato visual — DEV Local).
// Usado por regression guards; header e body devem seguir a mesma sequência.
// Coluna IMG/thumb: sem rótulo visível no cabeçalho.
// ======================================================================

/** @type {readonly string[]} */
export const VENDAS_LIST_COLUMNS = [
  "select",
  "sale-no",
  "thumb",
  "listing",
  "account",
  "channel",
  "price",
  "commission",
  "shipping",
  "payout",
  "cost",
  "tax",
  "profit-brl",
  "profit-percent",
  "status",
];

/** @type {readonly string[]} */
export const VENDAS_LIST_HEADER_LABELS = [
  "Nº Venda",
  "Anúncio",
  "Loja",
  "Canal",
  "Preço",
  "Comissão",
  "Frete",
  "Repasse",
  "Custo",
  "Imposto",
  "Lucro R$",
  "Lucro (%)",
  "Status",
];

/** @type {readonly string[]} */
export const PRECIFICACOES_LIST_COLUMNS = [
  "select",
  "thumb",
  "listing",
  "listing-type",
  "account",
  "channel",
  "sales",
  "current-price",
  "commission",
  "shipping",
  "payout",
  "cost",
  "tax",
  "profit-brl",
  "profit-percent",
  "competitors",
];

/** @type {readonly string[]} */
export const PRECIFICACOES_LIST_HEADER_LABELS = [
  "Anúncio",
  "Tipo anúncio",
  "Loja",
  "Canal",
  "Vendas",
  "Preço",
  "Comissão",
  "Frete",
  "Repasse",
  "Custo",
  "Imposto",
  "Lucro R$",
  "Lucro (%)",
  "Concorrentes",
];

/** @type {readonly string[]} */
export const ANUNCIOS_LIST_COLUMNS = [
  "select",
  "thumb",
  "listing",
  "listing-type",
  "account",
  "channel",
  "sales",
  "sale-price",
  "revenue",
  "payout",
  "avg-ticket",
  "profit-brl",
  "profit-percent",
  "quality",
];

/** @type {readonly string[]} */
export const ANUNCIOS_LIST_HEADER_LABELS = [
  "Anúncio",
  "Tipo anúncio",
  "Loja",
  "Canal",
  "Vendas",
  "Preço",
  "Faturamento",
  "Repasse",
  "Ticket Médio",
  "Lucro (R$)",
  "Lucro (%)",
  "Qualidade",
];

/** @type {readonly string[]} */
export const PRODUTOS_LIST_COLUMNS = [
  "select",
  "thumb",
  "product",
  "listings",
  "sales",
  "revenue",
  "payout",
  "avg-ticket",
  "profit-brl",
  "profit-percent",
  "stock",
];

/** @type {readonly string[]} */
export const PRODUTOS_LIST_HEADER_LABELS = [
  "Produto",
  "Anúncios",
  "Vendas",
  "Faturamento",
  "Repasse",
  "Ticket Médio",
  "Lucro (R$)",
  "Lucro (%)",
  "Estoque",
];

/** @type {readonly string[]} */
export const CONCORRENCIA_LIST_COLUMNS = [
  "select",
  "thumb",
  "listing",
  "account",
  "channel",
  "competitor-1",
  "competitor-2",
  "competitor-3",
  "competitor-4",
  "competitor-5",
  "competitor-6",
];

/** @type {readonly string[]} */
export const CONCORRENCIA_LIST_HEADER_LABELS = [
  "Anúncio",
  "Loja",
  "Canal",
  "Concorrente 1",
  "Concorrente 2",
  "Concorrente 3",
  "Concorrente 4",
  "Concorrente 5",
  "Concorrente 6",
];

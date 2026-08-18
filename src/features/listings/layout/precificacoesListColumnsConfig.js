// ======================================================================
// Configuração declarativa — colunas visíveis da lista Precificações (vista minimal).
// ======================================================================

import { PRECIFICACOES_COL } from "./precificacoesCatalogColumns.js";

/** @typedef {{ id: string; label: string; visible: boolean }} PrecificacoesListColumnDef */

/** Ordem oficial das colunas renderizadas em /precificacoes (vista minimal). */
export const PRECIFICACOES_LIST_MINIMAL_COLUMN_ORDER = [
  PRECIFICACOES_COL.select,
  PRECIFICACOES_COL.cover,
  PRECIFICACOES_COL.listing,
  PRECIFICACOES_COL.listingType,
  PRECIFICACOES_COL.account,
  PRECIFICACOES_COL.channel,
  PRECIFICACOES_COL.sales,
  PRECIFICACOES_COL.profitBrl,
  PRECIFICACOES_COL.profitPercent,
  PRECIFICACOES_COL.currentPrice,
  PRECIFICACOES_COL.commission,
  PRECIFICACOES_COL.shipping,
  PRECIFICACOES_COL.payout,
  PRECIFICACOES_COL.cost,
  PRECIFICACOES_COL.tax,
  PRECIFICACOES_COL.competitors,
];

/** Colunas removidas apenas da camada visual (dados permanecem no row). */
export const PRECIFICACOES_LIST_HIDDEN_COLUMN_IDS = [PRECIFICACOES_COL.promotions];

/** @type {readonly PrecificacoesListColumnDef[]} */
export const PRECIFICACOES_LIST_MINIMAL_COLUMNS = [
  { id: PRECIFICACOES_COL.select, label: "Seleção", visible: true },
  { id: PRECIFICACOES_COL.cover, label: "Capa", visible: true },
  { id: PRECIFICACOES_COL.listing, label: "Anúncio", visible: true },
  { id: PRECIFICACOES_COL.listingType, label: "Tipo anúncio", visible: true },
  { id: PRECIFICACOES_COL.account, label: "Loja", visible: true },
  { id: PRECIFICACOES_COL.channel, label: "Canal", visible: true },
  { id: PRECIFICACOES_COL.sales, label: "Vendas", visible: true },
  { id: PRECIFICACOES_COL.profitBrl, label: "Lucro R$", visible: true },
  { id: PRECIFICACOES_COL.profitPercent, label: "Lucro %", visible: true },
  { id: PRECIFICACOES_COL.currentPrice, label: "Preço atual", visible: true },
  { id: PRECIFICACOES_COL.commission, label: "Comissão", visible: true },
  { id: PRECIFICACOES_COL.shipping, label: "Frete", visible: true },
  { id: PRECIFICACOES_COL.payout, label: "Repasse", visible: true },
  { id: PRECIFICACOES_COL.cost, label: "Custo", visible: true },
  { id: PRECIFICACOES_COL.tax, label: "Imposto", visible: true },
  { id: PRECIFICACOES_COL.competitors, label: "Concorrentes", visible: true },
  { id: PRECIFICACOES_COL.promotions, label: "Promoções", visible: false },
];

// ======================================================================
// Concorrência — opções visuais do card Busca e filtros
// ======================================================================

export const CONCORRENCIA_FILTERS_EXPANDED_SESSION_KEY = "s7-concorrencia-filters-expanded";

/** Limite funcional de concorrentes monitorados por produto (somente UI). */
export const CONCORRENCIA_LIMITE_CONCORRENTES = 6;

/**
 * Marketplaces preparados na UI. Somente Mercado Livre operacional nesta fase.
 * @type {readonly { id: string; label: string; enabled: boolean }[]}
 */
export const CONCORRENCIA_MARKETPLACE_OPTIONS = [
  { id: "", label: "Todos", enabled: true },
  { id: "mercado_livre", label: "Mercado Livre", enabled: true },
  { id: "shopee", label: "Shopee", enabled: false },
  { id: "amazon", label: "Amazon", enabled: false },
  { id: "shein", label: "Shein", enabled: false },
  { id: "magalu", label: "Magalu", enabled: false },
];

/** @param {Record<string, unknown> | null | undefined} account */
export function rotuloContaMercadoLivre(account) {
  if (!account || typeof account !== "object") return "Conta";
  if (account.ml_nickname != null && String(account.ml_nickname).trim() !== "") {
    return String(account.ml_nickname).trim();
  }
  if (account.account_alias != null && String(account.account_alias).trim() !== "") {
    return String(account.account_alias).trim();
  }
  if (account.external_seller_id != null) return String(account.external_seller_id);
  return "Conta";
}

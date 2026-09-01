// ======================================================================
// Identidade da loja (SSOT seller_companies) — reutilizável multiconta
// ======================================================================

import { formatMarketplaceCompanyCnpj } from "../../../components/Profile/marketplaceIntegration/marketplaceIntegrationFormat.js";

/**
 * @param {Record<string, unknown> | null | undefined} task
 * @returns {{
 *   storeName: string | null;
 *   documentFormatted: string | null;
 *   logoUrl: string | null;
 *   fallbackInitial: string;
 *   hasStoreIdentity: boolean;
 * }}
 */
export function resolverIdentidadeLojaDaTaskOperacional(task) {
  if (!task || typeof task !== "object") {
    return {
      storeName: null,
      documentFormatted: null,
      logoUrl: null,
      fallbackInitial: "L",
      hasStoreIdentity: false,
    };
  }

  const storeNameRaw =
    (typeof task.store_name === "string" && task.store_name.trim()) ||
    (typeof task.account_label === "string" && task.account_label.trim()) ||
    "";
  const storeName = storeNameRaw || null;

  const logoUrlRaw =
    (typeof task.store_logo_url === "string" && task.store_logo_url.trim()) ||
    (typeof task.account_avatar_url === "string" && task.account_avatar_url.trim()) ||
    "";
  const logoUrl = logoUrlRaw || null;

  const docRaw =
    task.store_document_cnpj != null
      ? String(task.store_document_cnpj)
      : task.store_document_cnpj_formatted != null
        ? String(task.store_document_cnpj_formatted)
        : "";
  const documentFormatted =
    formatMarketplaceCompanyCnpj(docRaw) ||
    (docRaw.includes("/") || docRaw.includes(".") ? docRaw.trim() : null) ||
    null;

  const fallbackInitial = (storeName || "L").charAt(0).toUpperCase() || "L";

  return {
    storeName,
    documentFormatted,
    logoUrl,
    fallbackInitial,
    hasStoreIdentity: Boolean(storeName || documentFormatted || logoUrl),
  };
}

/**
 * Título canônico = AÇÃO + MARKETPLACE (remove sufixo " — nickname/loja" legado).
 * @param {string | null | undefined} title
 * @param {string | null | undefined} taskType
 */
export function normalizarTituloPendenciaMarketplace(title, taskType) {
  const raw = typeof title === "string" ? title.trim() : "";
  const type = String(taskType || "");

  if (type === "marketplace_connect_pending") {
    return "Conectar Mercado Livre";
  }
  if (type === "ml_initial_sync_pending") {
    if (/^Reconectar/i.test(raw)) return "Reconectar Mercado Livre";
    return "Sincronizar Mercado Livre";
  }
  if (type === "ml_initial_sync_in_progress") {
    return "Sincronizando Mercado Livre";
  }

  // Defesa: remove " — sufixo" em títulos marketplace legados.
  if (raw.includes(" — ")) {
    return raw.split(" — ")[0].trim() || raw;
  }
  return raw || "Tarefa";
}

/**
 * Nickname/alias da conta NÃO deve ser a identidade principal da loja.
 * @param {{
 *   storeName?: string | null;
 *   mlNickname?: string | null;
 *   accountAlias?: string | null;
 * }} params
 */
export function identidadeLojaNaoUsaNicknameComoPrimario({
  storeName = null,
  mlNickname = null,
  accountAlias = null,
} = {}) {
  const store = storeName != null ? String(storeName).trim() : "";
  const nick = mlNickname != null ? String(mlNickname).trim() : "";
  const alias = accountAlias != null ? String(accountAlias).trim() : "";
  if (!store) return true;
  if (nick && store === nick && alias && store === alias) return false;
  if (nick && store === nick) return false;
  if (alias && store === alias && nick && alias !== nick) {
    // alias igual store mas diferente de nick — pode ser coincidência de trade name
    return true;
  }
  return store !== nick && (alias ? store !== alias || Boolean(nick && alias !== nick) : true);
}

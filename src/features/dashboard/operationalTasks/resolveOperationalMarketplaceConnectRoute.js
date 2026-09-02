// ======================================================================
// Resolução de rota para open_marketplace_connect (Central de Pendências).
// Reconexão account-aware → /ml/connect?seller_company_id=…
// Conexão inicial sem conta → página de Integrações.
// ======================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ROTA_INTEGRACOES_MERCADO_LIVRE = "/perfil/integracoes/mercado-livre";

/**
 * Rota SPA /ml/connect — espelha montarUrlRotaMlConnectFrontend (sem puxar api/auth).
 * @param {{ sellerCompanyId: string; intent?: string }} params
 */
function montarRotaSpaMlConnect(params) {
  const sellerCompanyId = String(params?.sellerCompanyId ?? "").trim();
  if (!sellerCompanyId || !UUID_REGEX.test(sellerCompanyId)) return null;
  const qs = new URLSearchParams();
  qs.set("seller_company_id", sellerCompanyId);
  const intent = String(params?.intent ?? "").trim();
  if (intent) qs.set("intent", intent);
  return `/ml/connect?${qs.toString()}`;
}

/**
 * @typedef {{
 *   kind: "oauth_reconnect" | "integrations_page" | "missing_seller_company";
 *   path: string | null;
 *   seller_company_id: string | null;
 *   marketplace_account_id: string | null;
 * }} MarketplaceConnectRouteResolution
 */

/**
 * Resolve a navegação do CTA Conectar/Reconectar a partir do contrato da task.
 * Não inicia OAuth nem muta token — apenas decide a rota SPA.
 *
 * @param {Record<string, unknown> | null | undefined} task
 * @returns {MarketplaceConnectRouteResolution}
 */
export function resolveOperationalMarketplaceConnectRoute(task) {
  const marketplaceAccountId =
    task?.marketplace_account_id != null && String(task.marketplace_account_id).trim() !== ""
      ? String(task.marketplace_account_id).trim()
      : null;

  const sellerCompanyId =
    task?.seller_company_id != null && String(task.seller_company_id).trim() !== ""
      ? String(task.seller_company_id).trim()
      : null;

  // Pendência account-aware (Reconectar / conta específica): OAuth da empresa canônica.
  if (marketplaceAccountId) {
    if (!sellerCompanyId) {
      return {
        kind: "missing_seller_company",
        path: null,
        seller_company_id: null,
        marketplace_account_id: marketplaceAccountId,
      };
    }
    const path = montarRotaSpaMlConnect({
      sellerCompanyId,
      intent: "reconnect",
    });
    if (!path) {
      return {
        kind: "missing_seller_company",
        path: null,
        seller_company_id: sellerCompanyId,
        marketplace_account_id: marketplaceAccountId,
      };
    }
    return {
      kind: "oauth_reconnect",
      path,
      seller_company_id: sellerCompanyId,
      marketplace_account_id: marketplaceAccountId,
    };
  }

  // Sem conta ML: seller escolhe/conecta pela página de Integrações.
  return {
    kind: "integrations_page",
    path: ROTA_INTEGRACOES_MERCADO_LIVRE,
    seller_company_id: null,
    marketplace_account_id: null,
  };
}

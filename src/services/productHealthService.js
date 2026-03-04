// ======================================================================
// SUSE7 — Product Health Service
// Consumo do endpoint de saúde do produto (backend como fonte de verdade)
// ======================================================================

import { API_BASE_URL, buildApiUrl, apiFetch } from "../config/api";

function fallbackData(productId) {
  return {
    productId,
    status: "not_found",
    readyToPublish: false,
    blocking: [],
    warnings: [],
    meta: {},
  };
}

/**
 * Busca relatório de saúde do produto.
 *
 * @param {string} productId - UUID do produto
 * @returns {Promise<{ ok: boolean; data?: object; error?: string }>}
 */
export async function getProductHealth(productId) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  const url = buildApiUrl("/api/products/health");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams({ product_id: productId });
  const fullUrl = `${url}?${params}`;

  try {
    const result = await apiFetch(fullUrl, { method: "GET" });

    if (result.ok && result.data != null) {
      return { ok: true, data: result.data };
    }

    if (!result.ok) {
      if (import.meta.env.DEV && result.status === 404) {
        return { ok: true, data: fallbackData(productId) };
      }
      const msg = result.status === 401
        ? "Sessão expirada. Faça login novamente."
        : (result.error ?? `Erro ${result.status ?? 500}`);
      return { ok: false, error: msg };
    }

    return { ok: true, data: result.data };
  } catch (err) {
    console.error("[productHealthService] getProductHealth:", err);
    if (import.meta.env.DEV) {
      return { ok: true, data: fallbackData(productId) };
    }
    return { ok: false, error: err?.message ?? "Erro ao buscar saúde do produto" };
  }
}

// ======================================================================
// SUSE7 — Product Health Service
// Consumo do endpoint de saúde do produto (backend como fonte de verdade)
// ======================================================================

import { API_BASE_URL, buildApiUrl, getSessionToken } from "../config/api";

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

  const token = await getSessionToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildApiUrl("/api/products/health");
  if (!url) return { ok: false, error: "URL da API inválida" };

  const params = new URLSearchParams({ product_id: productId });
  const fullUrl = `${url}?${params}`;

  try {
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (import.meta.env.DEV && res.status === 404) {
        return {
          ok: true,
          data: {
            productId,
            status: "not_found",
            readyToPublish: false,
            blocking: [],
            warnings: [],
            meta: {},
          },
        };
      }
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("[productHealthService] getProductHealth:", err);
    if (import.meta.env.DEV) {
      return {
        ok: true,
        data: {
          productId,
          status: "not_found",
          readyToPublish: false,
          blocking: [],
          warnings: [],
          meta: {},
        },
      };
    }
    return { ok: false, error: err?.message ?? "Erro ao buscar saúde do produto" };
  }
}

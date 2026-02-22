// ======================================================================
// SUSE7 — Product Health Service
// Consumo do endpoint de saúde do produto (backend como fonte de verdade)
// ======================================================================

import { supabase } from "../supabaseClient";
import { API_BASE_URL } from "../config/api";

function buildUrl(path) {
  if (!API_BASE_URL) return null;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = base.endsWith("/api") ? path.replace(/^\/api/, "") : path;
  return `${base}${suffix}`;
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
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

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/products/health");
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
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      return { ok: false, error: msg };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("[productHealthService] getProductHealth:", err);
    return { ok: false, error: err?.message ?? "Erro ao buscar saúde do produto" };
  }
}

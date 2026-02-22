// ======================================================================
// SUSE7 — Product Status Service
// Alteração de status do produto (backend como fonte de verdade)
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
 * Altera o status do produto.
 *
 * @param {string} productId - UUID do produto
 * @param {string} status - Novo status (ex: "ready")
 * @returns {Promise<{ ok: boolean; data?: object; error?: string; code?: string; details?: object }>}
 */
export async function changeStatus(productId, status) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }

  const token = await getToken();
  if (!token) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const url = buildUrl("/api/products/change-status");
  if (!url) return { ok: false, error: "URL da API inválida" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId, status }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
      const code = data?.code ?? null;
      const details = data?.details ?? null;
      return { ok: false, error: msg, code, details };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("[productStatusService] changeStatus:", err);
    return { ok: false, error: err?.message ?? "Erro ao alterar status do produto" };
  }
}

// ======================================================================
// SUSE7 — Product Repository
// Chamadas à API de produtos (upsert). Validação SKU no backend.
// ======================================================================

import { supabase } from "../../supabaseClient";
import { API_BASE_URL } from "../../config/api";

/**
 * Cria ou atualiza produto via API.
 * Em 409 (SKU duplicado, formato bloqueado): retorna { error } para o ProductForm exibir.
 *
 * @param {{ product: object; mode: "create"|"edit"; draftKey?: string; variants?: object[] }} payload
 * @returns {Promise<{ productId?: string; error?: string }>}
 */
export async function upsertProduct({ product, mode, draftKey, variants }) {
  if (!API_BASE_URL) {
    return { error: "API não configurada (VITE_API_BASE_URL)" };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const base = API_BASE_URL.replace(/\/+$/, "");
  const path = base.endsWith("/api") ? "/products/upsert" : "/api/products/upsert";
  const url = `${base}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      product,
      mode: mode || "create",
      draftKey: draftKey ?? null,
      variants: Array.isArray(variants) ? variants : [],
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let msg = data?.message ?? data?.error ?? `Erro ${res.status}`;
    if (data?.details && typeof data.details === "string") {
      msg += ` — ${data.details}`;
    }
    return { error: msg };
  }

  return { productId: data?.productId ?? product?.id ?? null };
}

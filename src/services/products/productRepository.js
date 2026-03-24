// ======================================================================
// SUSE7 — Product Repository
// Chamadas à API de produtos (upsert). Validação SKU no backend.
// Leitura para edição: Supabase (RLS) + variantes ordenadas.
// ======================================================================

import { supabase } from "../../supabaseClient";
import { API_BASE_URL } from "../../config/api";
import { listVariants } from "../variants/variantRepository";

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
  if (!product || typeof product !== "object") {
    return { error: "Dados do produto são obrigatórios." };
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

/**
 * Carrega produto + variações para a tela de edição (fonte: Supabase).
 *
 * @param {string} productId
 * @returns {Promise<{ error: string | null; product: object | null; variants: object[] }>}
 */
export async function fetchProductForEdit(productId) {
  if (!productId || String(productId).trim() === "") {
    return { error: "ID do produto inválido.", product: null, variants: [] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Faça login novamente.", product: null, variants: [] };
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { error: error.message || "Erro ao carregar produto.", product: null, variants: [] };
  }
  if (!product) {
    return { error: "Produto não encontrado ou sem permissão.", product: null, variants: [] };
  }

  const variants = await listVariants(productId);
  return { error: null, product, variants };
}

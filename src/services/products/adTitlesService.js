// ======================================================================
// SUSE7 — Ad Titles Service
// API /api/products/ad-titles — CRUD de títulos de anúncios
// Estrutura escalável para múltiplos marketplaces (Strategy/Adapter no backend)
// ======================================================================

import { supabase } from "../../supabaseClient";
import { API_BASE_URL } from "../../config/api";

function buildUrl(path) {
  if (!API_BASE_URL) return null;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = base.endsWith("/api") ? path.replace(/^\/api/, "") : path;
  return `${base}${suffix}`;
}

/**
 * Lista títulos de anúncio do produto.
 * @param {string} productId
 * @returns {Promise<{ titles?: object[]; error?: string }>}
 */
export async function listAdTitles(productId) {
  if (!productId) return { error: "product_id é obrigatório" };

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "Sessão expirada. Faça login novamente." };

  const url = buildUrl("/api/products/ad-titles");
  if (!url) return { error: "API não configurada (VITE_API_BASE_URL)" };

  const res = await fetch(`${url}?product_id=${encodeURIComponent(productId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { error: data?.message ?? data?.error ?? `Erro ${res.status}` };
  }

  return { titles: data?.titles ?? [] };
}

/**
 * Cria título de anúncio.
 * @param {{ product_id: string; title: string }}
 * @returns {Promise<{ title?: object; error?: string }>}
 */
export async function createAdTitle({ product_id, title }) {
  if (!product_id || !title?.trim()) return { error: "product_id e title são obrigatórios" };

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "Sessão expirada. Faça login novamente." };

  const url = buildUrl("/api/products/ad-titles");
  if (!url) return { error: "API não configurada (VITE_API_BASE_URL)" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id, title: title.trim() }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { error: data?.message ?? data?.error ?? `Erro ${res.status}` };
  }

  return { title: data?.title ?? null };
}

/**
 * Atualiza título (texto ou is_active).
 * @param {{ id: string; title?: string; is_active?: boolean }}
 * @returns {Promise<{ title?: object; error?: string }>}
 */
export async function updateAdTitle({ id, title, is_active }) {
  if (!id) return { error: "id é obrigatório" };
  if (title === undefined && is_active === undefined) {
    return { error: "Informe title ou is_active para atualizar" };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "Sessão expirada. Faça login novamente." };

  const url = buildUrl("/api/products/ad-titles");
  if (!url) return { error: "API não configurada (VITE_API_BASE_URL)" };

  const body = { id };
  if (title !== undefined) body.title = title;
  if (is_active !== undefined) body.is_active = is_active;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { error: data?.message ?? data?.error ?? `Erro ${res.status}` };
  }

  return { title: data?.title ?? null };
}

/**
 * Remove título de anúncio.
 * @param {string} id
 * @returns {Promise<{ error?: string }>}
 */
export async function deleteAdTitle(id) {
  if (!id) return { error: "id é obrigatório" };

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "Sessão expirada. Faça login novamente." };

  const url = buildUrl("/api/products/ad-titles");
  if (!url) return { error: "API não configurada (VITE_API_BASE_URL)" };

  const res = await fetch(`${url}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { error: data?.message ?? data?.error ?? `Erro ${res.status}` };
  }

  return {};
}

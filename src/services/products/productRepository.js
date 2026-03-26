// ======================================================================
// SUSE7 — Product Repository
// Chamadas à API de produtos (upsert). Validação SKU no backend.
// Leitura para edição: GET /api/products/for-edit (preferencial) ou Supabase (fallback).
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

  if (data && Object.prototype.hasOwnProperty.call(data, "ok") && data.ok !== true) {
    return { error: data?.message ?? "A API retornou sucesso HTTP sem confirmação de operação." };
  }

  return { productId: data?.productId ?? product?.id ?? null };
}

/**
 * Carrega produto + variações para a tela de edição.
 * 1) GET /api/products/for-edit (service role + filtro user_id) — evidência alinhada ao save.
 * 2) Fallback: Supabase direto (RLS).
 *
 * @param {string} productId
 * @returns {Promise<{
 *   error: string | null;
 *   product: object | null;
 *   variants: object[];
 *   variantsLoadError?: string | null;
 *   loadSource?: "api" | "supabase";
 * }>}
 */
export async function fetchProductForEdit(productId) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) {
    return { error: "ID do produto inválido.", product: null, variants: [], variantsLoadError: null };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const base = (API_BASE_URL || "").replace(/\/+$/, "");

  if (token && base) {
    try {
      const pathSeg = base.endsWith("/api") ? "/products/for-edit" : "/api/products/for-edit";
      const url = `${base}${pathSeg}?${new URLSearchParams({ id: pid }).toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok && body?.ok === true && body?.product) {
        const variants = Array.isArray(body.variants) ? body.variants : [];
        if (import.meta.env.DEV) {
          const v0 = variants[0];
          console.info("[fetchProductForEdit] via API", {
            productId: pid,
            variantCount: variants.length,
            firstVariant: v0
              ? {
                  id: v0.id,
                  product_id: v0.product_id,
                  user_id: v0.user_id,
                  sku: v0.sku,
                  stock_quantity: v0.stock_quantity,
                  cost_price: v0.cost_price,
                  attributes: v0.attributes,
                  attributesType: typeof v0.attributes,
                }
              : null,
          });
        }
        return {
          error: null,
          product: body.product,
          variants,
          variantsLoadError: null,
          loadSource: "api",
        };
      }

      if (import.meta.env.DEV) {
        console.warn("[fetchProductForEdit] API não OK, fallback Supabase", {
          status: res.status,
          code: body?.code,
          message: body?.message,
        });
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("[fetchProductForEdit] API rede/parse, fallback Supabase", e?.message || e);
      }
    }
  } else if (import.meta.env.DEV) {
    console.warn("[fetchProductForEdit] sem API_BASE_URL ou token — só Supabase");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Faça login novamente.", product: null, variants: [], variantsLoadError: null };
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", pid)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { error: error.message || "Erro ao carregar produto.", product: null, variants: [], variantsLoadError: null };
  }
  if (!product) {
    return { error: "Produto não encontrado ou sem permissão.", product: null, variants: [], variantsLoadError: null };
  }

  const { data: imageLinks } = await supabase
    .from("product_image_links")
    .select("storage_path, variant_key, sort_order, is_primary")
    .eq("product_id", pid)
    .eq("user_id", user.id);

  const productWithLinks = {
    ...product,
    product_image_links: imageLinks || [],
  };

  const { data: variants, error: vErr } = await listVariants(pid);

  if (import.meta.env.DEV) {
    console.info("[fetchProductForEdit] via Supabase (fallback)", {
      productId: pid,
      variantCount: variants.length,
      listError: vErr?.message ?? null,
      firstVariant: variants[0] ?? null,
    });
  }

  return {
    error: null,
    product: productWithLinks,
    variants,
    variantsLoadError: vErr?.message ?? null,
    loadSource: "supabase",
  };
}

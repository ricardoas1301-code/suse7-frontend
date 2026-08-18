// ============================================================
// S7 — Service de Concorrência (frontend)
// Alinhado ao backend base S1 (handlers/competition/index.js).
//
// Contrato oficial:
//  - O SKU localiza o PRODUTO interno do seller.
//  - A descoberta de concorrente usa nome/palavras-chave/título/
//    categoria/marca/GTIN/catálogo — nunca o SKU como chave de busca.
//  - Limite funcional: 6 concorrentes ativos por produto.
//
// Endpoints:
//  GET    /api/competition/products
//  GET    /api/competition/products/:productId/competitors
//  POST   /api/competition/products/:productId/competitors
//  DELETE /api/competition/competitors/:competitorId
//  POST   /api/competition/products/:productId/discover
//  POST   /api/competition/products/:productId/resolve-link
// ============================================================

import { API_BASE_URL, buildApiUrl, apiFetch } from "../config/api";

function ensureApiBase() {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }
  return null;
}

/** Lista produtos do usuário com contagem real e concorrentes compactos por produto. */
export async function listCompetitionProducts() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/competition/products");
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "GET", unauthorizedFallback: { products: [] } });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, products: result.data?.products ?? [] };
}

/** Lista concorrentes ativos de um produto (por product_id interno). */
export async function listProductCompetitors(productId) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/competitors`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "GET", unauthorizedFallback: { competitors: [] } });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    product: result.data?.product ?? null,
    competitors: result.data?.competitors ?? [],
    competitorsCount: result.data?.competitors_count ?? (result.data?.competitors?.length ?? 0),
  };
}

/**
 * Descobre concorrentes reais no Mercado Livre (stub-free).
 * A query usa nome/palavras-chave/título/marca/GTIN — nunca o SKU do seller.
 */
export async function discoverProductCompetitors(
  productId,
  { query, marketplace, limit, offset, excludeListingIds } = {}
) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/discover`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      query: query ?? "",
      marketplace: marketplace ?? "mercado_livre",
      limit: limit ?? 24,
      offset: Number.isFinite(Number(offset)) ? Math.max(0, Math.trunc(Number(offset))) : 0,
      exclude_listing_ids: Array.isArray(excludeListingIds) ? excludeListingIds : [],
    },
  });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    strategy: result.data?.strategy ?? null,
    total: result.data?.total ?? (result.data?.results?.length ?? 0),
    results: result.data?.results ?? [],
    warning: result.data?.warning ?? null,
    debug: result.data?.debug ?? null,
    paging: result.data?.paging ?? null,
  };
}

/**
 * Resolve link de anúncio ML → candidato normalizado (preview antes do cadastro).
 */
export async function resolveCompetitorLink(productId, url) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const urlApi = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/resolve-link`);
  if (!urlApi) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(urlApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { url: url ?? "" },
  });
  if (!result.ok) return { ok: false, error: result.error, code: result.data?.code ?? null };
  return {
    ok: result.data?.ok === true,
    candidate: result.data?.candidate ?? null,
    item_id: result.data?.item_id ?? null,
    code: result.data?.code ?? null,
    error: result.data?.error ?? null,
    partial: result.data?.partial === true,
    resolved_via: result.data?.resolved_via ?? null,
    debug: result.data?.debug ?? null,
  };
}

/** Cria ou reativa um concorrente monitorado. Retorna code (ex.: ACTIVE_LIMIT_REACHED) quando houver. */
export async function saveProductCompetitor(productId, payload) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/competitors`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload || {},
  });
  if (!result.ok) {
    return { ok: false, error: result.error, code: result.data?.code ?? null, status: result.status };
  }
  return {
    ok: true,
    competitor: result.data?.competitor ?? null,
    reactivated: result.data?.reactivated === true,
    already_registered: result.data?.already_registered === true,
    savedMinimal: result.data?.saved_minimal === true,
    enrichOk: result.data?.enrich_ok === true,
    enrich_status: result.data?.enrich_status ?? null,
    enrich_missing_fields: result.data?.enrich_missing_fields ?? null,
  };
}

/**
 * Captura manual (on-demand) do snapshot dos concorrentes ativos de um produto.
 * Grava histórico em competition_snapshots e atualiza preço/data atuais do concorrente.
 */
export async function snapshotProductCompetitors(productId) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/snapshot`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "POST" });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    capturedCount: result.data?.captured_count ?? 0,
    failedCount: result.data?.failed_count ?? 0,
    snapshots: result.data?.snapshots ?? [],
    competitors: result.data?.competitors ?? null,
    competitorsCount: result.data?.competitors_count ?? null,
    warning: result.data?.warning ?? null,
    empty: result.data?.empty === true,
  };
}

/** Desativa (soft-delete) um concorrente, preservando histórico. */
export async function removeProductCompetitor(competitorId) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/competitors/${encodeURIComponent(competitorId)}`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "DELETE" });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, competitor: result.data?.competitor ?? null };
}

// ============================================================
// Anúncios monitorados (nova âncora da Página Concorrência)
// ============================================================

/** Lista anúncios monitorados ativos com concorrentes compactos. */
export async function listMonitoredListings() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/competition/monitored-listings");
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "GET", unauthorizedFallback: { monitored_listings: [] } });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, monitoredListings: result.data?.monitored_listings ?? [] };
}

/** Busca anúncios do seller para inclusão no monitoramento. */
export async function searchListingsForMonitoring(query, { limit = 40 } = {}) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const params = new URLSearchParams();
  if (query != null && String(query).trim() !== "") params.set("q", String(query).trim());
  if (Number.isFinite(Number(limit))) params.set("limit", String(Math.trunc(Number(limit))));
  const url = buildApiUrl(`/api/competition/listings/search?${params.toString()}`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "GET", unauthorizedFallback: { results: [] } });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, results: result.data?.results ?? [], total: result.data?.total ?? 0 };
}

/** Inclui anúncios no monitoramento (bulk). */
export async function addMonitoredListings(marketplaceListingIds) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/competition/monitored-listings");
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { marketplace_listing_ids: Array.isArray(marketplaceListingIds) ? marketplaceListingIds : [] },
  });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    insertedCount: result.data?.inserted_count ?? 0,
    skippedCount: result.data?.skipped_count ?? 0,
    errorCount: result.data?.error_count ?? 0,
    inserted: result.data?.inserted ?? [],
    skipped: result.data?.skipped ?? [],
    errors: result.data?.errors ?? [],
  };
}

/** Remove anúncio do monitoramento. */
export async function removeMonitoredListing(monitoredListingId) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/monitored-listings/${encodeURIComponent(monitoredListingId)}`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "DELETE" });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, monitoredListing: result.data?.monitored_listing ?? null };
}

/** Lista concorrentes de um anúncio monitorado. */
export async function listMonitoredListingCompetitors(monitoredListingId) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(
    `/api/competition/monitored-listings/${encodeURIComponent(monitoredListingId)}/competitors`
  );
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "GET", unauthorizedFallback: { competitors: [] } });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    monitoredListing: result.data?.monitored_listing ?? null,
    product: result.data?.product ?? null,
    ownListing: result.data?.own_listing ?? null,
    competitors: result.data?.competitors ?? [],
    competitorsCount: result.data?.competitors_count ?? (result.data?.competitors?.length ?? 0),
  };
}

/** Descobre concorrentes no contexto de um anúncio monitorado. */
export async function discoverMonitoredListingCompetitors(
  monitoredListingId,
  productId,
  { query, marketplace, limit, offset, excludeListingIds } = {}
) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/discover`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      monitored_listing_id: monitoredListingId,
      query: query ?? "",
      marketplace: marketplace ?? "mercado_livre",
      limit: limit ?? 24,
      offset: Number.isFinite(Number(offset)) ? Math.max(0, Math.trunc(Number(offset))) : 0,
      exclude_listing_ids: Array.isArray(excludeListingIds) ? excludeListingIds : [],
    },
  });
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    strategy: result.data?.strategy ?? null,
    total: result.data?.total ?? (result.data?.results?.length ?? 0),
    results: result.data?.results ?? [],
    warning: result.data?.warning ?? null,
    debug: result.data?.debug ?? null,
    paging: result.data?.paging ?? null,
  };
}

/** Resolve link ML no contexto de um anúncio monitorado. */
export async function resolveMonitoredCompetitorLink(monitoredListingId, productId, url) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const urlApi = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/resolve-link`);
  if (!urlApi) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(urlApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { url: url ?? "", monitored_listing_id: monitoredListingId },
  });
  if (!result.ok) return { ok: false, error: result.error, code: result.data?.code ?? null };
  return {
    ok: result.data?.ok === true,
    candidate: result.data?.candidate ?? null,
    item_id: result.data?.item_id ?? null,
    code: result.data?.code ?? null,
    error: result.data?.error ?? null,
    partial: result.data?.partial === true,
    resolved_via: result.data?.resolved_via ?? null,
    debug: result.data?.debug ?? null,
  };
}

/** Salva concorrente vinculado a um anúncio monitorado. */
export async function saveMonitoredListingCompetitor(monitoredListingId, productId, payload) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/products/${encodeURIComponent(productId)}/competitors`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { ...(payload || {}), monitored_listing_id: monitoredListingId },
  });
  if (!result.ok) {
    return { ok: false, error: result.error, code: result.data?.code ?? null, status: result.status };
  }
  return {
    ok: true,
    competitor: result.data?.competitor ?? null,
    reactivated: result.data?.reactivated === true,
    already_registered: result.data?.already_registered === true,
    savedMinimal: result.data?.saved_minimal === true,
    enrichOk: result.data?.enrich_ok === true,
    enrich_status: result.data?.enrich_status ?? null,
    enrich_missing_fields: result.data?.enrich_missing_fields ?? null,
  };
}

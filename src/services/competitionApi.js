import { API_BASE_URL, buildApiUrl, apiFetch } from "../config/api";

function ensureApiBase() {
  if (!API_BASE_URL) {
    return { ok: false, error: "API não configurada (VITE_API_BASE_URL)" };
  }
  return null;
}

export async function competitionListListings() {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl("/api/competition/listings");
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "GET", unauthorizedFallback: { listings: [] } });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, listings: result.data?.listings ?? [] };
}

export async function competitionGetOverview(listingUuid) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/listing/${encodeURIComponent(listingUuid)}/overview`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "GET" });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

export async function competitionDiscover(listingUuid) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/listing/${encodeURIComponent(listingUuid)}/discover`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: {} });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

export async function competitionSelect(listingUuid, competitorListingIds) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/listing/${encodeURIComponent(listingUuid)}/select`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: { competitor_listing_ids: competitorListingIds },
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

export async function competitionInsights(listingUuid, minMarginPct) {
  const baseError = ensureApiBase();
  if (baseError) return baseError;
  const url = buildApiUrl(`/api/competition/listing/${encodeURIComponent(listingUuid)}/insights`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  const result = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { min_margin_pct: minMarginPct },
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, insight: result.data?.insight ?? null };
}

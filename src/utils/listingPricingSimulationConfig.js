// ======================================================
// Cliente — config de simulação de precificação por anúncio.
// ======================================================

import { apiFetch, buildApiUrl } from "../config/api";

/**
 * @param {string} listingId
 */
export async function fetchListingPricingSimulationConfig(listingId) {
  const id = String(listingId ?? "").trim();
  if (id === "") return { ok: false, config: {} };
  const url = buildApiUrl(`/api/ml/listings/pricing-simulation-config?listing_id=${encodeURIComponent(id)}`);
  if (!url) return { ok: false, config: {} };
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) return { ok: false, config: {} };
  const config = res.data?.config && typeof res.data.config === "object" ? res.data.config : {};
  return { ok: true, config };
}

/**
 * @param {string} listingId
 * @param {Record<string, { enabled: boolean; percent: string | null; amount?: string | null }>} config
 */
export async function saveListingPricingSimulationConfig(listingId, config) {
  const id = String(listingId ?? "").trim();
  if (id === "") return { ok: false, error: "listing_id ausente" };
  const url = buildApiUrl("/api/ml/listings/pricing-simulation-config");
  if (!url) return { ok: false, error: "API não configurada" };
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listing_id: id, config }),
  });
  return {
    ok: res.ok,
    error: res.ok ? null : res.error ?? "Falha ao salvar",
    financial_settings: res.data?.config ? configToFinancialSettings(res.data.config) : null,
  };
}

/**
 * @param {Record<string, { enabled?: boolean; percent?: string | null }>} config
 */
function configToFinancialSettings(config) {
  const pct = (key) => {
    const node = config[key];
    const enabled = node?.enabled === true;
    const raw = node?.percent;
    if (!enabled || raw == null || String(raw).trim() === "") return "0.00";
    return String(raw).replace(",", ".");
  };
  return {
    promo_discount_percent: pct("planned_promo"),
    ml_ads_percent: pct("ml_ads"),
    affiliate_percent: pct("affiliates"),
    reserve_percent: pct("safety_reserve"),
  };
}

/**
 * @param {string} listingId
 * @param {{
 *   plannedPromoEnabled: boolean;
 *   plannedPromoPct: string;
 *   mlAdsEnabled: boolean;
 *   mlAdsPct: string;
 *   affiliatesEnabled: boolean;
 *   affiliatesPct: string;
 *   safetyReserveEnabled: boolean;
 *   safetyReservePct: string;
 * }} state
 */
export async function savePricingFinancialSettings(listingId, state) {
  const id = String(listingId ?? "").trim();
  if (id === "") return { ok: false, error: "listing_id ausente" };
  const url = buildApiUrl(`/api/pricing/intelligent/${encodeURIComponent(id)}/financial-settings`);
  if (!url) return { ok: false, error: "API não configurada" };

  const config = buildPricingSimulationConfigPayload(state);
  const body = {
    promo_discount_percent: config.planned_promo?.enabled ? config.planned_promo.percent ?? "0.00" : "0.00",
    ml_ads_percent: config.ml_ads?.enabled ? config.ml_ads.percent ?? "0.00" : "0.00",
    affiliate_percent: config.affiliates?.enabled ? config.affiliates.percent ?? "0.00" : "0.00",
    reserve_percent: config.safety_reserve?.enabled ? config.safety_reserve.percent ?? "0.00" : "0.00",
    promo_discount_enabled: config.planned_promo?.enabled === true,
    ml_ads_enabled: config.ml_ads?.enabled === true,
    affiliates_enabled: config.affiliates?.enabled === true,
    reserve_enabled: config.safety_reserve?.enabled === true,
  };

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    ok: res.ok,
    error: res.ok ? null : res.error ?? "Falha ao salvar",
    financial_settings: res.data?.financial_settings ?? null,
    source: res.data?.source ?? null,
  };
}

/**
 * @param {Record<string, unknown> | undefined} config
 */
export function applyPricingSimulationConfigToState(config, setters) {
  const c = config && typeof config === "object" ? config : {};
  const read = (key) => {
    const node = c[key];
    if (!node || typeof node !== "object") return { enabled: false, percent: "" };
    const n = /** @type {Record<string, unknown>} */ (node);
    return {
      enabled: n.enabled === true || String(n.enabled ?? "").toLowerCase() === "true",
      percent: n.percent != null ? String(n.percent) : "",
    };
  };

  const promo = read("planned_promo");
  const ads = read("ml_ads");
  const aff = read("affiliates");
  const reserve = read("safety_reserve");

  setters.setPlannedPromoEnabled(promo.enabled);
  setters.setPlannedPromoPct(promo.enabled ? promo.percent : "");
  setters.setMlAdsEnabled(ads.enabled);
  setters.setMlAdsPct(ads.enabled ? ads.percent : "");
  setters.setAffiliatesEnabled(aff.enabled);
  setters.setAffiliatesPct(aff.enabled ? aff.percent : "");
  setters.setSafetyReserveEnabled(reserve.enabled);
  setters.setSafetyReservePct(reserve.enabled ? reserve.percent : "");
}

/**
 * @param {{
 *   plannedPromoEnabled: boolean;
 *   plannedPromoPct: string;
 *   mlAdsEnabled: boolean;
 *   mlAdsPct: string;
 *   affiliatesEnabled: boolean;
 *   affiliatesPct: string;
 *   safetyReserveEnabled: boolean;
 *   safetyReservePct: string;
 * }} state
 */
export function buildPricingSimulationConfigPayload(state) {
  const pct = (enabled, value) => (enabled && String(value ?? "").trim() !== "" ? String(value).trim() : null);
  return {
    planned_promo: { enabled: state.plannedPromoEnabled, percent: pct(state.plannedPromoEnabled, state.plannedPromoPct) },
    ml_ads: { enabled: state.mlAdsEnabled, percent: pct(state.mlAdsEnabled, state.mlAdsPct) },
    affiliates: { enabled: state.affiliatesEnabled, percent: pct(state.affiliatesEnabled, state.affiliatesPct) },
    safety_reserve: {
      enabled: state.safetyReserveEnabled,
      percent: pct(state.safetyReserveEnabled, state.safetyReservePct),
    },
  };
}

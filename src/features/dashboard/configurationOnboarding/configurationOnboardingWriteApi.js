import { buildApiUrl, apiFetch } from "../../../config/api.js";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService.js";
import {
  fetchConfigurationSnapshot,
  invalidateConfigurationSnapshotCache,
} from "./configurationOnboardingApi.js";

/**
 * @param {string} companyId
 */
export async function fetchSellerCompanyForConfiguration(companyId) {
  const id = String(companyId ?? "").trim();
  if (!id) {
    return { ok: false, error: "Empresa principal não encontrada." };
  }

  const url = buildApiUrl(`/api/seller/companies/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, error: "Configure VITE_API_BASE_URL." };

  await ensureAuthSessionBootstrapped();
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) {
    return {
      ok: false,
      error:
        (res.data && typeof res.data === "object" && typeof res.data.error === "string"
          ? res.data.error
          : null) || res.error || "Não foi possível carregar os dados da empresa.",
    };
  }

  const company =
    res.data && typeof res.data === "object" && res.data.company && typeof res.data.company === "object"
      ? res.data.company
      : null;
  if (!company) return { ok: false, error: "Empresa não encontrada." };
  return { ok: true, company };
}

/**
 * @param {string} companyId
 * @param {Record<string, unknown>} body
 */
export async function patchSellerCompanyForConfiguration(companyId, body) {
  const id = String(companyId ?? "").trim();
  if (!id) return { ok: false, error: "Empresa principal não encontrada." };

  const url = buildApiUrl(`/api/seller/companies/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, error: "Configure VITE_API_BASE_URL." };

  await ensureAuthSessionBootstrapped();
  const res = await apiFetch(url, { method: "PATCH", body });
  if (!res.ok) {
    return {
      ok: false,
      error:
        (res.data && typeof res.data === "object" && typeof res.data.error === "string"
          ? res.data.error
          : null) || res.error || "Não foi possível salvar.",
    };
  }
  return { ok: true, company: res.data?.company ?? null };
}

/**
 * @param {{ close_time?: string; closes_at?: string; working_days?: number[] }} payload
 */
export async function saveOperationalCycleConfirmation(payload) {
  const url = buildApiUrl("/api/onboarding/operational-cycle");
  if (!url) return { ok: false, error: "Configure VITE_API_BASE_URL." };

  await ensureAuthSessionBootstrapped();
  const res = await apiFetch(url, {
    method: "PATCH",
    body: {
      close_time: payload?.close_time ?? payload?.closes_at,
      working_days: payload?.working_days,
    },
  });

  if (!res.ok) {
    return {
      ok: false,
      error:
        (res.data && typeof res.data === "object" && typeof res.data.message === "string"
          ? res.data.message
          : null) ||
        (res.data && typeof res.data === "object" && typeof res.data.error === "string"
          ? res.data.error
          : null) ||
        res.error ||
        "Não foi possível salvar a configuração operacional.",
    };
  }
  return { ok: true, data: res.data ?? null };
}

/** @returns {Promise<{ ok: boolean; error?: string; configuration?: object; milestones?: object[]; authorities?: object }>} */
export async function refreshConfigurationSnapshotAfterWrite() {
  invalidateConfigurationSnapshotCache();
  return fetchConfigurationSnapshot({ force: true });
}

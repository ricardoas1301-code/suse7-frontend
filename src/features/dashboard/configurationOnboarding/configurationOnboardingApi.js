import { buildApiUrl, apiFetch } from "../../../config/api.js";
import { ensureAuthSessionBootstrapped } from "../../../auth/authBootstrapService.js";

/**
 * @typedef {{
 *   ok: boolean;
 *   error?: string;
 *   configuration?: Record<string, unknown>;
 *   milestones?: Record<string, unknown>[];
 *   fromCache?: boolean;
 * }} ConfigurationSnapshotResult
 */

/** @type {ConfigurationSnapshotResult | null} */
let cachedSnapshot = null;
/** @type {number} */
let cachedAt = 0;
const CONFIGURATION_SNAPSHOT_TTL_MS = 45_000;

/** @type {Promise<ConfigurationSnapshotResult> | null} */
let inFlight = null;

/**
 * @param {ConfigurationSnapshotResult} result
 */
function storeCache(result) {
  if (!result.ok) return;
  cachedSnapshot = result;
  cachedAt = Date.now();
}

/**
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<ConfigurationSnapshotResult>}
 */
export async function fetchConfigurationSnapshot(options = {}) {
  const { force = false } = options;
  const now = Date.now();

  if (!force && cachedSnapshot && now - cachedAt < CONFIGURATION_SNAPSHOT_TTL_MS) {
    return { ...cachedSnapshot, fromCache: true };
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    const base = buildApiUrl("/api/onboarding/configuration-snapshot");
    if (!base) {
      return {
        ok: false,
        error: "Configure VITE_API_BASE_URL.",
        configuration: undefined,
        milestones: [],
      };
    }

    await ensureAuthSessionBootstrapped();
    let res = await apiFetch(base, { method: "GET" });
    const shouldRetry =
      !res.ok && (res.status === 401 || res.status === 0 || Boolean(res.connectionError));
    if (shouldRetry) {
      await ensureAuthSessionBootstrapped();
      res = await apiFetch(base, { method: "GET" });
    }

    if (!res.ok) {
      const errMsg =
        (res.data && typeof res.data === "object" && typeof res.data.message === "string"
          ? res.data.message
          : null) ||
        res.error ||
        "Não foi possível carregar a configuração inicial.";
      return { ok: false, error: errMsg, configuration: undefined, milestones: [] };
    }

    const data = res.data && typeof res.data === "object" ? res.data : {};
    const configuration =
      data.configuration && typeof data.configuration === "object" ? data.configuration : {};
    const milestones = Array.isArray(data.milestones) ? data.milestones : [];

    const normalized = {
      ok: true,
      configuration,
      milestones,
      fromCache: false,
    };
    storeCache(normalized);
    return normalized;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/** Invalida cache — preparado para refresh() em 01D/01E. */
export function invalidateConfigurationSnapshotCache() {
  cachedSnapshot = null;
  cachedAt = 0;
}

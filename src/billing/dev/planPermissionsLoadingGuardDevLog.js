const ENDPOINT = "/api/billing/subscription/status";

/**
 * Log DEV para diagnóstico de loading infinito de permissões/plano.
 *
 * @param {Record<string, unknown>} payload
 */
export function logPlanPermissionsLoadingGuard(payload = {}) {
  if (!import.meta.env.DEV) return;

  console.warn("[S7_PLAN_PERMISSIONS_LOADING_GUARD]", {
    route: typeof window !== "undefined" ? window.location.pathname : null,
    endpoint: ENDPOINT,
    ...payload,
  });
}

export const PLAN_PERMISSIONS_STATUS_ENDPOINT = ENDPOINT;

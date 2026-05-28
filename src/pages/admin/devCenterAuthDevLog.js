const PREFIX = "[S7][DevCenterAuth]";

/**
 * Instrumentação DEV — pipeline de autorização Dev Center.
 * @param {"route_enter" | "session_loaded" | "profile_loaded" | "permission_evaluated" | "redirect_triggered"} event
 * @param {Record<string, unknown>} [payload]
 */
export function logDevCenterAuth(event, payload = {}) {
  if (!import.meta.env.DEV) return;
  console.info(`${PREFIX} ${event}`, payload);
}

const PREFIX = "[S7][Auth]";

/** @type {number | null} */
let bootStartedAt = null;

/**
 * @param {"boot_start" | "session_ready" | "profile_ready" | "permissions_ready" | "notifications_ready" | "boot_completed" | "session_updated"} event
 * @param {Record<string, unknown>} [payload]
 */
export function logAuthBootstrap(event, payload = {}) {
  if (!import.meta.env.DEV) return;

  if (event === "boot_start") {
    bootStartedAt = performance.now();
  }

  const elapsedMs =
    bootStartedAt != null ? Math.round(performance.now() - bootStartedAt) : undefined;

  console.info(`${PREFIX} ${event}`, {
    ...payload,
    ...(elapsedMs != null ? { elapsed_ms: elapsedMs } : {}),
  });
}

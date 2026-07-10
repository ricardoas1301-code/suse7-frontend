const PREFIX = "[S7][Auth]";

/** @type {number | null} */
let bootStartedAt = null;

/** @type {Map<string, number>} */
const eventCounts = new Map();

/**
 * @param {"boot_start" | "session_ready" | "profile_ready" | "permissions_ready" | "notifications_ready" | "boot_completed" | "session_updated"} event
 * @param {Record<string, unknown>} [payload]
 */
export function logAuthBootstrap(event, payload = {}) {
  if (!import.meta.env.DEV) return;

  if (event === "boot_start") {
    bootStartedAt = performance.now();
  }

  const count = (eventCounts.get(event) ?? 0) + 1;
  eventCounts.set(event, count);

  const elapsedMs =
    bootStartedAt != null ? Math.round(performance.now() - bootStartedAt) : undefined;

  if (count <= 2) {
    console.info(`${PREFIX} ${event}`, {
      ...payload,
      ...(elapsedMs != null ? { elapsed_ms: elapsedMs } : {}),
      occurrence: count,
    });
    return;
  }

  if (count === 3) {
    console.info(`${PREFIX} ${event}`, {
      ...payload,
      ...(elapsedMs != null ? { elapsed_ms: elapsedMs } : {}),
      occurrence: count,
      aggregated: true,
      note: "Próximos eventos iguais suprimidos — use window.__S7_AUTH_BOOTSTRAP_VERBOSE__ = true para detalhe.",
    });
  }
}

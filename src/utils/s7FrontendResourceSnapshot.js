// ======================================================================
// DEV — snapshot leve de recursos frontend (sem monkey patch global)
// ======================================================================

/** @type {number} */
let activeBillingRetries = 0;
/** @type {number} */
let activeExecutiveRequests = 0;
/** @type {number} */
let activeBroadcastChannels = 0;
/** @type {number} */
let activeManagedTimers = 0;

/**
 * @param {"billing_retry" | "executive_request" | "broadcast_channel" | "managed_timer"} kind
 * @param {1 | -1} delta
 */
export function trackFrontendResource(kind, delta) {
  if (!import.meta.env.DEV) return;
  const map = {
    billing_retry: () => {
      activeBillingRetries = Math.max(0, activeBillingRetries + delta);
    },
    executive_request: () => {
      activeExecutiveRequests = Math.max(0, activeExecutiveRequests + delta);
    },
    broadcast_channel: () => {
      activeBroadcastChannels = Math.max(0, activeBroadcastChannels + delta);
    },
    managed_timer: () => {
      activeManagedTimers = Math.max(0, activeManagedTimers + delta);
    },
  };
  map[kind]?.();
}

/**
 * @param {Record<string, unknown>} [extra]
 */
export function logFrontendResourceSnapshot(extra = {}) {
  if (!import.meta.env.DEV) return;
  const route =
    typeof window !== "undefined" && window.location?.pathname
      ? String(window.location.pathname)
      : "unknown";
  console.info("[S7_FRONTEND_RESOURCE_SNAPSHOT]", {
    route,
    active_billing_retries: activeBillingRetries,
    active_executive_requests: activeExecutiveRequests,
    active_broadcast_channels: activeBroadcastChannels,
    active_timers: activeManagedTimers,
    captured_at: new Date().toISOString(),
    ...extra,
  });
}

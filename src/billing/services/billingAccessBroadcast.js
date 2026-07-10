// ======================================================================
// Coordenação UX entre abas — hint de billing (não é autoridade de segurança)
// ======================================================================

const CHANNEL_NAME = "S7_BILLING_ACCESS_CHANNEL";
const SESSION_HINT_KEY = "s7_billing_access_hint_v1";
/** Hint local para UX — backend continua sendo SSOT. */
export const BILLING_ACCESS_HINT_TTL_MS = 90_000;

/**
 * @param {Record<string, unknown>} payload
 */
export function buildBillingAccessHint(payload) {
  const access =
    payload?.access && typeof payload.access === "object"
      ? /** @type {Record<string, unknown>} */ (payload.access)
      : {};
  return {
    can_access: Boolean(payload?.can_access ?? access.can_access),
    access,
    limits: payload?.limits ?? null,
    usage: payload?.usage ?? null,
    breakdowns: payload?.breakdowns ?? null,
    plan: payload?.plan ?? null,
    subscriptions: Array.isArray(payload?.subscriptions) ? payload.subscriptions : [],
    statusExtras: extractStatusExtras(payload),
    validated_at: Date.now(),
    session_fingerprint: buildSessionFingerprint(),
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} payload
 */
function extractStatusExtras(payload) {
  if (!payload || typeof payload !== "object") return {};
  return {
    overdue_invoice_url: payload.overdue_invoice_url ?? null,
    delinquency_status: payload.delinquency_status ?? null,
    overdue_since: payload.overdue_since ?? null,
    grace_period_ends_at: payload.grace_period_ends_at ?? null,
    access_suspended_at: payload.access_suspended_at ?? null,
    delinquency_warning: payload.delinquency_warning ?? false,
    plan_change_at_period_end: payload.plan_change_at_period_end ?? false,
    plan_change_requested_at: payload.plan_change_requested_at ?? null,
    plan_change_target_plan_slug: payload.plan_change_target_plan_slug ?? null,
    plan_change_access_ends_at: payload.plan_change_access_ends_at ?? null,
    active_subscription: payload.active_subscription ?? null,
    pending_checkout: payload.pending_checkout ?? null,
    pending_renewal: payload.pending_renewal ?? null,
    renewal_notice: payload.renewal_notice ?? null,
    subscription_status: payload.subscription_status ?? null,
    access_status: payload.access_status ?? "FULL",
    access_restrictions: payload.access_restrictions ?? {
      operational_blocked: false,
      allowed_path_prefixes: [],
      blocked_path_prefixes: [],
      reason: null,
    },
    grace_period_until: payload.grace_period_until ?? null,
    show_usage_growth_notice: payload.show_usage_growth_notice ?? false,
    usage_growth_grace: payload.usage_growth_grace ?? null,
  };
}

function buildSessionFingerprint() {
  if (typeof window === "undefined") return "ssr";
  try {
    const tokenKey = Object.keys(localStorage).find((k) => k.includes("auth-token"));
    if (!tokenKey) return "anonymous";
    const raw = localStorage.getItem(tokenKey);
    if (!raw) return "anonymous";
    const parsed = JSON.parse(raw);
    const userId = parsed?.user?.id ?? parsed?.currentSession?.user?.id ?? null;
    return userId ? String(userId) : "session-present";
  } catch {
    return "session-unknown";
  }
}

/**
 * @param {ReturnType<typeof buildBillingAccessHint>} hint
 */
export function persistBillingAccessHint(hint) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_HINT_KEY, JSON.stringify(hint));
  } catch {
    /* ignore quota */
  }
  try {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "billing_access_ok", hint });
    channel.close();
  } catch {
    /* ignore */
  }
}

/**
 * @returns {ReturnType<typeof buildBillingAccessHint> | null}
 */
export function readBillingAccessHint() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_HINT_KEY);
    if (!raw) return null;
    const hint = JSON.parse(raw);
    if (!hint || typeof hint !== "object") return null;
    const validatedAt = Number(hint.validated_at ?? 0);
    if (!Number.isFinite(validatedAt) || Date.now() - validatedAt > BILLING_ACCESS_HINT_TTL_MS) {
      sessionStorage.removeItem(SESSION_HINT_KEY);
      return null;
    }
    if (hint.session_fingerprint !== buildSessionFingerprint()) return null;
    return hint;
  } catch {
    return null;
  }
}

/**
 * @param {(hint: ReturnType<typeof buildBillingAccessHint>) => void} listener
 * @returns {() => void}
 */
export function subscribeBillingAccessBroadcast(listener) {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event) => {
    const data = event?.data;
    if (!data || data.type !== "billing_access_ok" || !data.hint) return;
    const hint = data.hint;
    if (hint.session_fingerprint !== buildSessionFingerprint()) return;
    persistBillingAccessHint(hint);
    listener(hint);
  };
  return () => channel.close();
}

/**
 * @param {ReturnType<typeof buildBillingAccessHint> | null | undefined} hint
 */
export function isRecentValidBillingHint(hint) {
  if (!hint) return false;
  const validatedAt = Number(hint.validated_at ?? 0);
  if (!Number.isFinite(validatedAt) || Date.now() - validatedAt > BILLING_ACCESS_HINT_TTL_MS) return false;
  return Boolean(hint.can_access);
}

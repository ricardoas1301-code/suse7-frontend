// ======================================================================
// Timeline — agrupamento, filtros e ícones (apresentação, sem regras)
// ======================================================================

/** @typedef {'all' | 'payments' | 'renewals' | 'alerts' | 'plan'} TimelineFilterKey */

export const TIMELINE_FILTER_OPTIONS = /** @type {const} */ ([
  { key: "all", label: "Todos" },
  { key: "payments", label: "Pagamentos" },
  { key: "renewals", label: "Renovações" },
  { key: "alerts", label: "Alertas" },
  { key: "plan", label: "Plano" },
]);

const PAYMENT_EVENTS = new Set(["PAYMENT_GENERATED", "PAYMENT_CONFIRMED", "PAYMENT_FAILED"]);
const RENEWAL_EVENTS = new Set(["RENEWAL_STARTED", "RENEWAL_COMPLETED"]);
const ALERT_EVENTS = new Set(["ENTERED_GRACE", "SUSPENDED", "PAYMENT_FAILED", "LIMIT_REACHED"]);
const PLAN_EVENTS = new Set(["PLAN_CHANGED", "SUBSCRIPTION_CREATED"]);

/** Mapeamento semântico → ícone oficial S7 */
export const BILLING_TIMELINE_S7_ICONS = /** @type {Record<string, string>} */ ({
  payment: "billing_payment",
  success: "billing_check",
  danger: "billing_alert",
  renewal: "billing_refresh",
  grace: "billing_clock",
  suspended: "billing_lock",
  reactivated: "billing_bolt",
  plan: "billing_layers",
  warning: "billing_alert",
  info: "info",
});

const DATE_GROUP_ORDER = ["Hoje", "Ontem", "Esta semana", "Este mês", "Mês anterior"];

/**
 * @param {string} isoDate
 */
export function getTimelineDateGroupLabel(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Mês anterior";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= startOfToday) return "Hoje";
  if (date >= startOfYesterday) return "Ontem";
  if (date >= startOfWeek) return "Esta semana";
  if (date >= startOfMonth) return "Este mês";
  return "Mês anterior";
}

/**
 * @param {TimelineFilterKey} filterKey
 * @param {{ eventType: string }} event
 */
export function matchesTimelineFilter(filterKey, event) {
  const type = String(event.eventType ?? "").toUpperCase();
  if (filterKey === "all") return true;
  if (filterKey === "payments") return PAYMENT_EVENTS.has(type);
  if (filterKey === "renewals") return RENEWAL_EVENTS.has(type);
  if (filterKey === "alerts") return ALERT_EVENTS.has(type);
  if (filterKey === "plan") return PLAN_EVENTS.has(type);
  return true;
}

/**
 * @param {Array<{ occurredAtIso?: string }>} events
 */
export function groupTimelineEventsByDate(events) {
  /** @type {Map<string, { label: string; events: typeof events }>} */
  const map = new Map();

  for (const event of events) {
    const label = getTimelineDateGroupLabel(event.occurredAtIso ?? "");
    if (!map.has(label)) {
      map.set(label, { label, events: [] });
    }
    map.get(label)?.events.push(event);
  }

  return DATE_GROUP_ORDER.filter((label) => map.has(label)).map((label) => map.get(label));
}

/**
 * @param {string} eventType
 * @param {string} severity
 */
export function resolveTimelineImportance(eventType, severity) {
  const type = String(eventType).toUpperCase();
  const sev = String(severity).toLowerCase();
  if (sev === "danger" || sev === "critical") return "high";
  if (ALERT_EVENTS.has(type) || type === "PAYMENT_CONFIRMED" || type === "RENEWAL_COMPLETED") return "high";
  return "normal";
}

/**
 * @param {string} source
 */
export function formatEventSourceLabel(source) {
  const key = String(source ?? "").toLowerCase();
  const map = {
    webhook: "Webhook do provedor",
    engine: "Motor de renovação",
    system: "Sistema Suse7",
    checkout: "Checkout",
    job: "Processo automático",
    seller: "Ação do seller",
    admin: "Administração",
  };
  return map[key] ?? (source ? String(source) : "—");
}

/**
 * Trunca IDs longos para exibição amigável (sem expor segredos).
 * @param {string | null | undefined} value
 */
export function formatFriendlyReferenceId(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "—";
  if (raw.length <= 14) return raw;
  return `${raw.slice(0, 8)}…${raw.slice(-4)}`;
}

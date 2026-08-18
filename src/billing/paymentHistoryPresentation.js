// ======================================================================
// Histórico de pagamentos — apresentação canônica (status, ação, datas)
// ======================================================================

import { formatPaymentDueDatePt } from "./billingFormatters.js";

const PAYMENT_HISTORY_INVOICE_NF_LABEL = "Baixar nota fiscal";

/**
 * @param {unknown} status
 */
export function normalizePaymentHistoryStatus(status) {
  const raw = String(status || "")
    .trim()
    .toLowerCase();
  if (!raw) return "PENDING";
  if (["received", "confirmed", "received_in_cash", "paid", "pago"].includes(raw)) return "PAID";
  if (["pending", "pendente", "awaiting_payment"].includes(raw)) return "PENDING";
  if (["overdue", "vencido", "past_due"].includes(raw)) return "OVERDUE";
  if (["canceled", "cancelled", "deleted", "cancelado"].includes(raw)) return "CANCELED";
  if (["refunded", "estornado", "refund"].includes(raw)) return "REFUNDED";
  if (["failed", "falhou", "chargeback", "chargeback_requested"].includes(raw)) return "FAILED";
  return raw.toUpperCase();
}

/**
 * @param {unknown} method
 */
export function normalizePaymentHistoryMethod(method) {
  const raw = String(method || "")
    .trim()
    .toUpperCase();
  if (!raw) return "UNKNOWN";
  if (raw.includes("PIX")) return "PIX";
  if (raw.includes("BOLETO") || raw.includes("BANK_SLIP") || raw.includes("BANKSLIP")) return "BOLETO";
  if (raw.includes("CREDIT") || raw.includes("CARD") || raw.includes("CARTAO") || raw.includes("CARTÃO")) {
    return "CREDIT_CARD";
  }
  return raw;
}

/** Timezone financeiro canônico do seller (data civil de cobrança). */
export const BILLING_CANONICAL_TIMEZONE = "America/Sao_Paulo";

export const PAYMENT_HISTORY_EXPIRED_ACTION_LABEL = "Cobrança vencida";

export const PAYMENT_HISTORY_EXPIRED_TOOLTIP = {
  title: "Cobrança vencida",
  text: "Esta cobrança ultrapassou a data de vencimento e não pode mais ser paga.",
};

export const PAYMENT_HISTORY_ACTION_LABELS = {
  boletoSecondCopy: "Gerar 2ª via do boleto",
  pixQr: "Visualizar QR Code do Pix",
  payMonthly: "Renovar assinatura",
};

/**
 * @typedef {'pix_qr' | 'boleto_second_copy' | 'pay_monthly' | 'pay_generic' | 'invoice_nf' | 'canceled_label' | 'expired' | 'unavailable'} PaymentHistoryActionKind
 */

/**
 * @typedef {{
 *   kind: PaymentHistoryActionKind;
 *   label: string;
 *   actionable: boolean;
 *   disabled?: boolean;
 *   tooltip?: { title: string; text: string } | null;
 * }} PaymentHistoryActionPresentation
 */

/**
 * @typedef {{
 *   displayStatus: string;
 *   displayStatusLabel: string;
 *   statusTone: "success" | "warning" | "danger" | "muted";
 *   derivedOverdue: boolean;
 *   action: PaymentHistoryActionPresentation;
 * }} PaymentHistoryRowPresentation
 */

/**
 * @param {unknown} value
 * @returns {{ year: number; month: number; day: number } | null}
 */
export function parseCivilDateParts(value) {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return { year, month, day };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return extractCivilDatePartsInTimezone(parsed, BILLING_CANONICAL_TIMEZONE);
}

/**
 * @param {Date} date
 * @param {string} timeZone
 */
function extractCivilDatePartsInTimezone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day };
}

/**
 * @param {Date} [now]
 * @returns {{ year: number; month: number; day: number }}
 */
export function getCanonicalBusinessDateParts(now = new Date()) {
  return extractCivilDatePartsInTimezone(now, BILLING_CANONICAL_TIMEZONE) ?? {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}

/**
 * @param {Date} [now]
 * @returns {string}
 */
export function getCanonicalBusinessDateKey(now = new Date()) {
  const parts = getCanonicalBusinessDateParts(now);
  return formatCivilDateKey(parts);
}

/**
 * @param {{ year: number; month: number; day: number }} parts
 */
export function formatCivilDateKey(parts) {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

/**
 * @param {{ year: number; month: number; day: number } | null | undefined} left
 * @param {{ year: number; month: number; day: number } | null | undefined} right
 */
export function compareCivilDateParts(left, right) {
  if (!left || !right) return 0;
  if (left.year !== right.year) return left.year - right.year;
  if (left.month !== right.month) return left.month - right.month;
  return left.day - right.day;
}

/**
 * @param {unknown} dueDate
 * @param {{ year: number; month: number; day: number }} businessDateParts
 */
export function isPaymentDueDateBeforeBusinessDate(dueDate, businessDateParts) {
  const dueParts = parseCivilDateParts(dueDate);
  if (!dueParts) return false;
  return compareCivilDateParts(dueParts, businessDateParts) < 0;
}

/**
 * @param {{ year: number; month: number; day: number }} parts
 */
function addDaysToCivilDateParts(parts, days) {
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + days);
  const next = new Date(utc);
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

/**
 * @param {Date} [now]
 */
export function msUntilNextCanonicalMidnight(now = new Date()) {
  const todayParts = getCanonicalBusinessDateParts(now);
  const tomorrowParts = addDaysToCivilDateParts(todayParts, 1);
  let low = now.getTime() + 1;
  let high = now.getTime() + 48 * 60 * 60 * 1000;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const midParts = getCanonicalBusinessDateParts(new Date(mid));
    if (compareCivilDateParts(midParts, tomorrowParts) >= 0) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return Math.max(1000, low - now.getTime());
}

/**
 * @param {{
 *   providerStatus?: string | null;
 *   dueDate?: string | null;
 *   businessDateParts?: { year: number; month: number; day: number };
 * }} input
 */
export function resolveBillingDisplayStatus(input) {
  const status = normalizePaymentHistoryStatus(input.providerStatus);
  const businessDateParts = input.businessDateParts ?? getCanonicalBusinessDateParts();

  if (status === "PAID") {
    return {
      displayStatus: "paid",
      displayStatusLabel: "Pago",
      statusTone: /** @type {const} */ ("success"),
      derivedOverdue: false,
    };
  }

  if (status === "REFUNDED") {
    return {
      displayStatus: "refunded",
      displayStatusLabel: "Estornado",
      statusTone: /** @type {const} */ ("muted"),
      derivedOverdue: false,
    };
  }

  if (status === "CANCELED") {
    return {
      displayStatus: "canceled",
      displayStatusLabel: "Cancelado",
      statusTone: /** @type {const} */ ("muted"),
      derivedOverdue: false,
    };
  }

  if (status === "OVERDUE") {
    return {
      displayStatus: "overdue",
      displayStatusLabel: "Vencido",
      statusTone: /** @type {const} */ ("danger"),
      derivedOverdue: false,
    };
  }

  if (status === "FAILED") {
    return {
      displayStatus: "failed",
      displayStatusLabel: "Falhou",
      statusTone: /** @type {const} */ ("danger"),
      derivedOverdue: false,
    };
  }

  if (status === "PENDING") {
    const dueParts = parseCivilDateParts(input.dueDate);
    const cmp = dueParts ? compareCivilDateParts(dueParts, businessDateParts) : 0;
    if (cmp < 0) {
      return {
        displayStatus: "overdue",
        displayStatusLabel: "Vencido",
        statusTone: /** @type {const} */ ("danger"),
        derivedOverdue: true,
      };
    }
    if (cmp === 0) {
      return {
        displayStatus: "due_today",
        displayStatusLabel: "Vence hoje",
        statusTone: /** @type {const} */ ("warning"),
        derivedOverdue: false,
      };
    }
    return {
      displayStatus: "pending",
      displayStatusLabel: "Pendente",
      statusTone: /** @type {const} */ ("warning"),
      derivedOverdue: false,
    };
  }

  return {
    displayStatus: status.toLowerCase(),
    displayStatusLabel: status,
    statusTone: /** @type {const} */ ("warning"),
    derivedOverdue: false,
  };
}

/**
 * @param {{
 *   payment?: Record<string, unknown> | null;
 *   businessDateKey?: string | null;
 *   businessDateParts?: { year: number; month: number; day: number };
 * }} input
 * @returns {PaymentHistoryRowPresentation}
 */
export function resolvePaymentHistoryRowPresentation(input) {
  const payment = input.payment ?? null;
  const businessDateParts =
    input.businessDateParts ??
    (input.businessDateKey ? parseCivilDateParts(input.businessDateKey) : null) ??
    getCanonicalBusinessDateParts();

  const statusPresentation = resolveBillingDisplayStatus({
    providerStatus: payment?.status,
    dueDate: payment?.due_date,
    businessDateParts,
  });

  const method = normalizePaymentHistoryMethod(payment?.payment_method_type);
  const action = resolvePaymentHistoryActionPresentation({
    payment,
    statusPresentation,
    method,
  });

  return {
    ...statusPresentation,
    action,
  };
}

/**
 * @param {{
 *   payment: Record<string, unknown> | null | undefined;
 *   statusPresentation: ReturnType<typeof resolveBillingDisplayStatus>;
 *   method: string;
 * }} input
 * @returns {PaymentHistoryActionPresentation}
 */
function resolvePaymentHistoryActionPresentation(input) {
  const { payment, statusPresentation, method } = input;
  const { displayStatus } = statusPresentation;
  const actionType = String(payment?.action_type || "")
    .trim()
    .toUpperCase();
  const billingState = String(payment?.billing_state || "")
    .trim()
    .toLowerCase();

  if (actionType === "PAY_MONTHLY" || billingState === "awaiting_generation") {
    return {
      kind: "unavailable",
      label: "—",
      actionable: false,
      disabled: true,
      tooltip: null,
    };
  }

  if (displayStatus === "paid") {
    return {
      kind: "invoice_nf",
      label: PAYMENT_HISTORY_INVOICE_NF_LABEL,
      actionable: false,
      disabled: true,
      tooltip: null,
    };
  }

  if (displayStatus === "canceled") {
    return {
      kind: "canceled_label",
      label: "Cancelado",
      actionable: false,
      disabled: true,
      tooltip: null,
    };
  }

  if (displayStatus === "overdue" && (method === "PIX" || method === "BOLETO")) {
    return {
      kind: "expired",
      label: method === "PIX" ? "Pix expirado" : "Boleto vencido",
      actionable: false,
      disabled: true,
      tooltip: PAYMENT_HISTORY_EXPIRED_TOOLTIP,
    };
  }

  if (displayStatus === "failed" && method === "CREDIT_CARD") {
    return {
      kind: "unavailable",
      label: "Pagamento recusado",
      actionable: false,
      disabled: true,
      tooltip: null,
    };
  }

  if (displayStatus === "pending") {
    if (method === "PIX") {
      return {
        kind: "pix_qr",
        label: PAYMENT_HISTORY_ACTION_LABELS.pixQr,
        actionable: Boolean(payment?.provider_payment_id),
        disabled: false,
        tooltip: null,
      };
    }
    if (method === "BOLETO") {
      return {
        kind: "boleto_second_copy",
        label: PAYMENT_HISTORY_ACTION_LABELS.boletoSecondCopy,
        actionable: Boolean(payment?.invoice_url || payment?.provider_payment_id),
        disabled: false,
        tooltip: null,
      };
    }
    if (method === "UNKNOWN" || !payment?.payment_method_type) {
      return {
        kind: "pay_monthly",
        label: PAYMENT_HISTORY_ACTION_LABELS.payMonthly,
        actionable: Boolean(payment?.renewal_cycle_id),
        disabled: false,
        tooltip: null,
      };
    }
    return {
      kind: "pay_generic",
      label: "Pagar",
      actionable: Boolean(payment?.invoice_url),
      disabled: false,
      tooltip: null,
    };
  }

  return {
    kind: "unavailable",
    label: "—",
    actionable: false,
    disabled: true,
    tooltip: null,
  };
}

/**
 * Formata data civil de cobrança sem deslocamento UTC (paridade com modais).
 * @param {string | null | undefined} value
 */
export function formatPaymentHistoryDueDateLabel(value) {
  const label = formatPaymentDueDatePt(value);
  return label || "—";
}

/**
 * Data de pagamento confirmado (paid_at) — data civil America/Sao_Paulo.
 * @param {string | null | undefined} value
 */
export function formatPaymentHistoryPaidDateLabel(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return formatPaymentDueDatePt(raw) ?? "—";
  }
  const parts = parseCivilDateParts(raw);
  if (parts) {
    return formatPaymentDueDatePt(formatCivilDateKey(parts)) ?? "—";
  }
  return "—";
}

/**
 * @param {ReturnType<typeof resolveBillingDisplayStatus>} presentation
 */
export function paymentHistoryPresentationStatusClass(presentation) {
  return presentation?.statusTone ?? "warning";
}

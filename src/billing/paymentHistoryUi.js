// ======================================================================
// Histórico de pagamentos — normalização visual
// ======================================================================

const STATUS_LABELS = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
  refunded: "Estornado",
  canceled: "Cancelado",
  failed: "Falhou",
};

/**
 * @param {unknown} value
 */
function asTrimmedString(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/**
 * @param {unknown} cents
 */
function formatAmountFromCents(cents) {
  if (cents == null || cents === "") return "—";
  const value = Number(cents);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

/**
 * @param {unknown} value
 */
export function normalizePaymentHistoryRow(value) {
  if (!value || typeof value !== "object") return null;
  const row = /** @type {Record<string, unknown>} */ (value);
  const id = row.id != null ? String(row.id).trim() : "";
  if (!id) return null;

  const status = row.status != null ? String(row.status).trim().toLowerCase() : "pending";
  return {
    id,
    provider: asTrimmedString(row.provider) ?? "unknown",
    provider_payment_id: asTrimmedString(row.provider_payment_id) ?? id,
    subscription_id: row.subscription_id != null ? String(row.subscription_id) : null,
    plan_name: asTrimmedString(row.plan_name),
    amount_cents: row.amount_cents == null ? null : Number(row.amount_cents),
    amount_label: formatAmountFromCents(row.amount_cents),
    currency: asTrimmedString(row.currency) ?? "BRL",
    billing_reason: asTrimmedString(row.billing_reason),
    status,
    status_label: STATUS_LABELS[status] ?? status,
    due_date: asTrimmedString(row.due_date),
    paid_at: asTrimmedString(row.paid_at),
    created_at: asTrimmedString(row.created_at) ?? new Date().toISOString(),
    invoice_url: asTrimmedString(row.invoice_url),
    payment_method_type: asTrimmedString(row.payment_method_type),
  };
}

/**
 * @param {unknown} payload
 */
export function normalizePaymentHistoryList(payload) {
  const list = Array.isArray(payload?.payments) ? payload.payments : Array.isArray(payload) ? payload : [];
  return list.map((item) => normalizePaymentHistoryRow(item)).filter(Boolean);
}

/**
 * @param {ReturnType<typeof normalizePaymentHistoryRow>} payment
 */
export function paymentHistoryStatusClass(payment) {
  const status = payment?.status ?? "pending";
  if (status === "paid") return "success";
  if (status === "overdue" || status === "failed") return "danger";
  if (status === "refunded" || status === "canceled") return "muted";
  return "warning";
}

/**
 * @param {string | null | undefined} value
 */
export function formatPaymentHistoryDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

/**
 * @param {string | null | undefined} type
 */
export function formatPaymentHistoryMethodLabel(type) {
  const raw = String(type || "").trim().toUpperCase();
  if (raw === "CREDIT_CARD") return "Cartão de crédito";
  if (raw === "DEBIT_CARD") return "Cartão de débito";
  if (raw === "PIX") return "Pix";
  if (raw === "BOLETO") return "Boleto";
  return type || "—";
}

/**
 * @returns {ReturnType<typeof normalizePaymentHistoryRow>[]}
 */
export function buildPaymentHistoryPreviewSamples() {
  return [
    normalizePaymentHistoryRow({
      id: "preview-pending-pix",
      provider: "asaas",
      provider_payment_id: "pay_preview_pending_pix",
      plan_name: "Crescer",
      amount_cents: 9900,
      currency: "BRL",
      billing_reason: "Assinatura mensal",
      status: "pending",
      due_date: "2026-06-13",
      created_at: new Date().toISOString(),
      payment_method_type: "PIX",
      invoice_url: "https://sandbox.asaas.com/i/preview-pix",
    }),
    normalizePaymentHistoryRow({
      id: "preview-pending-boleto",
      provider: "asaas",
      provider_payment_id: "pay_preview_pending_boleto",
      plan_name: "Start",
      amount_cents: 1990,
      currency: "BRL",
      billing_reason: "Assinatura mensal",
      status: "pending",
      due_date: "2026-06-20",
      created_at: new Date().toISOString(),
      payment_method_type: "BOLETO",
      invoice_url: "https://sandbox.asaas.com/b/preview-boleto",
    }),
    normalizePaymentHistoryRow({
      id: "preview-paid",
      provider: "asaas",
      provider_payment_id: "pay_preview_paid",
      plan_name: "Pro",
      amount_cents: 4990,
      currency: "BRL",
      billing_reason: "Assinatura mensal",
      status: "paid",
      due_date: "2026-05-13",
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      payment_method_type: "PIX",
    }),
    normalizePaymentHistoryRow({
      id: "preview-canceled",
      provider: "asaas",
      provider_payment_id: "pay_preview_canceled",
      plan_name: "Scale",
      amount_cents: 9990,
      currency: "BRL",
      billing_reason: "Assinatura mensal",
      status: "canceled",
      due_date: "2026-04-10",
      created_at: new Date().toISOString(),
      payment_method_type: "PIX",
    }),
  ].filter(Boolean);
}

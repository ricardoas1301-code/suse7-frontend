// ======================================================================
// Histórico de pagamentos — ação contextual por status/método
// ======================================================================

/**
 * @typedef {'pix_qr' | 'boleto_second_copy' | 'pay_generic' | 'invoice_nf' | 'canceled_label' | 'unavailable'} PaymentHistoryActionKind
 */

/**
 * @typedef {{
 *   kind: PaymentHistoryActionKind;
 *   label: string;
 *   actionable: boolean;
 *   disabled?: boolean;
 *   tooltip?: string | null;
 * }} PaymentHistoryAction
 */

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

/**
 * @param {{ status?: string | null } | null | undefined} payment
 */
export function isPaymentHistoryPayable(payment) {
  const status = normalizePaymentHistoryStatus(payment?.status);
  return status === "PENDING" || status === "OVERDUE";
}

/**
 * @param {Record<string, unknown> | null | undefined} payment
 * @returns {PaymentHistoryAction}
 */
export function getPaymentHistoryAction(payment) {
  const status = normalizePaymentHistoryStatus(payment?.status);
  const method = normalizePaymentHistoryMethod(payment?.payment_method_type);

  if (status === "PAID") {
    return {
      kind: "invoice_nf",
      label: "Gerar nota fiscal",
      actionable: false,
      disabled: true,
      tooltip: "Disponível em breve",
    };
  }

  if (status === "CANCELED") {
    return {
      kind: "canceled_label",
      label: "Cancelado",
      actionable: false,
    };
  }

  if (status === "PENDING" || status === "OVERDUE") {
    if (method === "PIX") {
      return {
        kind: "pix_qr",
        label: "Visualizar QR Code",
        actionable: Boolean(payment?.provider_payment_id),
      };
    }
    if (method === "BOLETO") {
      return {
        kind: "boleto_second_copy",
        label: "Gerar 2ª via",
        actionable: Boolean(payment?.invoice_url || payment?.provider_payment_id),
      };
    }
    return {
      kind: "pay_generic",
      label: "Pagar",
      actionable: Boolean(payment?.invoice_url),
    };
  }

  return {
    kind: "unavailable",
    label: "—",
    actionable: false,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} payment
 */
export function buildPaymentHistoryPixCheckout(payment) {
  if (!payment) return null;
  const amountCents = payment.amount_cents == null ? null : Number(payment.amount_cents);
  const value = Number.isFinite(amountCents) ? amountCents / 100 : null;
  return {
    payment: {
      provider_payment_id: payment.provider_payment_id,
      plan_name: payment.plan_name,
      value,
      due_date: payment.due_date,
    },
    plan: { name: payment.plan_name },
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} payment
 */
export function buildPaymentHistoryBoletoPayment(payment) {
  if (!payment) return null;
  const amountCents = payment.amount_cents == null ? null : Number(payment.amount_cents);
  const value = Number.isFinite(amountCents) ? amountCents / 100 : null;
  return {
    provider_payment_id: payment.provider_payment_id,
    plan_name: payment.plan_name,
    value,
    amount: value,
    due_date: payment.due_date,
    invoice_url: payment.invoice_url,
    bank_slip_url: payment.invoice_url,
    identification_field: payment.identification_field,
  };
}

/**
 * Bloqueia abertura de link/modal quando status não é pagável.
 * @param {Record<string, unknown> | null | undefined} payment
 * @param {PaymentHistoryActionKind} expectedKind
 */
export function canExecutePaymentHistoryAction(payment, expectedKind) {
  if (!isPaymentHistoryPayable(payment)) return false;
  const action = getPaymentHistoryAction(payment);
  return action.actionable && action.kind === expectedKind;
}

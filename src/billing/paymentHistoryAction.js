// ======================================================================
// Histórico de pagamentos — ação contextual por status/método
// ======================================================================

import {
  getCanonicalBusinessDateKey,
  resolvePaymentHistoryRowPresentation,
} from "./paymentHistoryPresentation.js";

export {
  BILLING_CANONICAL_TIMEZONE,
  PAYMENT_HISTORY_ACTION_LABELS,
  PAYMENT_HISTORY_EXPIRED_ACTION_LABEL,
  PAYMENT_HISTORY_EXPIRED_TOOLTIP,
  formatPaymentHistoryDueDateLabel,
  formatPaymentHistoryPaidDateLabel,
  getCanonicalBusinessDateKey,
  getCanonicalBusinessDateParts,
  isPaymentDueDateBeforeBusinessDate,
  msUntilNextCanonicalMidnight,
  normalizePaymentHistoryMethod,
  normalizePaymentHistoryStatus,
  parseCivilDateParts,
  paymentHistoryPresentationStatusClass,
  resolveBillingDisplayStatus,
  resolvePaymentHistoryRowPresentation,
} from "./paymentHistoryPresentation.js";

/** Rótulo da ação de nota fiscal (desabilitada até emissão automática). */
export const PAYMENT_HISTORY_INVOICE_NF_LABEL = "Baixar nota fiscal";

export const PAYMENT_HISTORY_INVOICE_NF_TOOLTIP = {
  title: "Nota fiscal",
  text: "A nota fiscal estará disponível para download após a implementação da emissão automática.",
};

/**
 * @typedef {import("./paymentHistoryPresentation").PaymentHistoryActionPresentation} PaymentHistoryAction
 */

/**
 * @param {Record<string, unknown> | null | undefined} payment
 * @param {{ businessDateKey?: string | null }} [options]
 * @returns {PaymentHistoryAction}
 */
export function getPaymentHistoryAction(payment, options = {}) {
  return resolvePaymentHistoryRowPresentation({
    payment,
    businessDateKey: options.businessDateKey ?? getCanonicalBusinessDateKey(),
  }).action;
}

/**
 * @param {{ status?: string | null; due_date?: string | null } | null | undefined} payment
 * @param {{ businessDateKey?: string | null }} [options]
 */
export function isPaymentHistoryPayable(payment, options = {}) {
  const presentation = resolvePaymentHistoryRowPresentation({
    payment,
    businessDateKey: options.businessDateKey ?? getCanonicalBusinessDateKey(),
  });
  return presentation.action.actionable && !presentation.action.disabled;
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
 * Bloqueia abertura de link/modal quando a ação não é executável.
 * @param {Record<string, unknown> | null | undefined} payment
 * @param {import("./paymentHistoryPresentation").PaymentHistoryActionKind} expectedKind
 * @param {{ businessDateKey?: string | null }} [options]
 */
export function canExecutePaymentHistoryAction(payment, expectedKind, options = {}) {
  if (
    expectedKind === "pay_monthly" &&
    String(payment?.billing_state || "").toLowerCase() === "awaiting_generation" &&
    payment?.renewal_cycle_id
  ) {
    return true;
  }
  const action = getPaymentHistoryAction(payment, options);
  return action.actionable && !action.disabled && action.kind === expectedKind;
}

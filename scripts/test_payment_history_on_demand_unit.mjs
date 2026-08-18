#!/usr/bin/env node
/**
 * S1.HISTORICO-FINANCEIRO.4 — pagamento sob demanda, data de pagamento, ações
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  PAYMENT_HISTORY_ACTION_LABELS,
  formatPaymentHistoryPaidDateLabel,
  resolvePaymentHistoryRowPresentation,
} from "../src/billing/paymentHistoryPresentation.js";
import {
  canExecutePaymentHistoryAction,
  getPaymentHistoryAction,
} from "../src/billing/paymentHistoryAction.js";
import { formatPaymentHistoryMethodLabel } from "../src/billing/paymentHistoryUi.js";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/PaymentHistoryPage.jsx");
const pageJsx = readFileSync(pagePath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function projectedPayment(overrides = {}) {
  return {
    id: "projected:renewal:cycle-1",
    status: "pending",
    due_date: "2026-08-20",
    payment_method_type: null,
    renewal_cycle_id: "cycle-1",
    billing_state: "awaiting_generation",
    action_type: "PAY_MONTHLY",
    ...overrides,
  };
}

assert("mensalidade sem metodo -> renovar assinatura", (() => {
  const action = getPaymentHistoryAction(projectedPayment(), { businessDateKey: "2026-07-19" });
  return action.kind === "pay_monthly" && action.label === PAYMENT_HISTORY_ACTION_LABELS.payMonthly;
})());

assert("metodo vazio exibe traco", formatPaymentHistoryMethodLabel(null) === "—");

assert("data pagamento pendente exibe traco", formatPaymentHistoryPaidDateLabel(null) === "—");

assert("data pagamento pago formata civil", formatPaymentHistoryPaidDateLabel("2026-07-15T03:00:00.000Z") === "15/07/2026");

assert("pix so apos geracao", (() => {
  const action = getPaymentHistoryAction(
    {
      status: "pending",
      due_date: "2026-08-20",
      payment_method_type: "PIX",
      provider_payment_id: "pay_123",
    },
    { businessDateKey: "2026-07-19" },
  );
  return action.kind === "pix_qr";
})());

assert("sem provider id pix nao executavel antes geracao", !canExecutePaymentHistoryAction(
  projectedPayment({ payment_method_type: "PIX" }),
  "pix_qr",
  { businessDateKey: "2026-07-19" },
));

assert("pago exibe data pagamento no resolver", (() => {
  const row = resolvePaymentHistoryRowPresentation({
    payment: {
      status: "paid",
      paid_at: "2026-06-10T15:00:00.000Z",
      due_date: "2026-06-10",
      payment_method_type: "PIX",
    },
    businessDateKey: "2026-07-19",
  });
  return row.displayStatusLabel === "Pago" && row.action.kind === "invoice_nf";
})());

assert("page possui coluna data de pagamento", pageJsx.includes("Data de pagamento"));
assert("page usa formatPaymentHistoryPaidDateLabel", pageJsx.includes("formatPaymentHistoryPaidDateLabel"));
assert("page integra RenewalCheckoutSheet", pageJsx.includes("RenewalCheckoutSheet"));
assert("page nao usa PayMonthlyModal", !pageJsx.includes("PayMonthlyModal"));

if (failures.length) {
  console.error("[S1.HISTORICO-FINANCEIRO.4 frontend unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[S1.HISTORICO-FINANCEIRO.4 frontend unit] OK");

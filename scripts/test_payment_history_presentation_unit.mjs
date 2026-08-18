#!/usr/bin/env node
/**
 * S1.HISTORICO-FINANCEIRO.3 — status vencido canônico, ações, datas civis e modais
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  BILLING_CANONICAL_TIMEZONE,
  PAYMENT_HISTORY_ACTION_LABELS,
  PAYMENT_HISTORY_EXPIRED_ACTION_LABEL,
  PAYMENT_HISTORY_EXPIRED_TOOLTIP,
  compareCivilDateParts,
  formatPaymentHistoryDueDateLabel,
  getCanonicalBusinessDateParts,
  isPaymentDueDateBeforeBusinessDate,
  msUntilNextCanonicalMidnight,
  parseCivilDateParts,
  resolveBillingDisplayStatus,
  resolvePaymentHistoryRowPresentation,
} from "../src/billing/paymentHistoryPresentation.js";
import {
  canExecutePaymentHistoryAction,
  getPaymentHistoryAction,
  isPaymentHistoryPayable,
  PAYMENT_HISTORY_INVOICE_NF_LABEL,
} from "../src/billing/paymentHistoryAction.js";
import { formatPaymentHistoryDate } from "../src/billing/paymentHistoryUi.js";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/PaymentHistoryPage.jsx");
const actionCellPath = join(root, "../src/billing/components/PaymentHistoryActionCell.jsx");
const wideLayoutCssPath = join(root, "../src/billing/components/billingWideCheckoutLayout.css");
const pixCssPath = join(root, "../src/billing/components/PixCheckoutModal.css");
const boletoCssPath = join(root, "../src/billing/components/BillingBoletoModal.css");

const pageJsx = readFileSync(pagePath, "utf8");
const actionCellJsx = readFileSync(actionCellPath, "utf8");
const wideLayoutCss = readFileSync(wideLayoutCssPath, "utf8");
const pixCss = readFileSync(pixCssPath, "utf8");
const boletoCss = readFileSync(boletoCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function basePayment(overrides = {}) {
  return {
    id: "pay-test",
    provider_payment_id: "pay_provider_test",
    status: "pending",
    due_date: "2026-08-25",
    payment_method_type: "PIX",
    invoice_url: "https://sandbox.asaas.com/i/test",
    ...overrides,
  };
}

const businessYesterday = { year: 2026, month: 7, day: 18 };
const businessToday = { year: 2026, month: 7, day: 19 };
const businessTomorrow = { year: 2026, month: 7, day: 20 };

assert("timezone canonico", BILLING_CANONICAL_TIMEZONE === "America/Sao_Paulo");

assert("pendente ontem -> vencido", (() => {
  const status = resolveBillingDisplayStatus({
    providerStatus: "pending",
    dueDate: "2026-07-18",
    businessDateParts: businessToday,
  });
  return status.displayStatusLabel === "Vencido" && status.statusTone === "danger";
})());

assert("pendente ontem -> acao cobranca vencida", (() => {
  const row = resolvePaymentHistoryRowPresentation({
    payment: basePayment({ due_date: "2026-07-18", payment_method_type: "BOLETO" }),
    businessDateParts: businessToday,
  });
  return (
    row.action.kind === "expired" &&
    row.action.label === PAYMENT_HISTORY_EXPIRED_ACTION_LABEL &&
    row.action.actionable === false &&
    row.action.disabled === true
  );
})());

assert("pendente hoje -> pendente", (() => {
  const status = resolveBillingDisplayStatus({
    providerStatus: "pending",
    dueDate: "2026-07-19",
    businessDateParts: businessToday,
  });
  return status.displayStatusLabel === "Pendente";
})());

assert("pendente hoje -> acao disponivel pix", (() => {
  const action = getPaymentHistoryAction(
    basePayment({ due_date: "2026-07-19", payment_method_type: "PIX" }),
    { businessDateKey: "2026-07-19" },
  );
  return action.kind === "pix_qr" && action.actionable === true && action.label === PAYMENT_HISTORY_ACTION_LABELS.pixQr;
})());

assert("pendente amanha -> pendente", (() => {
  const status = resolveBillingDisplayStatus({
    providerStatus: "pending",
    dueDate: "2026-07-20",
    businessDateParts: businessToday,
  });
  return status.displayStatusLabel === "Pendente";
})());

assert("pago com vencimento passado -> pago", (() => {
  const row = resolvePaymentHistoryRowPresentation({
    payment: basePayment({ status: "paid", due_date: "2026-01-01", payment_method_type: "PIX" }),
    businessDateParts: businessToday,
  });
  return row.displayStatusLabel === "Pago" && row.action.label === PAYMENT_HISTORY_INVOICE_NF_LABEL;
})());

assert("cancelado com vencimento passado -> cancelado", (() => {
  const row = resolvePaymentHistoryRowPresentation({
    payment: basePayment({ status: "canceled", due_date: "2026-01-01", payment_method_type: "PIX" }),
    businessDateParts: businessToday,
  });
  return row.displayStatusLabel === "Cancelado" && row.displayStatusLabel !== "Vencido";
})());

assert("boleto pendente valido -> gerar 2a via do boleto", (() => {
  const action = getPaymentHistoryAction(
    basePayment({ due_date: "2026-07-20", payment_method_type: "BOLETO" }),
    { businessDateKey: "2026-07-19" },
  );
  return action.label === PAYMENT_HISTORY_ACTION_LABELS.boletoSecondCopy && action.kind === "boleto_second_copy";
})());

assert("pix pendente valido -> visualizar qr code do pix", (() => {
  const action = getPaymentHistoryAction(
    basePayment({ due_date: "2026-07-20", payment_method_type: "PIX" }),
    { businessDateKey: "2026-07-19" },
  );
  return action.label === PAYMENT_HISTORY_ACTION_LABELS.pixQr && action.kind === "pix_qr";
})());

assert("boleto vencido -> cobranca vencida", (() => {
  const action = getPaymentHistoryAction(
    basePayment({ due_date: "2026-07-18", payment_method_type: "BOLETO" }),
    { businessDateKey: "2026-07-19" },
  );
  return action.kind === "expired" && action.label === PAYMENT_HISTORY_EXPIRED_ACTION_LABEL;
})());

assert("pix vencido -> cobranca vencida", (() => {
  const action = getPaymentHistoryAction(
    basePayment({ due_date: "2026-07-18", payment_method_type: "PIX" }),
    { businessDateKey: "2026-07-19" },
  );
  return action.kind === "expired";
})());

assert("vencido nao executa modal pix", !canExecutePaymentHistoryAction(
  basePayment({ due_date: "2026-07-18", payment_method_type: "PIX" }),
  "pix_qr",
  { businessDateKey: "2026-07-19" },
));

assert("vencido nao executa modal boleto", !canExecutePaymentHistoryAction(
  basePayment({ due_date: "2026-07-18", payment_method_type: "BOLETO" }),
  "boleto_second_copy",
  { businessDateKey: "2026-07-19" },
));

assert("vencido nao pagavel", !isPaymentHistoryPayable(
  basePayment({ due_date: "2026-07-18" }),
  { businessDateKey: "2026-07-19" },
));

assert("virada do dia agenda ms positivo", msUntilNextCanonicalMidnight(new Date("2026-07-19T02:59:00.000Z")) > 0);

assert("yyyy-mm-dd sem deslocamento utc na tabela", formatPaymentHistoryDate("2026-08-24") === "24/08/2026");
assert("yyyy-mm-dd sem deslocamento utc no due label", formatPaymentHistoryDueDateLabel("2026-08-24") === "24/08/2026");
assert("paridade tabela e modal formatter", formatPaymentHistoryDate("2026-08-22") === formatPaymentHistoryDueDateLabel("2026-08-22"));

assert("parse civil date", compareCivilDateParts(parseCivilDateParts("2026-08-24"), parseCivilDateParts("2026-08-25")) < 0);

assert("timezone diferente mantem comparacao civil", (() => {
  const due = "2026-07-18";
  const business = getCanonicalBusinessDateParts(new Date("2026-07-19T15:00:00.000Z"));
  return isPaymentDueDateBeforeBusinessDate(due, business) === isPaymentDueDateBeforeBusinessDate(due, businessToday);
})());

assert("tooltip cobranca vencida", PAYMENT_HISTORY_EXPIRED_TOOLTIP.title === "Cobrança vencida");
assert(
  "tooltip texto curto",
  PAYMENT_HISTORY_EXPIRED_TOOLTIP.text ===
    "Esta cobrança ultrapassou a data de vencimento e não pode mais ser paga.",
);
assert(
  "tooltip texto antigo ausente",
  !PAYMENT_HISTORY_EXPIRED_TOOLTIP.text.includes("boleto ou Pix"),
);

assert("page usa resolver de apresentacao", pageJsx.includes("resolvePaymentHistoryRowPresentation"));
assert("page usa business date hook", pageJsx.includes("useCanonicalBusinessDate"));
assert("page usa due date canonico", pageJsx.includes("formatPaymentHistoryDueDateLabel"));
assert("page bloqueia acao com businessDateKey", pageJsx.includes("businessDateKey"));

assert("action cell trata expired", actionCellJsx.includes('action.kind === "expired"'));
assert("action cell usa span desabilitado para expired", /expired[\s\S]*role="text"/.test(actionCellJsx));
assert("rotulos novos no resolver", PAYMENT_HISTORY_ACTION_LABELS.boletoSecondCopy === "Gerar 2ª via do boleto");
assert("rotulos novos pix", PAYMENT_HISTORY_ACTION_LABELS.pixQr === "Visualizar QR Code do Pix");

assert("modal pix centralizado abaixo topnav", wideLayoutCss.includes(".s7-billing-pix-checkout-sheet.s7-billing-checkout-sheet"));
assert("modal boleto centralizado abaixo topnav", wideLayoutCss.includes(".s7-billing-boleto-checkout-sheet.s7-billing-checkout-sheet"));
assert("modal usa topnav token", wideLayoutCss.includes("--s7-topnav-bar-height"));
assert("layout pix preenche altura", pixCss.includes("grid-template-rows: minmax(0, 1fr) auto"));
assert("layout boleto preenche altura", boletoCss.includes("grid-template-rows: minmax(0, 1fr) auto"));
assert("pix importa layout compartilhado", pixCss.includes('@import "./billingWideCheckoutLayout.css"'));
assert("boleto importa layout compartilhado", boletoCss.includes('@import "./billingWideCheckoutLayout.css"'));

if (failures.length) {
  console.error("[S1.HISTORICO-FINANCEIRO.3 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.HISTORICO-FINANCEIRO.3 unit] OK");

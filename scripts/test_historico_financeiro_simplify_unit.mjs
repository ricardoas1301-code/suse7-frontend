#!/usr/bin/env node
/**
 * S1.HISTORICO-FINANCEIRO.2 — simplificação executiva + ação NF
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";
import {
  PAYMENT_HISTORY_INVOICE_NF_LABEL,
  getPaymentHistoryAction,
  normalizePaymentHistoryStatus,
} from "../src/billing/paymentHistoryAction.js";
import {
  normalizeRevenueHealth,
  resolveRevenueHealthLevelLabel,
  REVENUE_HEALTH_LEVEL_LABELS,
} from "../src/billing/billingFinancialExperienceUi.js";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/PaymentHistoryPage.jsx");
const actionCellPath = join(root, "../src/billing/components/PaymentHistoryActionCell.jsx");
const revenueHookPath = join(root, "../src/billing/hooks/useRevenueHealth.js");
const financeHookPath = join(root, "../src/billing/hooks/useBillingFinancialExperience.js");
const billingCssPath = join(root, "../src/billing/billing.css");
const healthCardPath = join(root, "../src/billing/components/BillingRevenueHealthCard.jsx");

const pageJsx = readFileSync(pagePath, "utf8");
const actionCellJsx = readFileSync(actionCellPath, "utf8");
const revenueHook = readFileSync(revenueHookPath, "utf8");
const financeHook = readFileSync(financeHookPath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");
const healthCardJsx = readFileSync(healthCardPath, "utf8");

/** @type {string[]} */
const failures = [];

function check(name, cond) {
  if (!cond) failures.push(name);
}

check("timeline removed from page", !pageJsx.includes("BillingTimeline"));
check("notifications removed from page", !pageJsx.includes("BillingNotificationList"));
check("finance dashboard wrapper removed", !pageJsx.includes("s7-billing-finance-dashboard"));
check("uses revenue health hook only", pageJsx.includes("useRevenueHealth") && !pageJsx.includes("useBillingFinancialExperience"));
check("payments section after health card", /BillingRevenueHealthCard[\s\S]*s7-billing-payments-section/.test(pageJsx));
check("12px gap between health and payments", billingCss.includes(".s7-historico-financeiro-page .s7-billing-payments-section") && billingCss.includes("margin-top: 12px"));
check("seven table columns", (pageJsx.match(/<th scope="col">/g) ?? []).length === 7);
check("no NF column", !pageJsx.includes("<th scope=\"col\">NF</th>"));
check("revenue hook fetches health only", revenueHook.includes("fetchRevenueHealth") && !revenueHook.includes("fetchBillingTimeline") && !revenueHook.includes("fetchBillingNotifications"));
check("finance hook still exists for other pages", financeHook.includes("fetchBillingTimeline"));

check("healthy label mapper", REVENUE_HEALTH_LEVEL_LABELS.HEALTHY === "SAUDÁVEL");
check("health card uses levelLabel", healthCardJsx.includes("health.levelLabel"));
const normalized = normalizeRevenueHealth({ health_level: "HEALTHY", health_score: 100 });
assert.equal(normalized.level, "HEALTHY");
assert.equal(normalized.levelLabel, "SAUDÁVEL");
assert.equal(resolveRevenueHealthLevelLabel("HEALTHY"), "SAUDÁVEL");

check("invoice label updated", PAYMENT_HISTORY_INVOICE_NF_LABEL === "Baixar nota fiscal");
check("old generate label removed", !actionCellJsx.includes("Gerar nota fiscal"));
const paidAction = getPaymentHistoryAction({ status: "PAID", payment_method_type: "BOLETO" });
assert.equal(paidAction.label, "Baixar nota fiscal");
assert.equal(paidAction.actionable, false);

check("s7 tooltip on invoice action", actionCellJsx.includes("S7Tooltip") && actionCellJsx.includes("s7-billing-payment-history__nf-tooltip"));
check("accessible wrapper for disabled action", actionCellJsx.includes("s7-billing-payment-history__action-accessible"));

const pixAction = getPaymentHistoryAction({ status: "PENDING", payment_method_type: "PIX", provider_payment_id: "p1" });
assert.equal(pixAction.label, "Visualizar QR Code");

if (failures.length) {
  console.error("[S1.HISTORICO-FINANCEIRO.2 unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[OK] test_historico_financeiro_simplify_unit.mjs");

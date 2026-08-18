#!/usr/bin/env node
/**
 * S1.HISTORICO-FINANCEIRO.6.1 — modal único Minha assinatura + Histórico financeiro
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  PAYMENT_HISTORY_ACTION_LABELS,
} from "../src/billing/paymentHistoryPresentation.js";
import {
  BILLING_PAYMENT_CONTEXT,
  resolveBillingPaymentConfirmLabel,
} from "../src/billing/billingPaymentContextUi.js";

const root = dirname(fileURLToPath(import.meta.url));
const subscriptionPage = join(root, "../src/billing/pages/SubscriptionPage.jsx");
const historyPage = join(root, "../src/billing/pages/PaymentHistoryPage.jsx");
const renewalSheet = join(root, "../src/billing/components/RenewalCheckoutSheet.jsx");
const prepareScript = join(root, "../../suse7-backend/scripts/prepare_billing_renewal_block_b_cases_dev.mjs");

const subscriptionJsx = readFileSync(subscriptionPage, "utf8");
const historyJsx = readFileSync(historyPage, "utf8");
const renewalSheetJsx = readFileSync(renewalSheet, "utf8");
const prepareJs = readFileSync(prepareScript, "utf8");

/** @type {string[]} */
const failures = [];

function check(name, cond) {
  if (!cond) failures.push(name);
}

check("assinatura abre RenewalCheckoutSheet", subscriptionJsx.includes("RenewalCheckoutSheet"));
check("historico abre RenewalCheckoutSheet", historyJsx.includes("RenewalCheckoutSheet"));
check("historico nao usa PayMonthlyModal", !historyJsx.includes("PayMonthlyModal"));
check("historico consome renewal_experience", historyJsx.includes("renewal_experience"));
check("historico refresh subscription status", historyJsx.includes("refreshSubscriptionStatus"));
check("tres metodos no modal", renewalSheetJsx.includes("availableMethods") && renewalSheetJsx.includes("CardCheckoutModal"));
check(
  "labels canonicos iguais",
  PAYMENT_HISTORY_ACTION_LABELS.payMonthly === "Renovar assinatura" &&
    resolveBillingPaymentConfirmLabel(BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL, "CREDIT_CARD") ===
      "Pagar e ativar renovação automática"
);
check("script usa env email", prepareJs.includes("S7_BLOCK_B_USER_EMAIL"));
check("script sem email hard-coded", !prepareJs.includes("@gmail.com"));

if (failures.length) {
  console.error("[S1.HF.6.1 frontend unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[S1.HF.6.1 frontend unit] OK");

#!/usr/bin/env node
/**
 * S1.HISTORICO-FINANCEIRO.6 — UX Minha assinatura / modal renovação (Bloco B + complemento cartão)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRenewalModalPayment,
  RENEWAL_EXPERIENCE_ACTION,
  RENEWAL_EXPERIENCE_STATE,
  shouldShowRenewalPrimaryAction,
} from "../src/billing/renewalExperienceUi.js";
import {
  BILLING_PAYMENT_CONTEXT,
  resolveBillingPaymentConfirmLabel,
} from "../src/billing/billingPaymentContextUi.js";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/SubscriptionPage.jsx");
const renewalSheetPath = join(root, "../src/billing/components/RenewalCheckoutSheet.jsx");
const selectorPath = join(root, "../src/billing/components/CheckoutPaymentMethodSelector.jsx");
const plansPagePath = join(root, "../src/billing/pages/PlansPage.jsx");
const billingCssPath = join(root, "../src/billing/billing.css");

const pageJsx = readFileSync(pagePath, "utf8");
const renewalSheetJsx = readFileSync(renewalSheetPath, "utf8");
const selectorJsx = readFileSync(selectorPath, "utf8");
const plansPageJsx = readFileSync(plansPagePath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");

/** @type {string[]} */
const failures = [];

function check(name, cond) {
  if (!cond) failures.push(name);
}

check(
  "cta renovar no header",
  pageJsx.includes("handleRenewalPrimaryAction") && pageJsx.includes("renewalExperience?.primary_action?.label")
);
check(
  "renovacao usa RenewalCheckoutSheet canonico",
  pageJsx.includes("RenewalCheckoutSheet") && !pageJsx.includes("PayMonthlyModal")
);
check("nao duplica modal pay monthly na renovacao", !pageJsx.includes('mode="renewal"'));
check("alterar plano secundario quando renovar visivel", pageJsx.includes('variant={showRenewalPrimaryAction ? "secondary" : "primary"}'));
check("modal titulo renovar assinatura", renewalSheetJsx.includes("copy.title"));
check("modal sem botao cancelar", !renewalSheetJsx.includes(">Cancelar<") && !renewalSheetJsx.includes('"Cancelar"'));
check("modal sem botao X", !renewalSheetJsx.match(/>\s*[xX]\s*</));
check("backdrop bloqueia durante loading", renewalSheetJsx.includes("if (loading || cardCheckoutLoading) return"));
check(
  "tres metodos no seletor",
  renewalSheetJsx.includes("CheckoutPaymentMethodSelector") &&
    selectorJsx.includes("availableMethods") &&
    renewalSheetJsx.includes('availableMethods={availableMethods}')
);
check(
  "confirmacao explicita pix boleto cartao",
  renewalSheetJsx.includes("resolveBillingPaymentConfirmLabel") &&
    resolveBillingPaymentConfirmLabel(BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL, "PIX") === "Gerar Pix" &&
    resolveBillingPaymentConfirmLabel(BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL, "BOLETO") === "Gerar boleto" &&
    resolveBillingPaymentConfirmLabel(BILLING_PAYMENT_CONTEXT.MONTHLY_RENEWAL, "CREDIT_CARD") ===
      "Pagar e ativar renovação automática"
);
check("consentimento recorrente visivel", renewalSheetJsx.includes("recurringConsent") && renewalSheetJsx.includes("recurringCopy.message"));
check("cartao usa CardCheckoutModal existente", renewalSheetJsx.includes("CardCheckoutModal") && renewalSheetJsx.includes("onSubmit={submitCardCheckout}"));
check("nao cobra ao selecionar cartao", !renewalSheetJsx.includes("onChange={setPaymentMethod}") || renewalSheetJsx.includes("handleConfirm"));
check("checkout planos preservado", plansPageJsx.includes("CheckoutPaymentMethodSelector") && plansPageJsx.includes("CardCheckoutModal"));
check("header actions agrupadas", billingCss.includes(".s7-billing-subscription-header-actions"));
check("historico usa modal canonico", readFileSync(join(root, "../src/billing/pages/PaymentHistoryPage.jsx"), "utf8").includes("RenewalCheckoutSheet"));

const awaiting = {
  renewal_state: RENEWAL_EXPERIENCE_STATE.RENEWAL_AWAITING_GENERATION,
  renewal_cycle_id: "cycle-1",
  amount: "649.00",
  plan: { name: "Elite" },
  period: { start: "2026-07-21", end: "2026-08-20" },
  due_date: "2026-07-21",
  available_payment_methods: ["PIX", "CREDIT_CARD", "BOLETO"],
  available_actions: [RENEWAL_EXPERIENCE_ACTION.RENEW_SUBSCRIPTION],
  primary_action: { action: RENEWAL_EXPERIENCE_ACTION.RENEW_SUBSCRIPTION, label: "Renovar assinatura" },
};
check("should show primary action", shouldShowRenewalPrimaryAction(awaiting));
check("healthy hides primary action", !shouldShowRenewalPrimaryAction({ renewal_state: RENEWAL_EXPERIENCE_STATE.ACTIVE_NOT_DUE, available_actions: [] }));
check("modal payment builder", buildRenewalModalPayment(awaiting)?.renewal_cycle_id === "cycle-1");

if (failures.length) {
  console.error("[S1.HF.6 frontend unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[S1.HF.6 frontend unit] OK");

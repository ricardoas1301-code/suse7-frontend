#!/usr/bin/env node
/**
 * S1.HISTORICO-FINANCEIRO.1 — card pai + remoção do botão Atualizar
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const pagePath = join(root, "../src/billing/pages/PaymentHistoryPage.jsx");
const billingCssPath = join(root, "../src/billing/billing.css");
const profileCssPath = join(root, "../src/components/Profile/Profile.css");
const paymentHistoryHookPath = join(root, "../src/billing/hooks/usePaymentHistory.js");
const revenueHookPath = join(root, "../src/billing/hooks/useRevenueHealth.js");

const pageJsx = readFileSync(pagePath, "utf8");
const billingCss = readFileSync(billingCssPath, "utf8");
const profileCss = readFileSync(profileCssPath, "utf8");
const paymentHistoryHook = readFileSync(paymentHistoryHookPath, "utf8");
const revenueHook = readFileSync(revenueHookPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("page uses profile shell classes", pageJsx.includes('className="dados-empresa-page minha-assinatura-page s7-historico-financeiro-page"'));
assert("page uses white parent card", pageJsx.includes('className="profile-card s7-minha-assinatura-hero s7-historico-financeiro-hero"'));
assert("header inside billing page shell", /profile-card[\s\S]*S7PageHeader[\s\S]*Histórico financeiro/.test(pageJsx));
assert("payments section inside parent card", /profile-card[\s\S]*s7-billing-payments-section/.test(pageJsx));
assert("modals outside parent card", /profile-card[\s\S]*<\/div>\s*<PixCheckoutModal/.test(pageJsx));
assert("Atualizar button removed", !pageJsx.includes(">Atualizar<"));
assert("header refresh button removed", !/S7PageHeader[\s\S]*actions=\{/.test(pageJsx));
assert("refreshAllData preserved for modals", pageJsx.includes("refreshAllData"));
assert("automatic payment history fetch on mount", paymentHistoryHook.includes("useEffect"));
assert("automatic revenue health fetch on mount", revenueHook.includes("useEffect"));
assert("retry buttons preserved", pageJsx.includes("Tentar novamente") && pageJsx.includes("onRetry={refreshHealth}"));
assert("12px gutter token preserved", profileCss.includes("--s7-empresa-page-gutter: 12px"));
assert("minha-assinatura shell css preserved", billingCss.includes(".minha-assinatura-page .profile-card.s7-minha-assinatura-hero"));
assert("historico hero overflow visible", billingCss.includes(".s7-historico-financeiro-page .profile-card.s7-historico-financeiro-hero"));

if (failures.length) {
  console.error("[S1.HISTORICO-FINANCEIRO.1 unit] FAIL");
  for (const failure of failures) console.error(" -", failure);
  process.exit(1);
}

console.log("[OK] test_historico_financeiro_shell_unit.mjs");
